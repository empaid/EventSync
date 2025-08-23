from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config, Debug

db = SQLAlchemy()
migrate = Migrate()

def create_app(config: type[Config] = Config):
    app = Flask(__name__)
    app.config.from_object(config)
    app.config.from_prefixed_env()
    db.init_app(app)
    migrate.init_app(app, db)
    
    return app

if __name__=='__main__':
    app = create_app(config=Debug)
    app.run( host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)