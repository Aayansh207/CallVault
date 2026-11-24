const { ipcMain, BrowserWindow } = require('electron');
const settingsService = require('../services/settings.service');
const scannerService = require('../services/scanner.service');

function registerSettingsIPC() {
  ipcMain.handle('settings:get', async () => {
    return settingsService.getAll();
  });

  ipcMain.handle('settings:update', async (_, keyOrObj, val) => {
    const updates = typeof keyOrObj === 'object' && keyOrObj ? keyOrObj : { [keyOrObj]: val };
    const settings = settingsService.updateMany(updates);
    if ('auto_scan' in updates || 'recording_folder' in updates) {
      if (settings.auto_scan === 'true' && settings.recording_folder) scannerService.startWatcher();
      else scannerService.stopWatcher();
    }
    return settings;
  });

  ipcMain.handle('settings:chooseFolder', async (event) => {
    return settingsService.chooseFolder(BrowserWindow.fromWebContents(event.sender));
  });

  ipcMain.handle('settings:getDatabasePath', async () => {
    return settingsService.getDatabasePath();
  });
}

module.exports = { registerSettingsIPC };
