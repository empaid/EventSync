from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .config import Config, Debug
from flask_jwt_extended import JWTManager
from app.storage import s3

db = SQLAlchemy()
migrate = Migrate()

def create_app(config: type[Config] = Config):
    app = Flask(__name__)
    app.config.from_object(config)
    app.config.from_prefixed_env()
    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)

    s3.ensure_asset_bucket()

    from app.routes.user import user_bp
    app.register_blueprint(user_bp, url_prefix="/users")

    from app.routes.event import event_bp
    app.register_blueprint(event_bp, url_prefix="/events")

    from app.routes.asset import asset_bp
    app.register_blueprint(asset_bp, url_prefix='/events/<uuid:event_id>/assets')

    return app
