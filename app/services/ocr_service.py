import time, json, requests, os
from app.utils.ocr_image_utils import preprocess_image_for_ocr, reconstruct_paragraph
from app.utils.translate_utils import translate_paragraph_by_sentence

CLOVA_SECRET_KEY = os.getenv("CLOVA_SECRET_KEY")
CLOVA_INVOKE_URL = os.getenv("CLOVA_INVOKE_URL")
GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")

OCR_TIMEOUT = 10

def run_ocr(image_file):
    processed_buffer = preprocess_image_for_ocr(image_file)
    image_data = processed_buffer.getvalue()
    headers = {"X-OCR-SECRET": CLOVA_SECRET_KEY}

    message = {
        "version": "V2",
        "requestId": "sample-request-id",
        "timestamp": int(time.time()*1000),
        "images": [{"format":"png","name":"sample_image","lang":"ko"}]
    }
    files = {
        "file": ("image.png", image_data, "image/png"),
        "message": (None, json.dumps(message), "application/json")
    }

    response = requests.post(CLOVA_INVOKE_URL, headers=headers, files=files, timeout=OCR_TIMEOUT)
    response.raise_for_status()

    result = response.json()
    fields = result.get("images", [{}])[0].get("fields", [])
    if not fields:
        return {"original_text":"", "translated_text":"글자가 인식되지 않았습니다."}

    raw_text = reconstruct_paragraph(fields)
    translated_text = translate_paragraph_by_sentence(raw_text, GOOGLE_TRANSLATE_API_KEY)
    return {"original_text": raw_text, "translated_text": translated_text}
