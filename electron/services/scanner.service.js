const scanner = require('../scanner/scanner');
const fileWatcher = require('../scanner/file-watcher');
const settingsRepository = require('../database/repositories/settings.repository');
const { logger } = require('../utils/logger');

class ScannerService {
  constructor() {
    this.mainWindow = null;

    // Forward scanner events to Electron window if set
    scanner.on('progress', (data) => {
      this.sendToRenderer('scanner:progress', data);
    });

    scanner.on('complete', (data) => {
      this.sendToRenderer('scanner:complete', data);
    });

    scanner.on('error', (data) => {
      this.sendToRenderer('scanner:error', data);
    });

    fileWatcher.setChangeCallback((eventType, data) => {
      this.sendToRenderer('scanner:fileChange', { eventType, ...data });
    });
  }

  setWindow(win) {
    this.mainWindow = win;
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  async scan(folder = null, options = {}) {
    const targetFolder = folder || settingsRepository.get('recording_folder');
    if (!targetFolder) {
      throw new Error('No recording folder selected');
    }

    const res = await scanner.scan(targetFolder, options);

    // Ensure file watcher is monitoring the folder
    const autoScan = settingsRepository.get('auto_scan', 'true') === 'true';
    if (autoScan) {
      fileWatcher.start(targetFolder);
    }

    return res;
  }

  cancel() {
    scanner.cancel();
  }

  getStatus() {
    return {
      isScanning: scanner.isScanning,
    };
  }

  startWatcher(folder) {
    const target = folder || settingsRepository.get('recording_folder');
    if (target) {
      fileWatcher.start(target);
    }
  }

  stopWatcher() {
    fileWatcher.stop();
  }
}

module.exports = new ScannerService();
