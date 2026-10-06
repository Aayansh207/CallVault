-- Migration 001: Initial Schema

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  person_name TEXT,
  phone_number TEXT,
  recorded_at TEXT NOT NULL,
  duration_seconds REAL DEFAULT 0,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_modified_at INTEGER NOT NULL DEFAULT 0,
  file_hash TEXT,
  favorite INTEGER NOT NULL DEFAULT 0,
  playback_position REAL NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_played_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_person_name ON recordings(person_name);
CREATE INDEX IF NOT EXISTS idx_recordings_phone_number ON recordings(phone_number);
CREATE INDEX IF NOT EXISTS idx_recordings_favorite ON recordings(favorite);
CREATE INDEX IF NOT EXISTS idx_recordings_available ON recordings(available);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recording_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_recording_id ON notes(recording_id);
