const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { getDatabasePath } = require('../utils/paths');
const { logger } = require('../utils/logger');

let db = null;

function getDatabase(customPath = null) {
  if (db && !customPath) {
    return db;
  }

  const dbPath = customPath || getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  logger.info(`Opening SQLite database at ${dbPath}`);
  const instance = new Database(dbPath);

  // WAL mode for high concurrency & performance
  instance.pragma('journal_mode = WAL');
  instance.pragma('synchronous = NORMAL');
  instance.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(instance);

  if (!customPath) {
    db = instance;
  }
  return instance;
}

function runMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const getApplied = database.prepare('SELECT version FROM schema_migrations');
  const appliedList = new Set(getApplied.all().map((r) => r.version));

  for (const file of files) {
    if (!appliedList.has(file)) {
      logger.info(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      database.transaction(() => {
        database.exec(sql);
        database.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
      })();
    }
  }
}

function closeDatabase() {
  if (db) {
    logger.info('Closing database connection');
    db.close();
    db = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase,
  runMigrations,
};
