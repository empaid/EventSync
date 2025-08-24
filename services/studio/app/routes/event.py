from flask import Blueprint, request, jsonify
from app import db
from app.models.Event import Event
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)

event_bp = Blueprint("events", __name__)

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
        })
    return jsonify({
        "events": result
    }), 200