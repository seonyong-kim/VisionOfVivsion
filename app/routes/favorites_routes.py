from flask import Blueprint, request, jsonify
from app.services.favorites_service import (
    get_favorites, create_favorite, update_favorite, delete_favorite
)

favorites_bp = Blueprint("favorites", __name__)

# GET /favorites?device_id=abc123
@favorites_bp.route("/", methods=["GET"])
def list_favorites():
    device_id = request.args.get("device_id")
    if not device_id:
        return jsonify({"error": "device_id required"}), 400
    return jsonify(get_favorites(device_id))

# POST /favorites
@favorites_bp.route("/", methods=["POST"])
def add_favorite():
    data = request.get_json()
    device_id = data.get("deviceId")
    name = data.get("name")
    address = data.get("address")
    if not all([device_id, name, address]):
        return jsonify({"error": "Missing fields"}), 400
    return jsonify(create_favorite(device_id, name, address))

# PUT /favorites/<id>
@favorites_bp.route("/<int:fav_id>", methods=["PUT"])
def change_favorite(fav_id):
    data = request.get_json()
    device_id = data.get("device_id")
    name = data.get("name")
    address = data.get("address")
    if not all([device_id, name, address]):
        return jsonify({"error": "Missing fields"}), 400
    return jsonify(update_favorite(fav_id, device_id, name, address))

# DELETE /favorites/<id>
@favorites_bp.route("/<int:fav_id>", methods=["DELETE"])
def remove_favorite(fav_id):
    device_id = request.headers.get("Device-ID")
    if not device_id:
        return jsonify({"error": "Device-ID header required"}), 400
    return jsonify(delete_favorite(fav_id, device_id))
