/**
 * Safe wrapper around window.callvault Electron API
 */

const isElectron = typeof window !== 'undefined' && Boolean(window.callvault);

export const api = {
  recordings: {
    list: (opts) => (isElectron ? window.callvault.recordings.list(opts) : Promise.resolve([])),
    get: (id) => (isElectron ? window.callvault.recordings.get(id) : Promise.resolve(null)),
    favorite: (id, isFav) => (isElectron ? window.callvault.recordings.favorite(id, isFav) : Promise.resolve(null)),
    updatePosition: (id, pos) => (isElectron ? window.callvault.recordings.updatePosition(id, pos) : Promise.resolve(true)),
    deleteFromLibrary: (id) => (isElectron ? window.callvault.recordings.deleteFromLibrary(id) : Promise.resolve(true)),
    deleteFile: (id) => (isElectron ? window.callvault.recordings.deleteFile(id) : Promise.resolve(true)),
    locateFile: (id) => (isElectron ? window.callvault.recordings.locateFile(id) : Promise.resolve(null)),
    getStats: () => (isElectron ? window.callvault.recordings.getStats() : Promise.resolve({})),
    getPeople: () => (isElectron ? window.callvault.recordings.getPeople() : Promise.resolve([])),
    getTimeline: (ym) => (isElectron ? window.callvault.recordings.getTimeline(ym) : Promise.resolve([])),
    getTags: () => (isElectron ? window.callvault.recordings.getTags() : Promise.resolve([])),
    createTag: (name, color) => (isElectron ? window.callvault.recordings.createTag(name, color) : Promise.resolve(null)),
    addTag: (recId, tagId) => (isElectron ? window.callvault.recordings.addTag(recId, tagId) : Promise.resolve([])),
    removeTag: (recId, tagId) => (isElectron ? window.callvault.recordings.removeTag(recId, tagId) : Promise.resolve([])),
    saveNote: (recId, content) => (isElectron ? window.callvault.recordings.saveNote(recId, content) : Promise.resolve(null)),
  },
  scanner: {
    scan: (folder, opts) => (isElectron ? window.callvault.scanner.scan(folder, opts) : Promise.resolve({ success: true })),
    getStatus: () => (isElectron ? window.callvault.scanner.getStatus() : Promise.resolve({ isScanning: false })),
    cancel: () => (isElectron ? window.callvault.scanner.cancel() : Promise.resolve(true)),
    onProgress: (cb) => (isElectron ? window.callvault.scanner.onProgress(cb) : () => {}),
    onComplete: (cb) => (isElectron ? window.callvault.scanner.onComplete(cb) : () => {}),
    onError: (cb) => (isElectron ? window.callvault.scanner.onError(cb) : () => {}),
    onFileChange: (cb) => (isElectron ? window.callvault.scanner.onFileChange(cb) : () => {}),
  },
  settings: {
    get: () => (isElectron ? window.callvault.settings.get() : Promise.resolve({})),
    update: (k, v) => (isElectron ? window.callvault.settings.update(k, v) : Promise.resolve({})),
    chooseFolder: () => (isElectron ? window.callvault.settings.chooseFolder() : Promise.resolve(null)),
    getDatabasePath: () => (isElectron ? window.callvault.settings.getDatabasePath() : Promise.resolve('')),
  },
  system: {
    revealInFinder: (path) => (isElectron ? window.callvault.system.revealInFinder(path) : Promise.resolve(false)),
    openWith: (path) => (isElectron ? window.callvault.system.openWith(path) : Promise.resolve(false)),
  },
  isElectron,
  toAudioUrl: (filePath) => {
    if (!filePath) return '';
    // Encode path for custom media:// protocol
    // Ensure leading slash
    const normalized = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `media://${encodeURI(normalized)}`;
  },
};
