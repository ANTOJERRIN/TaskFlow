import os
import re
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from uuid import uuid4

from psycopg.errors import UniqueViolation
from pymysql.err import IntegrityError
from flask import Blueprint, abort, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from .database import transaction

auth = Blueprint("auth", __name__, url_prefix="/api/auth")
COOKIE = "taskflow_session"
EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
DUMMY_HASH = generate_password_hash(token_urlsafe(32))


def cookie_hash():
    token = request.cookies.get(COOKIE, "")
    return sha256(token.encode()).digest() if token else None


def current_user():
    token = cookie_hash()
    if not token:
        return None
    with transaction() as cursor:
        cursor.execute("""
            SELECT users.id, users.email FROM login_sessions
            JOIN users ON users.id = login_sessions.user_id
            WHERE token_hash = %s AND expires_at > %s
        """, (token, datetime.now(timezone.utc).replace(tzinfo=None)))
        return cursor.fetchone()


def sign_in_user(cursor, user, remember):
    token = token_urlsafe(32)
    lifetime = timedelta(days=30) if remember else timedelta(hours=12)
    expires = (datetime.now(timezone.utc) + lifetime).replace(tzinfo=None)
    previous = cookie_hash()
    if previous:
        cursor.execute("DELETE FROM login_sessions WHERE token_hash = %s", (previous,))
    cursor.execute("INSERT INTO login_sessions (token_hash, user_id, expires_at) VALUES (%s, %s, %s)",
                   (sha256(token.encode()).digest(), user["id"], expires))
    response = jsonify(user=user)
    response.set_cookie(
        COOKIE, token, httponly=True, samesite="Lax",
        secure=request.is_secure or os.getenv("SESSION_COOKIE_SECURE") == "1",
        max_age=int(lifetime.total_seconds()) if remember else None,
    )
    return response


@auth.get("/session")
def session():
    return jsonify(user=current_user())


@auth.post("/<action>")
def authenticate(action):
    if action not in ("login", "register"):
        abort(404)
    body = request.get_json()
    if not isinstance(body, dict):
        abort(400, "Expected a JSON object.")
    email = body.get("email")
    email = email.strip().lower() if isinstance(email, str) else ""
    password = body.get("password")
    if len(email) > 254 or not EMAIL.fullmatch(email):
        abort(400, "Enter a valid email address.")
    if not isinstance(password, str) or not 1 <= len(password) <= 128:
        abort(400, "Enter a password of up to 128 characters.")
    if action == "register":
        if len(password) < 8:
            abort(400, "Use at least 8 characters for your password.")
        password_hash = generate_password_hash(password)
        user = {"id": str(uuid4()), "email": email}
        with transaction() as cursor:
            try:
                cursor.execute("INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s)",
                               (user["id"], email, password_hash))
            except (IntegrityError, UniqueViolation) as error:
                if isinstance(error, IntegrityError) and error.args[0] != 1062:
                    raise
                abort(409, "An account already uses that email. Sign in instead.")
            return sign_in_user(cursor, user, body.get("remember") is True), 201

    with transaction() as cursor:
        cursor.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        valid = check_password_hash(user.pop("password_hash") if user else DUMMY_HASH, password)
        if not valid or not user:
            abort(401, "Email or password is incorrect.")
        return sign_in_user(cursor, user, body.get("remember") is True)


@auth.post("/logout")
def logout():
    token = cookie_hash()
    if token:
        with transaction() as cursor:
            cursor.execute("DELETE FROM login_sessions WHERE token_hash = %s", (token,))
    response = jsonify(ok=True)
    response.delete_cookie(COOKIE)
    return response
