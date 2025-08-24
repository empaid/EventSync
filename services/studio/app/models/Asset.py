from app import db
import uuid
from sqlalchemy.dialects.postgresql import UUID
import bcrypt
import enum

class AssetStatus(enum.Enum):
    pending = "pending"
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"

class Asset(db.Model):
    __tablename__ = "assets"
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,        # Python-side default
        nullable=False
    )
    name = db.Column(db.String(255), unique=True, nullable=False)
    mime_type = db.Column(db.String(255), nullable=False)
    event_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("events.id"), nullable=False)
    path = db.Column(db.TEXT)
    duration_ms = db.Column(db.BigInteger)
    start_media_ms = db.Column(db.BigInteger)
    status = db.Column(db.Enum(AssetStatus, name="asset_status"), nullable=False, default=AssetStatus.pending)
    active=db.Column(db.Boolean, default=True)
    event = db.relationship("Event", back_populates="assets")