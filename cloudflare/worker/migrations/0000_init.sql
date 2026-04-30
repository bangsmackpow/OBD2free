-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  premium_level TEXT NOT NULL DEFAULT 'free' CHECK(premium_level IN ('free', 'premium', 'lifetime')),
  premium_expiry INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL DEFAULT '',
  vehicle_name TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER DEFAULT 0,
  max_speed_kmh REAL DEFAULT 0,
  avg_speed_kmh REAL DEFAULT 0,
  distance_km REAL DEFAULT 0,
  max_rpm REAL DEFAULT 0,
  avg_rpm REAL DEFAULT 0,
  max_coolant_temp REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  csv_size INTEGER DEFAULT 0,
  csv_row_count INTEGER DEFAULT 0,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create devices table (mobile app devices)
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'mobile' CHECK(device_type IN ('mobile', 'web')),
  token_hash TEXT NOT NULL,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_token_hash ON devices(token_hash);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_users_email ON users(email);
