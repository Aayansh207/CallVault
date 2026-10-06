const { dialog } = require('electron');
const settingsRepository = require('../database/repositories/settings.repository');
const { getDatabasePath } = require('../utils/paths');
const { logger } = require('../utils/logger');

class SettingsService {
  getAll() {
    return settingsRepository.getAll();
  }

  get(key, defaultValue = null) {
    return settingsRepository.get(key, defaultValue);
  }

  update(key, value) {
    return settingsRepository.set(key, value);
  }

  updateMany(settings) {
    return settingsRepository.updateMany(settings);
  }

  async chooseFolder(browserWindow) {
    const result = await dialog.showOpenDialog(browserWindow, {
      title: 'Select Call Recordings Folder',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Select Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedPath = result.filePaths[0];
    settingsRepository.set('recording_folder', selectedPath);
    return selectedPath;
  }

  getDatabasePath() {
    return getDatabasePath();
  }
}

module.exports = new SettingsService();
