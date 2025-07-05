from flask import Flask, request, jsonify
import requests
import base64
import numpy as np
import cv2
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 환경변수에서 Clova 정보 로드
CLOVA_SECRET_KEY = os.environ.get("CLOVA_SECRET_KEY")
CLOVA_INVOKE_URL = os.environ.get("CLOVA_INVOKE_URL")

# 이미지 base64 인코딩 함수
def encode_image_to_base64(image):
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

# OCR 이미지 처리 엔드포인트
@app.route('/ocr/image', methods=['POST'])
def ocr():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']

    try:
        np_array = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("OpenCV failed to decode image")
    except Exception as e:
        return jsonify({'error': f"Image decoding error: {str(e)}"}), 401

    encoded_image = encode_image_to_base64(image)

    request_json = {
        "version": "V2",
        "requestId": str(uuid.uuid4()),
        "timestamp": int(uuid.uuid1().time / 1e7),
        "images": [
            {
                "format": "jpg",
                "name": "image",
                "data": encoded_image
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "X-OCR-SECRET": CLOVA_SECRET_KEY
    }

    try:
        response = requests.post(CLOVA_INVOKE_URL, headers=headers, json=request_json)
        response.raise_for_status()
        result_json = response.json()
    except Exception as e:
        return jsonify({'error': f"Clova OCR API error: {str(e)}"}), 500

    try:
        fields = result_json['images'][0]['fields']
        extracted_text = "\n".join([field['inferText'] for field in fields])
        if not extracted_text.strip():
            return jsonify({"text": "인식된 글자가 없습니다. 다시 시도해 주세요."})
        return jsonify({"text": extracted_text})
    except Exception:
        return jsonify({"text": "텍스트 추출에 실패했습니다."}), 500

# 루트 경로에 GET만 허용 (브라우저 테스트용)
@app.route('/', methods=['GET'])
def index():
    return "Clova OCR 서버가 실행 중입니다."

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)