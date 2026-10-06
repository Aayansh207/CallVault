const { getDatabase } = require('../connection');
const { logger } = require('../../utils/logger');

const DEFAULT_SETTINGS = {
  recording_folder: '',
  auto_scan: 'true',
  default_playback_speed: '1.0',
  skip_backward_seconds: '15',
  skip_forward_seconds: '30',
  date_format: 'relative', // 'relative' or 'iso' or 'formatted'
  show_unknown_callers: 'true',
  launch_at_startup: 'false',
  theme: 'dark',
};

class SettingsRepository {
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDatabase();
  }

  get(key, defaultValue = null) {
    try {
      const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = ?');
      const row = stmt.get(key);
      if (row) return row.value;
      if (defaultValue !== null) return defaultValue;
      return DEFAULT_SETTINGS[key] !== undefined ? DEFAULT_SETTINGS[key] : null;
    } catch (err) {
      logger.error(`Failed to get setting ${key}: ${err.message}`);
      return defaultValue !== null ? defaultValue : DEFAULT_SETTINGS[key];
    }
  }

  set(key, value) {
    try {
      const strVal = String(value);
      const stmt = this.db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `);
      stmt.run(key, strVal);
      return strVal;
    } catch (err) {
      logger.error(`Failed to set setting ${key}: ${err.message}`);
      throw err;
    }
  }

  getAll() {
    try {
      const stmt = this.db.prepare('SELECT key, value FROM app_settings');
      const rows = stmt.all();
      const settings = { ...DEFAULT_SETTINGS };
      for (const row of rows) {
        settings[row.key] = row.value;
      }
      return settings;
    } catch (err) {
      logger.error(`Failed to get all settings: ${err.message}`);
      return { ...DEFAULT_SETTINGS };
    }
  }

  updateMany(obj) {
    try {
      const tx = this.db.transaction((updates) => {
        for (const [key, value] of Object.entries(updates)) {
          this.set(key, value);
        }
      });
      tx(obj);
      return this.getAll();
    } catch (err) {
      logger.error(`Failed to update multiple settings: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new SettingsRepository();
