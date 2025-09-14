from flask import Flask
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

def create_app():
    app = Flask(__name__)

    # === Blueprint 등록 ===
    from app.routes.auth_routes import auth_bp
    from app.routes.favorites_routes import favorites_bp
    from app.routes.speech_routes import speech_bp
    from app.routes.stt_routes import stt_bp
    from app.routes.ocr_routes import ocr_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(favorites_bp, url_prefix="/favorites")
    app.register_blueprint(speech_bp, url_prefix="/speech")
    app.register_blueprint(stt_bp, url_prefix="/stt")
    app.register_blueprint(ocr_bp, url_prefix="/ocr")

    # === Socket 등록 ===
    from app.sockets.navigation_socket import NavigationNamespace
    from app.sockets.yolo_socket import YoloNamespace

    socketio.on_namespace(NavigationNamespace("/navigation"))
    socketio.on_namespace(YoloNamespace("/yolo"))

    return app
