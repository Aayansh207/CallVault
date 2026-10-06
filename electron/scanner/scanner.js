const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { parseFilename } = require('./filename-parser');
const { extractMetadata } = require('./metadata-extractor');
const recordingRepository = require('../database/repositories/recording.repository');
const { logger } = require('../utils/logger');

class RecordingScanner extends EventEmitter {
  constructor() {
    super();
    this.isScanning = false;
    this.shouldCancel = false;
  }

  cancel() {
    if (this.isScanning) {
      this.shouldCancel = true;
      logger.info('Scanner cancellation requested');
    }
  }

  /**
   * Recursively finds all .m4a files in a directory
   */
  async discoverAudioFiles(dirPath, fileList = []) {
    if (this.shouldCancel) return fileList;

    let entries;
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (err) {
      logger.warn(`Could not read directory ${dirPath}: ${err.message}`);
      return fileList;
    }

    for (const entry of entries) {
      if (this.shouldCancel) break;

      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          // Skip hidden directories (e.g. .git, .Trash)
          if (!entry.name.startsWith('.')) {
            await this.discoverAudioFiles(fullPath, fileList);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.m4a') {
            fileList.push(fullPath);
          }
        }
      } catch (err) {
        logger.debug(`Error checking entry ${fullPath}: ${err.message}`);
      }
    }

    return fileList;
  }

  /**
   * Main scan function
   * @param {string} rootDir Directory to scan
   * @param {object} options Optional flags { forceFullRescan: boolean }
   */
  async scan(rootDir, options = {}) {
    if (this.isScanning) {
      logger.warn('Scan already in progress');
      return { status: 'already_running' };
    }

    if (!rootDir || !fs.existsSync(rootDir)) {
      throw new Error(`Directory does not exist: ${rootDir}`);
    }

    this.isScanning = true;
    this.shouldCancel = false;
    logger.info(`Starting scan in: ${rootDir}`);

    const stats = {
      totalDiscovered: 0,
      processed: 0,
      newFiles: 0,
      modifiedFiles: 0,
      skippedFiles: 0,
      missingFiles: 0,
      errors: 0,
    };

    try {
      this.emit('progress', {
        phase: 'discovering',
        scanned: 0,
        total: 0,
        currentFile: 'Discovering recordings...',
        ...stats,
      });

      // 1. Discover all .m4a files
      const audioFiles = await this.discoverAudioFiles(rootDir);
      stats.totalDiscovered = audioFiles.length;

      this.emit('progress', {
        phase: 'indexing',
        scanned: 0,
        total: audioFiles.length,
        currentFile: '',
        ...stats,
      });

      const existingPathsOnDisk = new Set();

      // 2. Process each discovered file with incremental checking
      for (let i = 0; i < audioFiles.length; i++) {
        if (this.shouldCancel) {
          logger.info('Scan aborted by user');
          break;
        }

        const filePath = audioFiles[i];
        existingPathsOnDisk.add(filePath);
        const fileName = path.basename(filePath);

        try {
          const fileStat = await fs.promises.stat(filePath);
          const fileSize = fileStat.size;
          const fileMtime = Math.round(fileStat.mtimeMs);

          // Check if file already exists in database
          const existingRecord = recordingRepository.findByPath(filePath);

          // Incremental check: if same size & mtime, skip audio container parsing!
          const isUnchanged =
            !options.forceFullRescan &&
            existingRecord &&
            existingRecord.file_size === fileSize &&
            Math.abs((existingRecord.file_modified_at || 0) - fileMtime) < 2000 &&
            existingRecord.available === 1;

          if (isUnchanged) {
            stats.skippedFiles++;
          } else {
            // Need to parse & index
            const isModified = !!existingRecord;
            const parsed = parseFilename(fileName, fileMtime);
            const metadata = await extractMetadata(filePath);

            recordingRepository.upsert({
              filePath,
              fileName,
              personName: parsed.personName,
              phoneNumber: parsed.phoneNumber,
              recordedAt: parsed.recordedAt,
              durationSeconds: metadata.durationSeconds,
              fileSize,
              fileModifiedAt: fileMtime,
              fileHash: null,
            });

            if (isModified) {
              stats.modifiedFiles++;
            } else {
              stats.newFiles++;
            }
          }
        } catch (err) {
          stats.errors++;
          logger.error(`Error processing file ${filePath}: ${err.message}`);
        }

        stats.processed = i + 1;

        // Emit progress every 20 files or at completion to avoid IPC spam
        if (stats.processed % 20 === 0 || stats.processed === audioFiles.length) {
          this.emit('progress', {
            phase: 'indexing',
            scanned: stats.processed,
            total: audioFiles.length,
            currentFile: fileName,
            ...stats,
          });
        }
      }

      // 3. Mark missing files (files in DB that were deleted or moved away)
      const missingResult = recordingRepository.markMissingFiles(existingPathsOnDisk);
      stats.missingFiles = missingResult.markedUnavailable;

      logger.info('Scan complete', stats);

      this.emit('complete', {
        phase: 'complete',
        scanned: stats.processed,
        total: audioFiles.length,
        ...stats,
      });

      return {
        success: true,
        canceled: this.shouldCancel,
        ...stats,
      };
    } catch (err) {
      logger.error('Scan failed', { error: err.message });
      this.emit('error', { error: err.message });
      throw err;
    } finally {
      this.isScanning = false;
      this.shouldCancel = false;
    }
  }
}

module.exports = new RecordingScanner();
