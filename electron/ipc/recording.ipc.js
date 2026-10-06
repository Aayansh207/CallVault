const { ipcMain, dialog } = require('electron');
const recordingService = require('../services/recording.service');
const { logger } = require('../utils/logger');

function registerRecordingIPC(mainWindow) {
  ipcMain.handle('recordings:list', async (_, options) => {
    return recordingService.list(options);
  });

  ipcMain.handle('recordings:get', async (_, id) => {
    return recordingService.get(id);
  });

  ipcMain.handle('recordings:favorite', async (_, id, isFav) => {
    return recordingService.setFavorite(id, isFav);
  });

  ipcMain.handle('recordings:updatePosition', async (_, id, pos) => {
    return recordingService.updatePlaybackPosition(id, pos);
  });

  ipcMain.handle('recordings:deleteFromLibrary', async (_, id) => {
    return recordingService.deleteFromLibrary(id);
  });

  ipcMain.handle('recordings:deleteFile', async (_, id) => {
    return recordingService.deleteFile(id);
  });

  ipcMain.handle('recordings:getStats', async () => {
    return recordingService.getStats();
  });

  ipcMain.handle('recordings:getPeople', async () => {
    return recordingService.getPeopleSummary();
  });

  ipcMain.handle('recordings:getTimeline', async (_, yearMonth) => {
    return recordingService.getTimelineCounts(yearMonth);
  });

  // Tags
  ipcMain.handle('recordings:getTags', async () => {
    return recordingService.getAllTags();
  });

  ipcMain.handle('recordings:createTag', async (_, name, color) => {
    return recordingService.createTag(name, color);
  });

  ipcMain.handle('recordings:addTag', async (_, recordingId, tagId) => {
    return recordingService.addTag(recordingId, tagId);
  });

  ipcMain.handle('recordings:removeTag', async (_, recordingId, tagId) => {
    return recordingService.removeTag(recordingId, tagId);
  });

  // Notes
  ipcMain.handle('recordings:saveNote', async (_, recordingId, content) => {
    return recordingService.saveNote(recordingId, content);
  });

  // Relocate missing file
  ipcMain.handle('recordings:locateFile', async (_, id) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Locate Audio File',
      filters: [{ name: 'Audio Files', extensions: ['m4a'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return recordingService.locateFile(id, result.filePaths[0]);
  });
}

module.exports = { registerRecordingIPC };
