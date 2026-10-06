const { ipcMain } = require('electron');
const settingsService = require('../services/settings.service');
const { logger } = require('../utils/logger');

function registerSettingsIPC(mainWindow) {
  ipcMain.handle('settings:get', async () => {
    return settingsService.getAll();
  });

  ipcMain.handle('settings:update', async (_, keyOrObj, val) => {
    if (typeof keyOrObj === 'object') {
      return settingsService.updateMany(keyOrObj);
    }
    settingsService.update(keyOrObj, val);
    return settingsService.getAll();
  });

  ipcMain.handle('settings:chooseFolder', async () => {
    return settingsService.chooseFolder(mainWindow);
  });

  ipcMain.handle('settings:getDatabasePath', async () => {
    return settingsService.getDatabasePath();
  });
}

module.exports = { registerSettingsIPC };
