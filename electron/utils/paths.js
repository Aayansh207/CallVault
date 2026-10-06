const path = require('path');
const os = require('os');
const fs = require('fs');

let electronApp = null;
try {
  const electron = require('electron');
  electronApp = electron.app;
} catch (e) {
  // Not in electron context
}

function getUserDataDir() {
  if (electronApp && electronApp.getPath) {
    try {
      return electronApp.getPath('userData');
    } catch (e) {
      // app not ready yet
    }
  }
  const fallback = path.join(os.homedir(), '.callvault');
  if (!fs.existsSync(fallback)) {
    fs.mkdirSync(fallback, { recursive: true });
  }
  return fallback;
}

function getDatabasePath() {
  const dataDir = getUserDataDir();
  return path.join(dataDir, 'callvault.db');
}

module.exports = {
  getUserDataDir,
  getDatabasePath,
};
