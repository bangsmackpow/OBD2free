-- Cloudflare D1 Database Schema
-- Run this migration to create tables

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_id TEXT,
  vehicle_vin TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  distance_km REAL,
  max_speed_kmh REAL,
  avg_speed_kmh REAL,
  file_key TEXT,
  file_size INTEGER,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT UNIQUE,
  nickname TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  premium_status TEXT DEFAULT 'free',
  premium_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- Insert demo user
INSERT OR IGNORE INTO users (id, email, premium_status)
VALUES ('user_001', 'demo@neonstar.app', 'free');
