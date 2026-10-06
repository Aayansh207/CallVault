const { registerRecordingIPC } = require('./recording.ipc');
const { registerScannerIPC } = require('./scanner.ipc');
const { registerSettingsIPC } = require('./settings.ipc');
const { registerSystemIPC } = require('./system.ipc');

function registerAllIPC(mainWindow) {
  registerRecordingIPC(mainWindow);
  registerScannerIPC(mainWindow);
  registerSettingsIPC(mainWindow);
  registerSystemIPC(mainWindow);
}

module.exports = { registerAllIPC };
