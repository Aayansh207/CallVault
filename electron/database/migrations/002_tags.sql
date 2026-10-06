-- Migration 002: Tags & Tag Assignments

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recording_tags (
  recording_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (recording_id, tag_id),
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rec_tags_recording ON recording_tags(recording_id);
CREATE INDEX IF NOT EXISTS idx_rec_tags_tag ON recording_tags(tag_id);

-- Insert standard starter tags if not present
INSERT OR IGNORE INTO tags (name, color) VALUES 
  ('Work', '#38bdf8'),
  ('Personal', '#34d399'),
  ('Important', '#f87171'),
  ('College', '#fbbf24');
