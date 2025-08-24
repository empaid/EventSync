from app import db
import uuid
from sqlalchemy.dialects.postgresql import UUID
import bcrypt

class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,        # Python-side default
        nullable=False
    )
    title = db.Column(db.String(255), unique=True, nullable=False)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    
    user = db.relationship("User", back_populates="events")
    assets = db.relationship("Asset", back_populates="event")