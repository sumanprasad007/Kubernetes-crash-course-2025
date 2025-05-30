-- Create tables for auth-service
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash BYTEA NOT NULL
);

-- Create table for Snake game scores
CREATE TABLE IF NOT EXISTS snake_high_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  score INTEGER DEFAULT 0
);

-- Create table for other game stats (Tic-Tac-Toe and Rock-Paper-Scissors)
CREATE TABLE IF NOT EXISTS games_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  game_type VARCHAR(50) NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0
);

-- Grant all privileges on the tables to the application user
GRANT ALL PRIVILEGES ON TABLE users TO "user";
GRANT ALL PRIVILEGES ON TABLE snake_high_scores TO "user";
GRANT ALL PRIVILEGES ON TABLE games_stats TO "user";

-- Grant usage on the sequences for the SERIAL primary keys
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "user";

-- Add indexes to foreign key columns to speed up JOINs
CREATE INDEX IF NOT EXISTS idx_snake_high_scores_user_id ON snake_high_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_games_stats_user_id ON games_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_games_stats_game_type ON games_stats(game_type);
