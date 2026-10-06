const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { parseFilename } = require('./filename-parser');
const { extractMetadata } = require('./metadata-extractor');
const recordingRepository = require('../database/repositories/recording.repository');
const { logger } = require('../utils/logger');

class FileWatcher {
  constructor() {
    this.watcher = null;
    this.currentFolder = null;
    this.changeCallback = null;
  }

  setChangeCallback(callback) {
    this.changeCallback = callback;
  }

  notifyUI(eventType, data) {
    if (this.changeCallback) {
      this.changeCallback(eventType, data);
    }
  }

  start(folderPath) {
    if (!folderPath || !fs.existsSync(folderPath)) {
      logger.warn(`Cannot start watcher: directory does not exist ${folderPath}`);
      return;
    }

    if (this.watcher && this.currentFolder === folderPath) {
      return;
    }

    this.stop();
    this.currentFolder = folderPath;
    logger.info(`Starting file watcher on: ${folderPath}`);

    this.watcher = chokidar.watch(folderPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // initial scan is handled by scanner
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 1500,
        pollInterval: 200,
      },
    });

    this.watcher
      .on('add', async (filePath) => {
        if (!filePath.toLowerCase().endsWith('.m4a')) return;
        logger.info(`File watcher: detected new file ${filePath}`);
        await this.handleFileUpsert(filePath, false);
      })
      .on('change', async (filePath) => {
        if (!filePath.toLowerCase().endsWith('.m4a')) return;
        logger.info(`File watcher: detected modified file ${filePath}`);
        await this.handleFileUpsert(filePath, true);
      })
      .on('unlink', (filePath) => {
        if (!filePath.toLowerCase().endsWith('.m4a')) return;
        logger.info(`File watcher: detected deleted file ${filePath}`);
        recordingRepository.setAvailability(filePath, false);
        this.notifyUI('recording:deleted_on_disk', { filePath });
      })
      .on('error', (err) => {
        logger.error(`File watcher error: ${err.message}`);
      });
  }

  async handleFileUpsert(filePath, isModified) {
    try {
      const fileName = path.basename(filePath);
      const stat = await fs.promises.stat(filePath);
      const parsed = parseFilename(fileName, stat.mtimeMs);
      const metadata = await extractMetadata(filePath);

      recordingRepository.upsert({
        filePath,
        fileName,
        personName: parsed.personName,
        phoneNumber: parsed.phoneNumber,
        recordedAt: parsed.recordedAt,
        durationSeconds: metadata.durationSeconds,
        fileSize: stat.size,
        fileModifiedAt: Math.round(stat.mtimeMs),
        fileHash: null,
      });

      this.notifyUI(isModified ? 'recording:updated' : 'recording:added', {
        filePath,
        fileName,
      });
    } catch (err) {
      logger.error(`Failed to handle watcher file ${filePath}: ${err.message}`);
    }
  }

  stop() {
    if (this.watcher) {
      logger.info('Stopping file watcher');
      this.watcher.close();
      this.watcher = null;
      this.currentFolder = null;
    }
  }
}

module.exports = new FileWatcher();
