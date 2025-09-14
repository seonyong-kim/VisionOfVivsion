from ultralytics import YOLO
from threading import Lock
from app.utils.yolo_image_utils import base64_to_numpy

# YOLO 모델 로드 (한 번만)
model = YOLO("app/models/yolo.pt")

CLASS_NAMES = model.names
model_lock = Lock()
current_target_idx = None

def set_target(query: str):
    global current_target_idx
    query = (query or "").lower()
    for i, name in enumerate(CLASS_NAMES):
        if query in str(name).lower():
            with model_lock:
                # ultralytics에서는 classes를 예측할 때 전달 가능
                current_target_idx = i
            return {"ok": True, "class": CLASS_NAMES[i]}
    return {"ok": False, "reason": "not_found"}

def clear_target():
    global current_target_idx
    with model_lock:
        current_target_idx = None
    return {"ok": True}

def detect_image(b64image: str):
    img_np = base64_to_numpy(b64image)
    with model_lock:
        if current_target_idx is not None:
            results = model(img_np, classes=[current_target_idx])
        else:
            results = model(img_np)

    detections = []
    for r in results[0].boxes.data.tolist():
        x_min, y_min, x_max, y_max, conf, cls = r
        detections.append({
            "bbox": [int(x_min), int(y_min), int(x_max), int(y_max)],
            "class_name": CLASS_NAMES[int(cls)],
            "confidence": round(float(conf), 2),
        })
    return detections
