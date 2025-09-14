import cv2, re, numpy as np
from io import BytesIO

def preprocess_image_for_ocr(file_storage):
    np_arr = np.frombuffer(file_storage.read(), np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("이미지를 디코드할 수 없습니다.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    ok, buf = cv2.imencode('.png', thresh)
    if not ok:
        raise ValueError("이미지 인코딩 실패")
    return BytesIO(buf.tobytes())

def reconstruct_paragraph(fields, y_tolerance=10):
    sorted_fields = sorted(fields, key=lambda f: (
        f['boundingPoly']['vertices'][0].get('y', 0),
        f['boundingPoly']['vertices'][0].get('x', 0)
    ))
    lines, current_line, prev_y = [], [], None
    for field in sorted_fields:
        v = field['boundingPoly']['vertices']
        y = v[0].get('y', 0)
        text = field.get('inferText', '')
        if prev_y is None or abs(y - prev_y) <= y_tolerance:
            current_line.append(text)
        else:
            if current_line: lines.append(" ".join(current_line))
            current_line = [text]
        prev_y = y
    if current_line: lines.append(" ".join(current_line))
    return "\n".join(lines)
