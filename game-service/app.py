from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
import jwt
import time


app = Flask(__name__)
CORS(app)



# Database connection with retry logic
def connect_to_db():
    max_retries = 10
    retry_delay = 5  # seconds
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(os.getenv('DATABASE_URL'))
            print("Successfully connected to the database")
            return conn
        except psycopg2.OperationalError as e:
            print(f"Failed to connect to the database (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise Exception("Could not connect to the database after maximum retries")

conn = connect_to_db()
cur = conn.cursor()

SECRET_KEY = "your-secret-key"

def verify_token(token):
    print(f"Received Authorization header: {token}")

    try:
        # Remove "Bearer " prefix if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            print(f"Token after removing Bearer: {token}")  # Debug log
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print(f"Decoded token: {decoded}")  # Debug log

        return decoded['username']
    except Exception as e:
        print(f"Token validation error: {str(e)}")  # Debug log
        return None

@app.route('/users/scores', methods=['GET'])
def get_scores():
    try:
        cur.execute("""
            SELECT u.username, s.score AS snake_high_score, 
                   t.wins AS tic_tac_toe_wins, t.losses AS tic_tac_toe_losses,
                   r.wins AS rps_wins, r.losses AS rps_losses
            FROM users u
            LEFT JOIN snake_high_scores s ON u.id = s.user_id
            LEFT JOIN games_stats t ON u.id = t.user_id AND t.game_type = 'tic-tac-toe'
            LEFT JOIN games_stats r ON u.id = r.user_id AND r.game_type = 'rock-paper-scissors'
        """)
        scores = cur.fetchall()
        return jsonify([{
            'username': row[0],
            'snake_high_score': row[1] if row[1] is not None else 0,
            'tic_tac_toe_wins': row[2] if row[2] is not None else 0,
            'tic_tac_toe_losses': row[3] if row[3] is not None else 0,
            'rps_wins': row[4] if row[4] is not None else 0,
            'rps_losses': row[5] if row[5] is not None else 0
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
    score = data['score']
    
    try:
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_id = cur.fetchone()
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        user_id = user_id[0]
        
        cur.execute("SELECT score FROM snake_high_scores WHERE user_id = %s", (user_id,))
        current_score = cur.fetchone()
        
        if current_score:
            if score > current_score[0]:
                cur.execute("UPDATE snake_high_scores SET score = %s WHERE user_id = %s", (score, user_id))
        else:
            cur.execute("INSERT INTO snake_high_scores (user_id, score) VALUES (%s, %s)", (user_id, score))
        
        conn.commit()
        return jsonify({"message": "Score updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/game/stats', methods=['POST'])
def update_game_stats():
    token = request.headers.get('Authorization')
    print(f"Authorization header: {token}")  # Debug log

    username = verify_token(token)
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json()
    game_type = data['game_type']
    wins = data['wins']
    losses = data['losses']
    
    try:
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_id = cur.fetchone()
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        user_id = user_id[0]
        
        cur.execute("SELECT * FROM games_stats WHERE user_id = %s AND game_type = %s", (user_id, game_type))
        existing_stats = cur.fetchone()
        
        if existing_stats:
            # Update existing stats
            new_wins = existing_stats[3] + wins  # wins is the 4th column (index 3)
            new_losses = existing_stats[4] + losses  # losses is the 5th column (index 4)
            cur.execute(
                "UPDATE games_stats SET wins = %s, losses = %s WHERE user_id = %s AND game_type = %s",
                (new_wins, new_losses, user_id, game_type)
            )
        else:
            # Insert new stats
            cur.execute(
                "INSERT INTO games_stats (user_id, game_type, wins, losses) VALUES (%s, %s, %s, %s)",
                (user_id, game_type, wins, losses)
            )
        
        conn.commit()
        return jsonify({"message": "Game stats updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)
