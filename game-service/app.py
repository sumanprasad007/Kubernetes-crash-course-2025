from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
import jwt
import time
from prometheus_flask_exporter import PrometheusMetrics

app = Flask(__name__)
CORS(app)
metrics = PrometheusMetrics(app)

SECRET_KEY = "your-secret-key"

# Function to connect to the database
def connect_to_db():
    db_user = os.getenv('POSTGRES_USER')
    db_password = os.getenv('POSTGRES_PASSWORD')
    db_host = os.getenv('POSTGRES_HOST')
    db_name = os.getenv('POSTGRES_DB')

    if not all([db_user, db_password, db_host, db_name]):
        raise Exception("Database environment variables are not fully set.")

    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:5432/{db_name}"

    max_retries = 10
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(database_url)
            print("✅ Connected to DB")
            return conn
        except psycopg2.OperationalError as e:
            print(f"❌ DB connect error (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise

# JWT token verification
def verify_token(token):
    if token.startswith("Bearer "):
        token = token[7:]
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded['username']
    except Exception as e:
        app.logger.error(f"Token validation error: {e}")
        return None

@app.route('/users/scores', methods=['GET'])
def get_scores():
    try:
        conn = connect_to_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.username, s.score AS snake_high_score, 
                           t.wins AS tic_tac_toe_wins, t.losses AS tic_tac_toe_losses,
                           r.wins AS rps_wins, r.losses AS rps_losses,
                           m.wins AS memory_game_wins, m.losses AS memory_game_losses
                    FROM users u
                    LEFT JOIN snake_high_scores s ON u.id = s.user_id
                    LEFT JOIN games_stats t ON u.id = t.user_id AND t.game_type = 'tic-tac-toe'
                    LEFT JOIN games_stats r ON u.id = r.user_id AND r.game_type = 'rock-paper-scissors'
                    LEFT JOIN games_stats m ON u.id = m.user_id AND m.game_type = 'memory-game'
                """)
                scores = cur.fetchall()
                return jsonify([{
                    'username': row[0],
                    'snake_high_score': row[1] or 0,
                    'tic_tac_toe_wins': row[2] or 0,
                    'tic_tac_toe_losses': row[3] or 0,
                    'rps_wins': row[4] or 0,
                    'rps_losses': row[5] or 0,
                    'memory_game_wins': row[6] or 0,
                    'memory_game_losses': row[7] or 0
                } for row in scores]), 200
    except Exception as e:
        app.logger.error(f"Error in get_scores: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/snake/score', methods=['POST'])
def update_snake_score():
    token = request.headers.get('Authorization')
    username = verify_token(token)
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    score = data.get('score')

    try:
        conn = connect_to_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                result = cur.fetchone()
                if not result:
                    return jsonify({"error": "User not found"}), 404
                user_id = result[0]

                cur.execute("SELECT score FROM snake_high_scores WHERE user_id = %s", (user_id,))
                current = cur.fetchone()

                if current and score > current[0]:
                    cur.execute("UPDATE snake_high_scores SET score = %s WHERE user_id = %s", (score, user_id))
                elif not current:
                    cur.execute("INSERT INTO snake_high_scores (user_id, score) VALUES (%s, %s)", (user_id, score))

        return jsonify({"message": "Score updated"}), 200
    except Exception as e:
        app.logger.error(f"Error in update_snake_score: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/game/stats', methods=['POST'])
def update_game_stats():
    token = request.headers.get('Authorization')
    username = verify_token(token)
    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    game_type = data.get('game_type')
    wins = data.get('wins', 0)
    losses = data.get('losses', 0)

    try:
        conn = connect_to_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                result = cur.fetchone()
                if not result:
                    return jsonify({"error": "User not found"}), 404
                user_id = result[0]

                cur.execute("SELECT wins, losses FROM games_stats WHERE user_id = %s AND game_type = %s", (user_id, game_type))
                stats = cur.fetchone()

                if stats:
                    new_wins = stats[0] + wins
                    new_losses = stats[1] + losses
                    cur.execute("UPDATE games_stats SET wins = %s, losses = %s WHERE user_id = %s AND game_type = %s",
                                (new_wins, new_losses, user_id, game_type))
                else:
                    cur.execute("INSERT INTO games_stats (user_id, game_type, wins, losses) VALUES (%s, %s, %s, %s)",
                                (user_id, game_type, wins, losses))

        return jsonify({"message": "Game stats updated"}), 200
    except Exception as e:
        app.logger.error(f"Error in update_game_stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)

