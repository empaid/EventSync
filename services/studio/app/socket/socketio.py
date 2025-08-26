from flask_socketio import SocketIO, Namespace, emit, join_room
import time
from flask import request
from app.models.Event import Event
from sqlalchemy.orm import selectinload

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode=None
)


def room_id(event_id): 
    return f"event:{event_id}"

class EventNamespace(Namespace):
    
    def on_join_event(self, data):
        
        event_id = data.get("event_id")
        if not event_id:
            emit({"error": {"error": "event_id is required"}})
        
        join_room(room_id(str(event_id)))

        event = (
            Event.query
            .options(selectinload(Event.assets))
            .filter_by(id=event_id)
            .first()
        )

        emit("joined", {"room": room_id(str(event_id)), "event": {
            "id": str(event.id),
            "title": event.title,
            "live": event.live,
            "assets_count": len(event.assets),
            "assets": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "mime_type": a.mime_type,
                    "status": a.status.value,
                    "duration_ms": a.duration_ms,
                    "path":a.path,
                    "start_media_ms": a.start_media_ms,
                    "active": a.active
                }
                for a in event.assets
            ],
        }})


    def on_fetch_server_time(self, data):
        server_now_ms = int(time.time() * 1000)
        emit("server_time", {"server_now_ms": server_now_ms, "client_echo_ms": data})

    def on_sync(self, data):
        
        event_id = data.get("event_id")
        elapsed_ms = data.get("elapsed_ms")
        print(elapsed_ms)
        print("sync room", room_id(str(event_id)))
        emit(
            "sync_client",
             {
                "target_server_ms": elapsed_ms,
                "play_state": "play"
            },
            to=room_id(str(event_id))
        )

    def on_event_broadcast(self, data):
        event_id = data.get("event_id")
        event_name = data.get("event_name")
        payload = data.get("payload")
        if not event_id or not event_name:
            return
        print("Sync room", room_id(str(event_id)))
        socketio.emit(
            event_name,
            payload,
            to=room_id(str(event_id)),
            namespace="/event"
        )
    
def emit_to_event(event_id, event_name, payload, skip_sid=None):
    socketio.emit(
        event_name,
        payload,
        to=room_id(str(event_id)),
        namespace="/event",
        skip_sid=skip_sid
    )


def init_socketio(app):
    socketio.init_app(app)
    socketio.on_namespace(EventNamespace("/event"))