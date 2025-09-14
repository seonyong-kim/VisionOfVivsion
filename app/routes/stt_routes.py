from flask import Blueprint, request, jsonify
from app.services.stt_service import run_stt

stt_bp = Blueprint("stt", __name__)

@stt_bp.route("/", methods=["POST"])
def stt():
    music_mode = (request.args.get("mode") == "music")
    try:
        if "audio" in request.files:
            audio_file = request.files["audio"]
            result = run_stt(audio_file=audio_file, music_mode=music_mode)
        else:
            raw_bytes = request.get_data(cache=False, as_text=False)
            if not raw_bytes:
                return jsonify({"error": "No audio provided"}), 400
            ctype = request.headers.get("Content-Type", "")
            result = run_stt(raw_bytes=raw_bytes, mimetype_header=ctype, music_mode=music_mode)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
