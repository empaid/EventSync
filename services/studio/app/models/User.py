from app import db
import uuid
from sqlalchemy.dialects.postgresql import UUID
import bcrypt

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,        # Python-side default
        nullable=False
    )
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary(255), nullable=False)

    events = db.relationship("Event", back_populates="user")

    def set_password_hash(self, password: str):
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    def check_password_hash(self, password: str):
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash)


