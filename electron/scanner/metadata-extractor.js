const fs = require('fs');
const mm = require('music-metadata');
const { logger } = require('../utils/logger');

/**
 * Extracts metadata from an audio file (.m4a)
 * Safely handles any corruption or unsupported formats without crashing.
 * 
 * Returns {
 *   durationSeconds: number,
 *   fileSize: number,
 *   fileModifiedAt: number,
 *   format: string | null
 * }
 */
async function extractMetadata(filePath) {
  let fileSize = 0;
  let fileModifiedAt = 0;

  try {
    const stats = fs.statSync(filePath);
    fileSize = stats.size;
    fileModifiedAt = Math.round(stats.mtimeMs);
  } catch (err) {
    logger.warn(`Could not stat file: ${filePath}`, { error: err.message });
    return {
      durationSeconds: 0,
      fileSize: 0,
      fileModifiedAt: 0,
      format: null,
    };
  }

  let durationSeconds = 0;
  let format = null;

  try {
    // Parse audio metadata with music-metadata
    const metadata = await mm.parseFile(filePath, {
      duration: true,
      skipCovers: true,
      skipPostHeaders: true,
    });

    if (metadata && metadata.format) {
      durationSeconds = metadata.format.duration ? Math.round(metadata.format.duration) : 0;
      format = metadata.format.container || 'm4a';
    }
  } catch (err) {
    // Graceful degradation: never crash if metadata extraction fails
    logger.debug(`Could not parse audio container for ${filePath}: ${err.message}`);
  }

  return {
    durationSeconds,
    fileSize,
    fileModifiedAt,
    format,
  };
}

module.exports = {
  extractMetadata,
};
