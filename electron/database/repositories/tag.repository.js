const { getDatabase } = require('../connection');
const { logger } = require('../../utils/logger');

class TagRepository {
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDatabase();
  }

  getAllTags() {
    try {
      const stmt = this.db.prepare('SELECT * FROM tags ORDER BY name ASC');
      return stmt.all();
    } catch (err) {
      logger.error(`Failed to get all tags: ${err.message}`);
      return [];
    }
  }

  createTag(name, color = '#6366f1') {
    try {
      const stmt = this.db.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)');
      stmt.run(name.trim(), color);
      const getStmt = this.db.prepare('SELECT * FROM tags WHERE name = ?');
      return getStmt.get(name.trim());
    } catch (err) {
      logger.error(`Failed to create tag: ${err.message}`);
      throw err;
    }
  }

  deleteTag(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM tags WHERE id = ?');
      return stmt.run(id).changes > 0;
    } catch (err) {
      logger.error(`Failed to delete tag: ${err.message}`);
      throw err;
    }
  }

  addTagToRecording(recordingId, tagId) {
    try {
      const stmt = this.db.prepare('INSERT OR IGNORE INTO recording_tags (recording_id, tag_id) VALUES (?, ?)');
      stmt.run(recordingId, tagId);
      return this.getTagsForRecording(recordingId);
    } catch (err) {
      logger.error(`Failed to add tag to recording: ${err.message}`);
      throw err;
    }
  }

  removeTagFromRecording(recordingId, tagId) {
    try {
      const stmt = this.db.prepare('DELETE FROM recording_tags WHERE recording_id = ? AND tag_id = ?');
      stmt.run(recordingId, tagId);
      return this.getTagsForRecording(recordingId);
    } catch (err) {
      logger.error(`Failed to remove tag from recording: ${err.message}`);
      throw err;
    }
  }

  getTagsForRecording(recordingId) {
    try {
      const stmt = this.db.prepare(`
        SELECT t.* FROM tags t
        JOIN recording_tags rt ON rt.tag_id = t.id
        WHERE rt.recording_id = ?
        ORDER BY t.name ASC
      `);
      return stmt.all(recordingId);
    } catch (err) {
      logger.error(`Failed to get tags for recording ${recordingId}: ${err.message}`);
      return [];
    }
  }
}

module.exports = new TagRepository();
