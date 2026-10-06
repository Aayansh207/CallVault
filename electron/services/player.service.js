const recordingRepository = require('../database/repositories/recording.repository');
const { logger } = require('../utils/logger');

class PlayerService {
  async savePosition(recordingId, positionSeconds) {
    if (!recordingId) return;
    try {
      recordingRepository.updatePlaybackPosition(recordingId, positionSeconds);
    } catch (err) {
      logger.error(`Error updating playback position: ${err.message}`);
    }
  }
}

module.exports = new PlayerService();
