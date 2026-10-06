const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const electron = require('electron');

let electronProcess = null;
let restartTimeout = null;

function startElectron() {
  if (electronProcess) {
    try {
      electronProcess.removeAllListeners('close');
      electronProcess.kill('SIGTERM');
    } catch {
      // ignore
    }
    electronProcess = null;
  }

  electronProcess = spawn(electron, ['.'], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'development' },
  });

  electronProcess.on('close', (code) => {
    // If electron was terminated intentionally for restart, do not exit runner
    if (code !== 0 && code !== null && code !== 143 && code !== 130) {
      console.log(`[CallVault Electron] Exited with code ${code}`);
    }
  });
}

function scheduleRestart() {
  clearTimeout(restartTimeout);
  restartTimeout = setTimeout(() => {
    console.log('\n[CallVault Dev] 🔄 Detected change in electron backend files. Restarting Electron...');
    startElectron();
  }, 400);
}

// Watch electron directory for backend changes
const electronDir = path.resolve(__dirname);
try {
  fs.watch(electronDir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.json'))) {
      scheduleRestart();
    }
  });
} catch (err) {
  console.warn('[CallVault Dev] Could not set recursive watcher on electron dir:', err.message);
}

// Initial start
startElectron();

// Handle graceful shutdown
process.on('SIGINT', () => {
  if (electronProcess) electronProcess.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (electronProcess) electronProcess.kill();
  process.exit(0);
});
