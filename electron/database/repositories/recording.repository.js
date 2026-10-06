const { getDatabase } = require('../connection');
const queries = require('../queries/recording.queries');
const { cleanPersonIdentifier, isPhoneNumber } = require('../../scanner/filename-parser');
const { logger } = require('../../utils/logger');

class RecordingRepository {
  constructor(db = null) {
    this._db = db;
    this._sanitized = false;
  }

  get db() {
    const instance = this._db || getDatabase();
    if (!this._sanitized && instance) {
      this._sanitized = true;
      this.sanitizeExistingNames(instance);
    }
    return instance;
  }

  /**
   * Cleans existing names in SQLite (e.g. "Call ABC" -> "ABC")
   */
  sanitizeExistingNames(database = null) {
    const db = database || this.db;
    try {
      const rows = db.prepare(`
        SELECT id, person_name, phone_number 
        FROM recordings 
        WHERE person_name LIKE 'Call %' 
           OR person_name LIKE 'Recording %' 
           OR person_name LIKE 'Audio %'
           OR person_name LIKE 'Call_%'
      `).all();

      if (rows.length === 0) return 0;

      const updateStmt = db.prepare(`
        UPDATE recordings 
        SET person_name = ?, 
            phone_number = COALESCE(?, phone_number),
            updated_at = datetime('now')
        WHERE id = ?
      `);

      const tx = db.transaction(() => {
        for (const row of rows) {
          const cleaned = cleanPersonIdentifier(row.person_name);
          const isPhone = isPhoneNumber(cleaned);
          updateStmt.run(isPhone ? null : cleaned, isPhone ? cleaned : row.phone_number, row.id);
        }
      });

      tx();
      logger.info(`Sanitized ${rows.length} existing recording names in SQLite`);
      return rows.length;
    } catch (err) {
      logger.error('Failed to sanitize existing names', { error: err.message });
      return 0;
    }
  }

  upsert(data) {
    try {
      const stmt = this.db.prepare(queries.UPSERT_RECORDING);
      const cleanedName = data.personName ? cleanPersonIdentifier(data.personName) : null;
      const isPhone = isPhoneNumber(cleanedName);

      const info = stmt.run({
        filePath: data.filePath,
        fileName: data.fileName,
        personName: isPhone ? null : cleanedName,
        phoneNumber: isPhone ? cleanedName : data.phoneNumber || null,
        recordedAt: data.recordedAt,
        durationSeconds: data.durationSeconds || 0,
        fileSize: data.fileSize || 0,
        fileModifiedAt: data.fileModifiedAt || 0,
        fileHash: data.fileHash || null,
      });
      return info;
    } catch (err) {
      logger.error(`Failed to upsert recording: ${data.filePath}`, { error: err.message });
      throw err;
    }
  }

  findById(id) {
    try {
      const stmt = this.db.prepare(queries.GET_RECORDING_BY_ID);
      const row = stmt.get(id);
      if (!row) return null;
      return {
        ...row,
        tags: JSON.parse(row.tags_json || '[]'),
      };
    } catch (err) {
      logger.error(`Failed to find recording by id ${id}: ${err.message}`);
      return null;
    }
  }

  findByPath(filePath) {
    try {
      const stmt = this.db.prepare(queries.GET_RECORDING_BY_PATH);
      return stmt.get(filePath) || null;
    } catch (err) {
      logger.error(`Failed to find recording by path: ${filePath}`);
      return null;
    }
  }

  list(options = {}) {
    try {
      const { whereSql, params } = queries.buildFilterClause(options);

      const sortColumn = ['recorded_at', 'duration_seconds', 'person_name', 'file_size'].includes(
        options.sortBy
      )
        ? options.sortBy
        : 'recorded_at';
      const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

      let sql = `
        SELECT r.*,
          COALESCE((
            SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'color', t.color))
            FROM recording_tags rt
            JOIN tags t ON rt.tag_id = t.id
            WHERE rt.recording_id = r.id
          ), '[]') as tags_json,
          (
            SELECT content FROM notes WHERE recording_id = r.id ORDER BY updated_at DESC LIMIT 1
          ) as note_content
        FROM recordings r
        ${whereSql}
        ORDER BY r.${sortColumn} ${sortOrder}
      `;

      if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(Number(options.limit));
        if (options.offset) {
          sql += ` OFFSET ?`;
          params.push(Number(options.offset));
        }
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);

      return rows.map((row) => ({
        ...row,
        tags: JSON.parse(row.tags_json || '[]'),
      }));
    } catch (err) {
      logger.error('Failed to list recordings', { error: err.message });
      return [];
    }
  }

  count(options = {}) {
    try {
      const { whereSql, params } = queries.buildFilterClause(options);
      const sql = `SELECT COUNT(*) as total FROM recordings r ${whereSql}`;
      const stmt = this.db.prepare(sql);
      const res = stmt.get(...params);
      return res ? res.total : 0;
    } catch (err) {
      logger.error('Failed to count recordings', { error: err.message });
      return 0;
    }
  }

  setFavorite(id, favorite) {
    try {
      const stmt = this.db.prepare(queries.TOGGLE_FAVORITE);
      stmt.run(favorite ? 1 : 0, id);
      return this.findById(id);
    } catch (err) {
      logger.error(`Failed to toggle favorite for ${id}: ${err.message}`);
      throw err;
    }
  }

  updatePlaybackPosition(id, position) {
    try {
      const stmt = this.db.prepare(queries.UPDATE_PLAYBACK_POSITION);
      stmt.run(position, id);
      return true;
    } catch (err) {
      logger.error(`Failed to update playback position for ${id}: ${err.message}`);
      return false;
    }
  }

  setAvailability(filePath, available) {
    try {
      const stmt = this.db.prepare(queries.SET_AVAILABILITY);
      stmt.run(available ? 1 : 0, filePath);
    } catch (err) {
      logger.error(`Failed to set availability for ${filePath}: ${err.message}`);
    }
  }

  markMissingFiles(existingPathsSet) {
    try {
      const stmtAll = this.db.prepare('SELECT id, file_path, available FROM recordings');
      const allRows = stmtAll.all();
      const updateStmt = this.db.prepare('UPDATE recordings SET available = ? WHERE id = ?');

      let markedUnavailable = 0;
      let markedAvailable = 0;

      const updateTx = this.db.transaction(() => {
        for (const row of allRows) {
          const existsOnDisk = existingPathsSet.has(row.file_path);
          if (existsOnDisk && row.available === 0) {
            updateStmt.run(1, row.id);
            markedAvailable++;
          } else if (!existsOnDisk && row.available === 1) {
            updateStmt.run(0, row.id);
            markedUnavailable++;
          }
        }
      });

      updateTx();
      return { markedUnavailable, markedAvailable };
    } catch (err) {
      logger.error(`Error marking missing files: ${err.message}`);
      return { markedUnavailable: 0, markedAvailable: 0 };
    }
  }

  deleteFromLibrary(id) {
    try {
      const stmt = this.db.prepare(queries.DELETE_RECORDING);
      const res = stmt.run(id);
      return res.changes > 0;
    } catch (err) {
      logger.error(`Failed to delete recording ${id}: ${err.message}`);
      throw err;
    }
  }

  getStats() {
    try {
      const stmt = this.db.prepare(queries.GET_LIBRARY_STATS);
      return stmt.get() || {
        total_recordings: 0,
        total_duration_seconds: 0,
        total_file_size: 0,
        total_people: 0,
        total_favorites: 0,
        total_available: 0,
        total_with_notes: 0,
      };
    } catch (err) {
      logger.error(`Failed to get stats: ${err.message}`);
      return {
        total_recordings: 0,
        total_duration_seconds: 0,
        total_file_size: 0,
        total_people: 0,
        total_favorites: 0,
        total_available: 0,
        total_with_notes: 0,
      };
    }
  }

  getPeopleSummary() {
    try {
      const stmt = this.db.prepare(queries.GET_PEOPLE_SUMMARY);
      return stmt.all();
    } catch (err) {
      logger.error(`Failed to get people summary: ${err.message}`);
      return [];
    }
  }

  /**
   * Merges two contacts manually:
   * Moves all recordings from sourceContact and targetContact to the final unified name & phone
   */
  mergeContacts(sourceContact, targetContact, finalDetails = {}) {
    try {
      const finalName = (finalDetails.personName || targetContact.person_name || sourceContact.person_name || '').trim();
      const finalPhone = (finalDetails.phoneNumber || targetContact.phone_number || sourceContact.phone_number || '').trim();

      const sourceId = sourceContact.identifier || sourceContact.person_name || sourceContact.phone_number;
      const targetId = targetContact.identifier || targetContact.person_name || targetContact.phone_number;

      const stmt = this.db.prepare(`
        UPDATE recordings
        SET person_name = ?,
            phone_number = CASE WHEN ? != '' THEN ? ELSE phone_number END,
            updated_at = datetime('now')
        WHERE (person_name = ? OR phone_number = ? OR COALESCE(person_name, phone_number) = ?)
           OR (person_name = ? OR phone_number = ? OR COALESCE(person_name, phone_number) = ?)
      `);

      const tx = this.db.transaction(() => {
        const res = stmt.run(
          finalName || null,
          finalPhone,
          finalPhone || null,
          sourceId,
          sourceId,
          sourceId,
          targetId,
          targetId,
          targetId
        );
        return res.changes;
      });

      const updatedCount = tx();
      logger.info(`Successfully merged contacts: '${sourceId}' and '${targetId}' into '${finalName}' (${updatedCount} calls updated)`);
      return { success: true, updatedCount };
    } catch (err) {
      logger.error(`Failed to merge contacts: ${err.message}`);
      throw err;
    }
  }

  getTimelineCounts(yearMonthPrefix) {
    try {
      const stmt = this.db.prepare(`
        SELECT strftime('%Y-%m-%d', recorded_at) as date, COUNT(*) as count
        FROM recordings
        WHERE recorded_at LIKE ? AND available = 1
        GROUP BY date
        ORDER BY date ASC
      `);
      return stmt.all(`${yearMonthPrefix}%`);
    } catch (err) {
      logger.error(`Failed to get timeline counts: ${err.message}`);
      return [];
    }
  }
}

module.exports = new RecordingRepository();
