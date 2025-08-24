from flask import Blueprint, request, jsonify
from app import db
from app.models.Event import Event
from sqlalchemy.orm import selectinload
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)

event_bp = Blueprint("events", __name__)

def validate_event_authorization(user_id, event_id):
    event = Event.query.filter_by(id=event_id).first()
    if not event or str(user_id) != str(event.user_id):
        return False
    return True


@event_bp.route("", methods=["POST"])
@jwt_required()
def create_event():
    data = request.json
    user_id = get_jwt_identity()
    if not data or not "title" in data:
        return jsonify({
            "error": "Missing fields"
        }), 400
    
    existing_event = Event.query.filter_by(title=data["title"]).first()
    if existing_event:
        return jsonify({
            "error": "This title is already taken"
        }), 400
    
    event = Event(title=data["title"], user_id=user_id)
    db.session.add(event)
    db.session.commit()
    return jsonify({
        "event": {
            "id": event.id,
            "title": event.title
        }
    })


@event_bp.route("", methods=["GET"])
@jwt_required()
def list_events():
    user_id = get_jwt_identity()
    
    events = Event.query.filter_by(user_id=user_id)
    result = []
    for event in events:
        result.append({
            "id": event.id,
            "title": event.title, 
            "live": event.live
        })
    return jsonify({
        "events": result
    }), 200


@event_bp.route("/<uuid:event_id>", methods=["GET"])
@jwt_required()
def get_event(event_id):
    user_id = get_jwt_identity()
    ev = (
        Event.query
        .options(selectinload(Event.assets))
        .filter_by(id=event_id, user_id=user_id)
        .first()
    )
    if not ev:
        return jsonify({"error": "Not Found"}), 404

    return jsonify({
        "id": str(ev.id),
        "title": ev.title,
        "live": ev.live,
        "assets_count": len(ev.assets),
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
            for a in ev.assets
        ],
    }), 200