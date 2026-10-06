const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { getDatabase, closeDatabase } = require('./database/connection');
const { registerAllIPC } = require('./ipc');
const scannerService = require('./services/scanner.service');
const settingsRepository = require('./database/repositories/settings.repository');
const { logger } = require('./utils/logger');

// 1. Register custom media:// protocol before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 650,
    title: 'CallVault',
    backgroundColor: '#090d16',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    show: false, // show when ready-to-show
  });

  // Link scanner service to window for real-time progress events
  scannerService.setWindow(mainWindow);

  // Register all IPC handlers
  registerAllIPC(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    logger.info(`Loading Vite dev server at ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl).catch((err) => {
      logger.error('Failed to load Vite URL, will retry...', { error: err.message });
      setTimeout(() => mainWindow.loadURL(devServerUrl), 1000);
    });
    // Open DevTools in dev mode if needed
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    scannerService.setWindow(null);
  });
}

// Set up custom protocol for local audio streaming with Range requests support
function setupMediaProtocol() {
  protocol.handle('media', (request) => {
    try {
      const url = new URL(request.url);
      // Handles media:///Users/... or media://localhost/Users/...
      let decodedPath = decodeURIComponent(url.pathname);
      
      // On Windows or if host was captured
      if (url.host && url.host !== 'localhost' && !decodedPath.startsWith(url.host)) {
        decodedPath = '/' + url.host + decodedPath;
      }

      // Convert to file:// URL and stream safely via net.fetch
      const fileUrl = pathToFileURL(decodedPath).toString();
      return net.fetch(fileUrl);
    } catch (err) {
      logger.error('Error serving media protocol', { error: err.message, url: request.url });
      return new Response('File not found', { status: 404 });
    }
  });
}

app.whenReady().then(() => {
  logger.info('CallVault starting up...');

  // 1. Initialize SQLite & run migrations
  try {
    getDatabase();
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize database', { error: err.message });
  }

  // 2. Register media protocol
  setupMediaProtocol();

  // 3. Create window
  createWindow();

  // 4. Start file watcher on configured folder
  try {
    const savedFolder = settingsRepository.get('recording_folder');
    const autoScan = settingsRepository.get('auto_scan', 'true') === 'true';
    if (savedFolder && autoScan) {
      scannerService.startWatcher(savedFolder);
    }
  } catch (err) {
    logger.warn('Could not auto-start watcher on launch', { error: err.message });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  scannerService.stopWatcher();
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  scannerService.stopWatcher();
  closeDatabase();
});
