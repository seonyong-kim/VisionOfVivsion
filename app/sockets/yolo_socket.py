from flask_socketio import Namespace, emit
from app.services.yolo_service import set_target, clear_target, detect_image, CLASS_NAMES

class YoloNamespace(Namespace):
    def on_connect(self):
        emit("status", {"msg": "Connected to YOLO server"})
        emit("class_names", {"classes": CLASS_NAMES})

    def on_disconnect(self):
        print("Client disconnected")

    def on_set_target(self, data):
        result = set_target(data.get("query", ""))
        emit("target_result", result)

    def on_clear_target(self):
        emit("target_cleared", clear_target())

    def on_image(self, data):
        try:
            detections = detect_image(data["image"])
            emit("detection", detections)
        except Exception as e:
            emit("error", {"msg": str(e)})
