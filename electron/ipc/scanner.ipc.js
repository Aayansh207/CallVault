const { ipcMain } = require('electron');
const scannerService = require('../services/scanner.service');
const { logger } = require('../utils/logger');

function registerScannerIPC(mainWindow) {
  ipcMain.handle('scanner:scan', async (_, folder, options) => {
    return scannerService.scan(folder, options);
  });

  ipcMain.handle('scanner:getStatus', async () => {
    return scannerService.getStatus();
  });

  ipcMain.handle('scanner:cancel', async () => {
    scannerService.cancel();
    return true;
  });
}

module.exports = { registerScannerIPC };
