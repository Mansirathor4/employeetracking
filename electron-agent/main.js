// Agent detection HTTP server
const http = require('http');
const DETECTION_PORT = 56789;
const server = http.createServer((req, res) => {
  if (req.url === '/agent-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running: true }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
server.listen(DETECTION_PORT, () => {
  console.log(`[Electron Agent] Detection server running on http://localhost:${DETECTION_PORT}/agent-status`);
});
const { app, BrowserWindow, Tray, Menu, nativeImage, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

// ─── Config ─────────────────────────────────────────────────────────────────
let configUserId = null;
let backendUrl = 'https://employeetracking-3.onrender.com';
const configPath = path.join(app.isPackaged ? process.resourcesPath : __dirname, 'agent-config.json');

function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    configUserId = config.userId;
    backendUrl = config.backendUrl || 'http://localhost:5000';
    if (!configUserId) throw new Error('userId missing');
    console.log('[Agent] Config loaded - userId:', configUserId, 'backend:', backendUrl);
  } catch (err) {
    console.error('[Agent] Config error:', err.message);
  }
}
loadConfig();

// ─── Socket.io ──────────────────────────────────────────────────────────────
const socketManager = require('./socket.js');

// ─── Globals ────────────────────────────────────────────────────────────────
let tray = null;
let statusWindow = null;
let screenshotInterval = null;
// ...existing code...
let isUploadingScreenshot = false;
let lastScreenshotUploadTime = 0;
let captureCount = 0;
let isPaused = false;

const CAPTURE_INTERVAL = 3000;
const SCREENSHOT_UPLOAD_INTERVAL = 15000;
const BACKEND_URL = () => `${backendUrl}/api/screenshot/upload`;

// ─── Single Instance Lock ───────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Agent] Another instance is already running. Exiting.');
  app.quit();
}

// ─── Auto-start on boot ────────────────────────────────────────────────────
function setupAutoStart() {
  if (!app.isPackaged) return; // Only in production builds
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
    args: ['--hidden']
  });
  console.log('[Agent] Auto-start on boot: enabled');
}

// ─── Tray Icon ──────────────────────────────────────────────────────────────
function createTray() {
  // Create a small colored icon for the tray
  const icon = nativeImage.createFromBuffer(createTrayIcon());
  tray = new Tray(icon);
  tray.setToolTip('PeopleConnect HR - Employee Agent');
  updateTrayMenu();

  tray.on('double-click', () => {
    toggleStatusWindow();
  });
}

function createTrayIcon() {
  // 16x16 PNG: green circle for active
  // This creates a simple colored square icon
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  const color = isPaused ? [255, 165, 0, 255] : [46, 204, 113, 255]; // orange if paused, green if active
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const cx = size / 2, cy = size / 2, r = size / 2 - 1;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist <= r) {
      canvas[i * 4] = color[0];
      canvas[i * 4 + 1] = color[1];
      canvas[i * 4 + 2] = color[2];
      canvas[i * 4 + 3] = color[3];
    }
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size }).toPNG();
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'PeopleConnect HR Agent',
      enabled: false,
      icon: nativeImage.createFromBuffer(createTrayIcon()).resize({ width: 16, height: 16 })
    },
    { type: 'separator' },
    {
      label: isPaused ? 'Resume Monitoring' : 'Pause Monitoring',
      click: () => {
        if (isPaused) {
          resumeCapture();
        } else {
          pauseCapture();
        }
      }
    },
    {
      label: 'Show Status',
      click: () => toggleStatusWindow()
    },
    { type: 'separator' },
    {
      label: `User: ${configUserId || 'Not configured'}`,
      enabled: false
    },
    {
      label: `Server: ${backendUrl}`,
      enabled: false
    },
    {
      label: `Frames sent: ${captureCount}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(isPaused ? 'PeopleConnect HR - Paused' : `PeopleConnect HR - Active (${captureCount} frames)`);
}

// ─── Status Window (hidden by default, shown on tray double-click) ─────────
function createStatusWindow() {
  statusWindow = new BrowserWindow({
    width: 380,
    height: 480,
    show: false,
    resizable: false,
    skipTaskbar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    alwaysOnTop: true,
  });
  statusWindow.loadFile('index.html');
}

// ─── Screen Capture ─────────────────────────────────────────────────────────
function startCapture() {
  if (screenshotInterval) clearInterval(screenshotInterval);
  isPaused = false;
  screenshotInterval = setInterval(captureAndSend, CAPTURE_INTERVAL);
  captureAndSend(); // immediate first capture
  console.log(`[Agent] Capture started (every ${CAPTURE_INTERVAL / 1000}s)`);
  updateTrayMenu();
}

ipcMain.on('stop-screenshot-capture', () => pauseCapture());
ipcMain.on('start-screenshot-capture', () => resumeCapture());
ipcMain.handle('capture-screen', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.map(s => ({ id: s.id, thumbnail: s.thumbnail.toDataURL() }));
});
ipcMain.handle('get-screenshot-status', () => {
  return {
    isCapturing: !isPaused,
    interval: CAPTURE_INTERVAL / 1000,
    userId: configUserId,
    captureCount,
    connected: socketManager.socket?.connected || false
  };
});
