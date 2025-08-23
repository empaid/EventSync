from flask import Blueprint, request, jsonify
from app import db
from app.models.User import User

from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)

user_bp = Blueprint("user", __name__)

@user_bp.route("/", methods=["GET"])
def list_users():
    data = request.json
    users = User.query.all()
    return jsonify({
        "users": users
    })


@user_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required"}), 400
    
    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user is not None:
        return jsonify({"error": "An account already exists"}), 400
    
    user = User(email=data["email"])
    user.set_password_hash(password=data["password"])

    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        "user": {
            "id": user.id,
            "email": user.email
        }
    }), 201

@user_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required"}), 400
    
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password_hash(data["password"]):
        return jsonify({"error": "Invalid Credentials"}), 400
    
    
    return jsonify({
        "accessToken": create_access_token(identity=user.id)
    }), 200
