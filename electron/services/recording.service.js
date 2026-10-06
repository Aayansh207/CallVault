const fs = require('fs');
const recordingRepository = require('../database/repositories/recording.repository');
const tagRepository = require('../database/repositories/tag.repository');
const { getDatabase } = require('../database/connection');
const { logger } = require('../utils/logger');

class RecordingService {
  list(options) {
    return recordingRepository.list(options);
  }

  get(id) {
    return recordingRepository.findById(id);
  }

  setFavorite(id, isFav) {
    return recordingRepository.setFavorite(id, isFav);
  }

  updatePlaybackPosition(id, position) {
    return recordingRepository.updatePlaybackPosition(id, position);
  }

  deleteFromLibrary(id) {
    return recordingRepository.deleteFromLibrary(id);
  }

  async deleteFile(id) {
    const recording = recordingRepository.findById(id);
    if (!recording) {
      throw new Error('Recording not found');
    }

    try {
      if (fs.existsSync(recording.file_path)) {
        await fs.promises.unlink(recording.file_path);
        logger.info(`Deleted physical file: ${recording.file_path}`);
      }
    } catch (err) {
      logger.error(`Failed to delete physical file: ${recording.file_path}`, { error: err.message });
      throw new Error(`Could not delete file from disk: ${err.message}`);
    }

    // Also remove from library
    recordingRepository.deleteFromLibrary(id);
    return true;
  }

  async locateFile(id, newPath) {
    if (!fs.existsSync(newPath)) {
      throw new Error('Selected file does not exist');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE recordings
      SET file_path = ?, available = 1, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(newPath, id);
    return recordingRepository.findById(id);
  }

  getStats() {
    return recordingRepository.getStats();
  }

  getPeopleSummary() {
    return recordingRepository.getPeopleSummary();
  }

  getTimelineCounts(yearMonth) {
    return recordingRepository.getTimelineCounts(yearMonth);
  }

  // Tags
  getAllTags() {
    return tagRepository.getAllTags();
  }

  createTag(name, color) {
    return tagRepository.createTag(name, color);
  }

  addTag(recordingId, tagId) {
    return tagRepository.addTagToRecording(recordingId, tagId);
  }

  removeTag(recordingId, tagId) {
    return tagRepository.removeTagFromRecording(recordingId, tagId);
  }

  // Notes
  saveNote(recordingId, content) {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM notes WHERE recording_id = ?').get(recordingId);
    if (existing) {
      db.prepare(`
        UPDATE notes 
        SET content = ?, updated_at = datetime('now') 
        WHERE recording_id = ?
      `).run(content, recordingId);
    } else {
      db.prepare(`
        INSERT INTO notes (recording_id, content, created_at, updated_at) 
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).run(recordingId, content);
    }
    return recordingRepository.findById(recordingId);
  }
}

module.exports = new RecordingService();
