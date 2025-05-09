# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
import bcrypt
import jwt
import datetime
import time

app = Flask(__name__)
CORS(app)

# JWT Secret
SECRET_KEY = os.getenv('JWT_SECRET', 'your‐fallback‐secret')

# Database connection helper with retries
def connect_to_db():
    url = os.getenv('DATABASE_URL')
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    max_retries = 10
    delay = 5
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(url)
            app.logger.info("DB connected on attempt %d", i+1)
            return conn
        except psycopg2.OperationalError as e:
            app.logger.warning("DB connect failed (%d/%d): %s", i+1, max_retries, e)
            if i < max_retries - 1:
                time.sleep(delay)
            else:
                raise

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    # Input validation
    if not username or len(username) < 3:
        return jsonify(error="Username must be at least 3 chars"), 400
    if not password or len(password) < 6:
        return jsonify(error="Password must be at least 6 chars"), 400

    # Hash password
    pw_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())

    # Use a fresh connection & cursor
    conn = connect_to_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
            (username, hashed)
        )
        conn.commit()
        return jsonify(message="User registered successfully"), 201

    except psycopg2.IntegrityError as e:
        conn.rollback()
        return jsonify(error="Username already exists"), 409

    except psycopg2.Error as e:
        conn.rollback()
        app.logger.exception("DB error on register")
        return jsonify(error="Database error"), 500

    finally:
        cur.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify(error="username & password required"), 400

    conn = connect_to_db()
    cur  = conn.cursor()
    try:
        cur.execute("SELECT password_hash FROM users WHERE username = %s", (username,))
        row = cur.fetchone()
        if not row:
            return jsonify(error="User not found"), 404

        stored_hash = row[0]
        if isinstance(stored_hash, memoryview):
            stored_hash = stored_hash.tobytes()

        if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            token = jwt.encode({
                'username': username,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm="HS256")
            return jsonify(token=token), 200
        else:
            return jsonify(error="Invalid credentials"), 401

    except psycopg2.Error:
        app.logger.exception("DB error on login")
        return jsonify(error="Database error"), 500

    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    # Allow override of port via env
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)

