
from flask import Blueprint, request, jsonify
from app import db
from app.models.Event import Event
from app.models.Asset import Asset, AssetStatus
from app.config import Config
from app.storage.s3 import s3_client
import os
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)


asset_bp = Blueprint("assets", __name__)

def validate_event_authorization(user_id, event_id):
    event = Event.query.filter_by(id=event_id).first()
    if not event or str(user_id) != str(event.user_id):
        return False
    return True

@asset_bp.route("", methods=["POST"])
@jwt_required()
def create_upload_link(event_id):
    data = request.json
    user_id = get_jwt_identity()

    if not validate_event_authorization(user_id, event_id):
        return jsonify({
            "error": "Unauthorized"
        }), 403
    
    filename = data.get("filename")
    mime_type = data.get("mime_type")

    if not filename or not mime_type:
        return jsonify({
            "error": "Missing Fields"
        }), 400
    asset = Asset(name=filename, mime_type=mime_type, event_id=event_id)
    db.session.add(asset)
    db.session.commit()

    presigned_url = s3_client.generate_presigned_post(
        Bucket=Config.BUCKET,
        Key='events/' + str(event_id) + '/assets/' + str(asset.id),
        Fields={"Content-Type": mime_type},
        Conditions=[
            {"Content-Type": mime_type}
        ],
    )

    return jsonify({
        "id": asset.id,
        "upload_url": presigned_url
    }), 200



@asset_bp.route("<uuid:asset_id>/upload_complete", methods=["PATCH"])
@jwt_required()
def upload_complete(event_id, asset_id):
    data = request.json
    user_id = get_jwt_identity()

    if not validate_event_authorization(user_id, event_id):
        return jsonify({
            "error": "Unauthorized"
        }), 403
    
    asset = db.session.get(Asset, asset_id)
    if not asset or asset.event_id != event_id:
        return jsonify({
            "error": "Asset Not Found"
        }), 400
    
    asset.status = AssetStatus.uploaded
    asset.duration_ms = data.get("duration_ms")
    # f"https:/{Config.BUCKET}.s3.{Config.AWS_REGION}.amazonaws.com/events/{asset.event_id}/assets/{asset.id}"
    asset.path =f"https://{Config.BUCKET}.s3.{Config.AWS_REGION}.amazonaws.com/events/{asset.event_id}/assets/{asset.id}"
    db.session.commit()

    return jsonify({
        "id": asset.id,
        "status": asset.status.value
    })

@asset_bp.route("<uuid:asset_id>", methods=["PATCH"])
@jwt_required()
def patch_asset(event_id, asset_id):
    data = request.json
    user_id = get_jwt_identity()

    if not validate_event_authorization(user_id, event_id):
        return jsonify({
            "error": "Unauthorized"
        }), 403
    
    asset = db.session.get(Asset, asset_id)
    if not asset or asset.event_id != event_id:
        return jsonify({
            "error": "Asset Not Found"
        }), 400
    
    if "active" in data:
        asset.active = bool(data["active"])
    if "start_media_ms" in data:
        try:
            asset.start_media_ms = int(data["start_media_ms"])
        except (TypeError, ValueError):
            return jsonify({"error": "start_media_ms must be integer ms"}), 400

    db.session.commit()
    return jsonify({
        "id": str(asset.id),
        "status": asset.status.value,
        "active": asset.active,
        "start_media_ms": asset.start_media_ms,
    }), 200