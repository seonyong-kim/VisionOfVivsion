from flask import Blueprint, jsonify, request

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    # TODO: 로그인 로직 추가
    return jsonify({"message": "login success", "user": data}), 200
