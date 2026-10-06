const { ipcMain, shell } = require('electron');
const fs = require('fs');
const { logger } = require('../utils/logger');

function registerSystemIPC(mainWindow) {
  ipcMain.handle('system:revealInFinder', async (_, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error(`Failed to reveal item in finder: ${err.message}`);
      return false;
    }
  });

  ipcMain.handle('system:openWith', async (_, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        await shell.openPath(filePath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error(`Failed to open item: ${err.message}`);
      return false;
    }
  });
}

module.exports = { registerSystemIPC };
