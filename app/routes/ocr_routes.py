from flask import Blueprint, request, jsonify
from app.services.ocr_service import run_ocr

ocr_bp = Blueprint("ocr", __name__)

@ocr_bp.route("/image", methods=["POST"])
def ocr_image():
    if "image" not in request.files:
        return jsonify({"error":"No image uploaded"}), 400

    image_file = request.files["image"]
    if image_file.content_type not in ["image/jpeg","image/png"]:
        return jsonify({"error":"지원하지 않는 형식 (JPG, PNG만 가능)"}), 400

    try:
        result = run_ocr(image_file)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error":str(e)}), 500
