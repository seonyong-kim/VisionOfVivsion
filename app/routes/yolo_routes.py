from flask import Blueprint, request, jsonify
from app.services.yolo_service import detect_image, CLASS_NAMES

yolo_bp = Blueprint("yolo", __name__)

@yolo_bp.route("/image", methods=["POST"])
def detect_objects():
    """
    클라이언트가 이미지를 업로드하면 YOLO 모델로 객체 인식 후 JSON 반환
    - FormData: { image: <file> }
    - 또는 JSON: { "image": "data:image/jpeg;base64,..." }
    """
    try:
        if "image" in request.files:
            # 파일 업로드 방식
            f = request.files["image"]
            b64data = "data:" + f.mimetype + ";base64," + f.read().decode("base64")  # 파일을 base64로 변환
        else:
            # JSON body 방식
            data = request.get_json()
            b64data = data.get("image")
            if not b64data:
                return jsonify({"error": "No image provided"}), 400

        detections = detect_image(b64data)
        return jsonify({
            "classes": CLASS_NAMES,
            "detections": detections
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
