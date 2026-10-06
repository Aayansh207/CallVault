const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('callvault', {
  recordings: {
    list: (options) => ipcRenderer.invoke('recordings:list', options),
    get: (id) => ipcRenderer.invoke('recordings:get', id),
    favorite: (id, isFav) => ipcRenderer.invoke('recordings:favorite', id, isFav),
    updatePosition: (id, pos) => ipcRenderer.invoke('recordings:updatePosition', id, pos),
    deleteFromLibrary: (id) => ipcRenderer.invoke('recordings:deleteFromLibrary', id),
    deleteFile: (id) => ipcRenderer.invoke('recordings:deleteFile', id),
    locateFile: (id) => ipcRenderer.invoke('recordings:locateFile', id),
    getStats: () => ipcRenderer.invoke('recordings:getStats'),
    getPeople: () => ipcRenderer.invoke('recordings:getPeople'),
    getTimeline: (yearMonth) => ipcRenderer.invoke('recordings:getTimeline', yearMonth),
    mergeContacts: (src, target, details) => ipcRenderer.invoke('recordings:mergeContacts', src, target, details),
    getTags: () => ipcRenderer.invoke('recordings:getTags'),
    createTag: (name, color) => ipcRenderer.invoke('recordings:createTag', name, color),
    addTag: (recordingId, tagId) => ipcRenderer.invoke('recordings:addTag', recordingId, tagId),
    removeTag: (recordingId, tagId) => ipcRenderer.invoke('recordings:removeTag', recordingId, tagId),
    saveNote: (recordingId, content) => ipcRenderer.invoke('recordings:saveNote', recordingId, content),
  },

  scanner: {
    scan: (folder, options) => ipcRenderer.invoke('scanner:scan', folder, options),
    getStatus: () => ipcRenderer.invoke('scanner:getStatus'),
    cancel: () => ipcRenderer.invoke('scanner:cancel'),
    onProgress: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('scanner:progress', handler);
      return () => ipcRenderer.removeListener('scanner:progress', handler);
    },
    onComplete: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('scanner:complete', handler);
      return () => ipcRenderer.removeListener('scanner:complete', handler);
    },
    onError: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('scanner:error', handler);
      return () => ipcRenderer.removeListener('scanner:error', handler);
    },
    onFileChange: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('scanner:fileChange', handler);
      return () => ipcRenderer.removeListener('scanner:fileChange', handler);
    },
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (keyOrObj, val) => ipcRenderer.invoke('settings:update', keyOrObj, val),
    chooseFolder: () => ipcRenderer.invoke('settings:chooseFolder'),
    getDatabasePath: () => ipcRenderer.invoke('settings:getDatabasePath'),
  },

  system: {
    revealInFinder: (filePath) => ipcRenderer.invoke('system:revealInFinder', filePath),
    openWith: (filePath) => ipcRenderer.invoke('system:openWith', filePath),
  },
});
