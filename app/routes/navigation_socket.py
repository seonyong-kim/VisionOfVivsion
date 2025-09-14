from flask_socketio import Namespace, emit
import base64, io
from PIL import Image
import numpy as np
from app.services.navigation_service import detect_and_track

class NavigationNamespace(Namespace):
    def on_connect(self):
        emit("status", {"msg": "Connected to Navigation server"})

    def on_disconnect(self):
        print("Client disconnected")

    def on_image(self, data):
        try:
            header, b64data = data["image"].split(",", 1)
            img_bytes = base64.b64decode(b64data)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            img_np = np.array(img)

            detections = detect_and_track(img_np)
            emit("detection", detections)
        except Exception as e:
            emit("error", {"msg": str(e)})
