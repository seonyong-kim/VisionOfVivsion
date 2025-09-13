from flask import Flask, request, Response
from dotenv import load_dotenv
import os
import requests
import json
import time
import re
import cv2
import numpy as np
from io import BytesIO
from requests.adapters import HTTPAdapter, Retry
import boto3

# 이부분은 AWS에서 key값을 불러오게 하기 위해 설정한 부분입니다.
def load_ssm_to_env(param_map, region="ap-northeast-2"):
    ssm = boto3.client('ssm', region_name=region)
    for env_name, ssm_name in param_map.items():
        response = ssm.get_parameter(Name=ssm_name, WithDecryption=True)
        os.environ[env_name] = response['Parameter']['Value']

# 불러올 SSM 파라미터 이름 매핑
PARAMS = {
"CLOVA_INVOKE_URL": "/clova/api-url", # 파라미터 이름
"CLOVA_SECRET_KEY": "/clova/secret-key",
"GOOGLE_TRANSLATE_API_KEY": "/google/translate/api-key",
"GROQ_API_KEY": "/groq/api-key"
}

# 실행 시 SSM에서 읽어 환경변수로 설정
load_ssm_to_env(PARAMS)

# =========================
# 환경 변수 로드
# =========================
load_dotenv()
CLOVA_SECRET_KEY = os.getenv("CLOVA_SECRET_KEY")
CLOVA_INVOKE_URL = os.getenv("CLOVA_INVOKE_URL")
GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")

app = Flask(__name__)

# =========================
# 외부 호출 세션 (재시도/백오프)
# =========================
session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=0.3,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["POST", "GET", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
session.mount("https://", HTTPAdapter(max_retries=retries))
session.mount("http://", HTTPAdapter(max_retries=retries))

OCR_TIMEOUT = 10
TRANSLATE_TIMEOUT = 5

# =========================
# 이미지 전처리 (CLAHE + Otsu) -> PNG 메모리 버퍼 반환
# =========================
def preprocess_image_for_ocr(file_storage):
    np_arr = np.frombuffer(file_storage.read(), np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        # 디코딩 실패 방어
        raise ValueError("이미지를 디코드할 수 없습니다.")

    # grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # contrast enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    # binarization (Otsu)
    _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # PNG 인코딩 후 메모리로 반환
    ok, buf = cv2.imencode('.png', thresh)
    if not ok:
        raise ValueError("이미지 인코딩에 실패했습니다.")
    return BytesIO(buf.tobytes())

# =========================
# 언어 감지(영문 비율)
# =========================
def english_ratio(text):
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total_chars = len(text)
    return english_chars / total_chars if total_chars > 0 else 0.0

# =========================
# 문장 분리 (기존 간단 규칙 유지)
# =========================
def split_into_sentences(text):
    sentence_endings = re.compile(r'(?<=[.?!])\s+')
    return [s.strip() for s in sentence_endings.split(text.strip()) if s.strip()]

# =========================
# 구글 번역 - 배치 호출
# =========================
def translate_batch_with_google(sentences, target='ko'):
    if not sentences:
        return []
    url = "https://translation.googleapis.com/language/translate/v2"
    data = {
        'target': target,
        'format': 'text',
        'key': GOOGLE_TRANSLATE_API_KEY
    }
    # q를 배열로 전송
    for s in sentences:
        data.setdefault('q', []).append(s)

    try:
        r = session.post(url, data=data, timeout=TRANSLATE_TIMEOUT)
        r.raise_for_status()
        trans = r.json()['data']['translations']
        return [t.get('translatedText', s) for t, s in zip(trans, sentences)]
    except requests.exceptions.RequestException as e:
        print(f"[번역 오류] {str(e)}")
        return [f"[번역실패] {s}" for s in sentences]

# 문단 단위 -> 문장 분리 후 영어 비율 높은 문장만 배치 번역
def translate_paragraph_by_sentence(paragraph, threshold=0.3, target='ko'):
    sents = split_into_sentences(paragraph)
    idxs = [i for i, s in enumerate(sents) if english_ratio(s) >= threshold]
    if not idxs:
        return "\n".join(sents)
    batch = [sents[i] for i in idxs]
    outs = translate_batch_with_google(batch, target=target)
    for j, i in enumerate(idxs):
        sents[i] = outs[j]
    return "\n".join(sents)

# =========================
# 좌표 기반 정렬 후 문단 구성 (기존 간단 버전 유지)
# =========================
def reconstruct_paragraph(fields, y_tolerance=10):
    sorted_fields = sorted(
        fields,
        key=lambda f: (
            f['boundingPoly']['vertices'][0].get('y', 0),
            f['boundingPoly']['vertices'][0].get('x', 0)
        )
    )
    lines = []
    current_line = []
    prev_y = None

    for field in sorted_fields:
        v = field['boundingPoly']['vertices']
        y = v[0].get('y', 0)
        text = field.get('inferText', '')
        if prev_y is None or abs(y - prev_y) <= y_tolerance:
            current_line.append(text)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [text]
        prev_y = y

    if current_line:
        lines.append(" ".join(current_line))

    return "\n".join(lines)

# =========================
# OCR 엔드포인트
# =========================
@app.route('/ocr/image', methods=['POST'])
def ocr_image():
    if 'image' not in request.files:
        return Response(
            json.dumps({'error': 'No image uploaded'}, ensure_ascii=False),
            mimetype='application/json',
            status=400
        )

    image_file = request.files['image']

    # 쉬운 방어: PDF 임시 차단 (나중에 PDF 처리 추가 시 다시 허용)
    allowed_types = ['image/jpeg', 'image/png']
    if image_file.content_type not in allowed_types:
        return Response(
            json.dumps({'error': '지원하지 않는 파일 형식입니다. JPG, PNG만 가능합니다.'}, ensure_ascii=False),
            mimetype='application/json',
            status=400
        )

    try:
        # 이미지 전처리 -> PNG 메모리 버퍼 획득
        processed_buffer = preprocess_image_for_ocr(image_file)
        image_data = processed_buffer.getvalue()

        headers = {"X-OCR-SECRET": CLOVA_SECRET_KEY}

        # Clova에 PNG로 보낼 것
        message = {
            "version": "V2",
            "requestId": "sample-request-id",
            "timestamp": int(time.time() * 1000),
            "images": [
                {
                    "format": "png",     # ★ PNG로 변경
                    "name": "sample_image",
                    "lang": "ko"         # 필요 시 'ko,en' 등으로 외부에서 넘겨 받아도 됨
                }
            ]
        }

        files = {
            'file': ("image.png", image_data, "image/png"),
            'message': (None, json.dumps(message), 'application/json')
        }

        # 세션 + 타임아웃 + 재시도
        response = session.post(CLOVA_INVOKE_URL, headers=headers, files=files, timeout=OCR_TIMEOUT)

        if response.status_code != 200:
            return Response(
                json.dumps({'error': f"OCR API Error: {response.text}"}, ensure_ascii=False),
                mimetype='application/json',
                status=response.status_code
            )

        result = response.json()
        fields = result.get('images', [{}])[0].get('fields', [])

        if not fields:
            return Response(
                json.dumps({'text': '글자가 인식되지 않았습니다.'}, ensure_ascii=False),
                mimetype='application/json',
                status=200
            )

        raw_text = reconstruct_paragraph(fields)
        translated_text = translate_paragraph_by_sentence(raw_text, threshold=0.3, target='ko')

        return Response(
            json.dumps({
                'original_text': raw_text,
                'translated_text': translated_text
            }, ensure_ascii=False),
            mimetype='application/json',
            status=200
        )

    except Exception as e:
        return Response(
            json.dumps({'error': f"서버 처리 중 오류 발생: {str(e)}"}, ensure_ascii=False),
            mimetype='application/json',
            status=500
        )

# =========================
# 개발 서버 구동 (프로덕션에선 gunicorn 등 사용 권장)
# =========================
if __name__ == '__main__':
    # 환경 변수 누락 시 빠른 에러 인지
    missing = [k for k, v in {
        "CLOVA_SECRET_KEY": CLOVA_SECRET_KEY,
        "CLOVA_INVOKE_URL": CLOVA_INVOKE_URL,
        "GOOGLE_TRANSLATE_API_KEY": GOOGLE_TRANSLATE_API_KEY
    }.items() if not v]
    if missing:
        raise RuntimeError(f"환경 변수 누락: {', '.join(missing)}")

    app.run(host="0.0.0.0", port=5002)
