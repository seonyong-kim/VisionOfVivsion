from flask import Flask, request, Response
from dotenv import load_dotenv
import os, requests, json, time, re, cv2, numpy as np, tempfile
from statistics import mean, median
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

# --- 환경 ---
load_dotenv()
CLOVA_SECRET_KEY = os.getenv("CLOVA_SECRET_KEY")
CLOVA_INVOKE_URL = os.getenv("CLOVA_INVOKE_URL")
GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = Flask(__name__)

# ---------- 유틸 ----------
def english_ratio(text:str)->float:
    eng = len(re.findall(r'[a-zA-Z]', text))
    tot = len(text)
    return eng / tot if tot else 0.0

def safe_json(data, status=200):
    return Response(json.dumps(data, ensure_ascii=False), mimetype='application/json', status=status)

# ---------- 이미지 전처리 (강화) ----------
def _deskew(gray):
    # 에지 → 허프 직선으로 기울기 추정
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=gray.shape[1]//3, maxLineGap=20)
    if lines is None: 
        return gray
    angles = []
    for x1,y1,x2,y2 in lines[:,0]:
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        # 거의 수평에 가까운 선만 사용
        if -20 < angle < 20:
            angles.append(angle)
    if not angles:
        return gray
    rot = -np.median(angles)
    (h,w) = gray.shape[:2]
    M = cv2.getRotationMatrix2D((w//2, h//2), rot, 1.0)
    return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def preprocess_variants(file_storage):
    """원본 바이너리와 전처리본(디스큐+강조) 두 가지 버전을 반환"""
    data = file_storage.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("이미지를 디코딩할 수 없습니다.")
    # 원본을 약간만 업샘플(얇은 폰트 보정)
    base = cv2.resize(img, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

    # 전처리 파이프라인
    gray = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)
    gray = _deskew(gray)
    # 대비 향상 + 가우시안 노이즈 억제
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)
    gray = cv2.GaussianBlur(gray, (3,3), 0)
    # 얇은 글자 강조(언샵 샤프)
    sharp = cv2.addWeighted(gray, 1.5, cv2.GaussianBlur(gray, (0,0), 1.0), -0.5, 0)
    # 이진화(적응형 + Otsu 중 좋은 것 선택)
    _, otsu = cv2.threshold(sharp, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adapt = cv2.adaptiveThreshold(sharp, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                  cv2.THRESH_BINARY, 25, 10)
    # 가독성 비교: 평균 밝기 기준으로 과도한 반전 방지
    bin_img = adapt if np.mean(adapt) < 200 else otsu

    # 얇은 획 보강(미세 팽창)
    kernel = np.ones((1,1), np.uint8)
    bin_img = cv2.morphologyEx(bin_img, cv2.MORPH_CLOSE, kernel, iterations=1)

    # 바이너리로 인코딩
    ok1, buf1 = cv2.imencode('.jpg', base)
    ok2, buf2 = cv2.imencode('.jpg', bin_img)
    if not (ok1 and ok2):
        raise ValueError("이미지 인코딩 실패")
    return [('orig', buf1.tobytes()), ('proc', buf2.tobytes())]

# ---------- Clova OCR ----------
def clova_request(image_bytes, lang='en'):
    headers = {"X-OCR-SECRET": CLOVA_SECRET_KEY}
    message = {
        "version": "V2",
        "requestId": f"req-{int(time.time()*1000)}",
        "timestamp": int(time.time()*1000),
        "images": [{
            "format": "jpg",
            "name": "image",
            "lang": lang   # en 또는 ko
        }]
    }
    files = {
        'file': ("image.jpg", image_bytes, "image/jpeg"),
        'message': (None, json.dumps(message), 'application/json')
    }
    r = requests.post(CLOVA_INVOKE_URL, headers=headers, files=files, timeout=15)
    r.raise_for_status()
    j = r.json()
    fields = (j.get('images') or [{}])[0].get('fields') or []
    return fields

def avg_conf(fields):
    confs = [f.get('inferConfidence', 0) for f in fields if isinstance(f.get('inferConfidence', None), (int, float))]
    return (mean(confs) if confs else 0.0, median(confs) if confs else 0.0)

# ---------- 라인 재구성(동적 y 허용오차) ----------
def reconstruct_paragraph(fields):
    # 너무 작은 텍스트 & 낮은 신뢰도 제거(풋터 등)
    cleaned = []
    for f in fields:
        poly = f.get('boundingPoly', {}).get('vertices', [])
        if len(poly) < 4: 
            continue
        ys = [v.get('y', 0) for v in poly]
        xs = [v.get('x', 0) for v in poly]
        height = max(ys) - min(ys)
        conf = f.get('inferConfidence', 0)
        if height < 8 or conf < 0.45:
            continue
        y_center = int(sum(ys) / len(ys))
        x_left = min(xs)
        cleaned.append({
            "y_center": y_center,
            "x_left": x_left,
            "height": height,
            "text": f.get('inferText', '')
        })
    if not cleaned:
        return ""

    # y_center, x 정렬
    cleaned.sort(key=lambda z: (z["y_center"], z["x_left"]))

    lines, current = [], []
    prev_y, avg_h = None, mean([c["height"] for c in cleaned])
    y_tol = max(10, int(avg_h * 0.8))  # 동적 허용오차
    for c in cleaned:
        if prev_y is None or abs(c["y_center"] - prev_y) <= y_tol:
            current.append(c["text"])
        else:
            lines.append(" ".join(current))
            current = [c["text"]]
        prev_y = c["y_center"]
    if current: lines.append(" ".join(current))
    return "\n".join(lines)

# ---------- 경미한 치환(정확도 보존 목적) ----------
IO_FIX_RULES = [
    (re.compile(r'(?<=\b)1/0(?=\b)', flags=re.IGNORECASE), 'I/O'),
    (re.compile(r'(?<=\b)l/0(?=\b)', flags=re.IGNORECASE), 'I/O'),
]

def light_normalize(text:str)->str:
    out = text
    for pat, repl in IO_FIX_RULES:
        out = pat.sub(repl, out)
    return out

# ---------- 번역 & 문단 정리(기존 함수 재사용) ----------
def translate_with_google(text, target='ko'):
    url = "https://translation.googleapis.com/language/translate/v2"
    params = {'q': text, 'target': target, 'format': 'text', 'key': GOOGLE_TRANSLATE_API_KEY}
    try:
        r = requests.post(url, data=params, timeout=5)
        r.raise_for_status()
        return r.json()['data']['translations'][0]['translatedText']
    except requests.exceptions.RequestException:
        return f"[번역실패] {text}"

def split_into_sentences(text):
    sentence_endings = re.compile(r'(?<=[.?!])\s+')
    return [s.strip() for s in sentence_endings.split(text.strip()) if s.strip()]

def translate_mixed_sentence(sentence, threshold=0.3):
    if english_ratio(sentence) < threshold:
        words = sentence.split()
        out = []
        for w in words:
            if re.search(r'[a-zA-Z]', w):
                out.append(f"{w}({translate_with_google(w)})")
            else:
                out.append(w)
        return " ".join(out)
    else:
        return translate_with_google(sentence)

def translate_paragraph_mixed(paragraph):
    return "\n".join(translate_mixed_sentence(s) for s in split_into_sentences(paragraph))

def refine_paragraph_with_groq(text, lang="ko"):
    if not GROQ_API_KEY:
        return text
    if lang == "ko":
        prompt = "당신은 한국어 문장을 문단 단위로 자연스럽게 정리하는 도우미입니다."
        instruction = f"다음 한국어 텍스트를 문단 단위로 정돈해줘:\n\n{text}"
    else:
        prompt = "You are a helpful assistant."
        instruction = f"Please structure the following English text into coherent paragraphs:\n\n{text}"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    data = {"model": "llama3-70b-8192", "messages":[{"role":"system","content":prompt},{"role":"user","content":instruction}]}
    try:
        r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=10)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception:
        return text

# ---------- 메인 API ----------
@app.route('/ocr/image', methods=['POST'])
def ocr_image():
    if 'image' not in request.files:
        return safe_json({'error': 'No image uploaded'}, 400)

    image_file = request.files['image']
    if image_file.content_type not in ['image/jpeg', 'image/png', 'application/pdf']:
        return safe_json({'error': 'JPG, PNG, PDF만 가능합니다.'}, 400)

    try:
        # 다중 시도: (원본/전처리) × (en/ko)
        variants = preprocess_variants(image_file)
        lang_candidates = ['en', 'ko']

        best = {"score": -1, "fields": None, "raw_text": "", "chosen": None}
        for tag, img_bytes in variants:
            for lang in lang_candidates:
                try:
                    fields = clova_request(img_bytes, lang=lang)
                except requests.RequestException as e:
                    continue
                # 신뢰도 기반 스코어 (평균 0.7, 중앙값 가중)
                m, md = avg_conf(fields)
                score = (m * 0.7) + (md * 0.3)
                if score > best["score"] and fields:
                    raw = reconstruct_paragraph(fields)
                    best = {"score": score, "fields": fields, "raw_text": raw, "chosen": f"{tag}|{lang}"}

        if not best["fields"]:
            return safe_json({'text': '글자가 인식되지 않았습니다.'}, 200)

        raw_text = light_normalize(best["raw_text"])

        # 이후 파이프라인(정리/번역)
        lang_out = "en" if english_ratio(raw_text) >= 0.3 else "ko"
        refined_text = refine_paragraph_with_groq(raw_text, lang=lang_out)
        translated_text = translate_paragraph_mixed(refined_text)

        return safe_json({
            'chosen_variant': best["chosen"],
            'confidence_score': round(best["score"], 4),
            'original_text': raw_text,
            'refined_text': refined_text,
            'translated_text': translated_text
        })

    except Exception as e:
        return safe_json({'error': f"서버 처리 중 오류 발생: {str(e)}"}, 500)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002)