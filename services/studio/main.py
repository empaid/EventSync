from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room
import time
app = Flask(__name__)
app.config['SECRET_KEY'] = 'temp_key'

socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template("index.html")


@app.route('/admin')
def admin():
    return render_template("admin.html")


@app.route('/sync')
def sync():
    current_seconds = request.args.get("current_seconds",0)
    play_state = request.args.get("play_state")
    target_server_ms = int(time.time()*1000) + 2000

    socketio.emit('sync', {"current_seconds": int(current_seconds), "play_state": play_state, "target_server_ms": target_server_ms })
    return current_seconds

@socketio.on('fetch_server_time')
def handle_time(client_sent_ms):
    server_now_ms = int(time.time() * 1000)
    emit("server_time", {"server_now_ms": server_now_ms, "client_echo_ms": client_sent_ms})




if __name__=='__main__':
    socketio.run(app, host="0.0.0.0", port="7900", debug=True)