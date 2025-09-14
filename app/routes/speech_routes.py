from flask import Blueprint, request, jsonify
from app.services.speech_service import get_speech, save_speech

speech_bp = Blueprint("speech", __name__)

# GET /speech?device_id=xxx
@speech_bp.route("/setting", methods=["GET"])
def get_speech_info():
    device_id = request.args.get("device_id")
    if not device_id:
        return jsonify({"error": "device_id is required"}), 400

    try:
        result = get_speech(device_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# POST /speech
@speech_bp.route("/setting", methods=["POST"])
def create_or_update_speech():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    device_id = data.get("deviceId")
    rate = data.get("rate")
    pitch = data.get("pitch")

    if not device_id or rate is None or pitch is None:
        return jsonify({"error": "deviceId, rate, pitch are required"}), 400

    try:
        result = save_speech(device_id, rate, pitch)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
