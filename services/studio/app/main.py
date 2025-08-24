import os
from app import create_app
from app.socket.socketio import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        host=os.getenv("FLASK_RUN_HOST", "0.0.0.0"),
        port=int(os.getenv("FLASK_RUN_PORT", "8000")),
        debug=bool(os.getenv("FLASK_DEBUG", "1") == "1"),
    )