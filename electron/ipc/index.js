const { registerRecordingIPC } = require('./recording.ipc');
const { registerScannerIPC } = require('./scanner.ipc');
const { registerSettingsIPC } = require('./settings.ipc');
const { registerSystemIPC } = require('./system.ipc');

function registerAllIPC() {
  registerRecordingIPC();
  registerScannerIPC();
  registerSettingsIPC();
  registerSystemIPC();
}

module.exports = { registerAllIPC };
