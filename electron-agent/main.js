<<<<<<< HEAD
// Ensure live streaming (Socket.io) is started
require('./socket.js');
const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
=======
const { app, BrowserWindow, Tray, Menu, nativeImage, desktopCapturer, ipcMain } = require('electron');
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

<<<<<<< HEAD
// Read userId and backendUrl from agent-config.json (enterprise style)
let configUserId = null;
let backendUrl = 'http://localhost:5000';
try {
  const config = JSON.parse(fs.readFileSync(__dirname + '/agent-config.json', 'utf-8'));
  configUserId = config.userId;
  backendUrl = config.backendUrl || 'http://localhost:5000';
  if (!configUserId) throw new Error('userId missing in config');
  console.log('[Electron Agent] Loaded userId from config:', configUserId);
  console.log('[Electron Agent] Loaded backendUrl from config:', backendUrl);
} catch (err) {
  console.error('[Electron Agent] Failed to load config:', err);
}

// Global reference to window for sending status updates
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
=======
// ─── Config ─────────────────────────────────────────────────────────────────
let configUserId = null;
let backendUrl = 'http://localhost:5000';
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
let isCapturing = false;
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
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
<<<<<<< HEAD
    alwaysOnTop: true,
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  // Start screenshot capture automatically for enterprise SaaS
  if (configUserId) {
    startScreenshotCapture();
  } else {
    console.error('[Electron Agent] No userId found, screenshot capture not started.');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Screenshot upload logic ---

// Use dynamic backend URL from config
const BACKEND_URL = `${backendUrl}/api/screenshot/upload`;
let screenshotInterval = null;
let isCapturing = false;

// Start screenshot capture interval (enterprise style)
function startScreenshotCapture() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  // Capture every 30 seconds (enterprise standard)
  screenshotInterval = setInterval(() => {
    captureAndUploadScreenshot();
  }, 30 * 1000);
  // Also capture immediately
  captureAndUploadScreenshot();
  console.log('Screenshot capture started with 30-second interval');
}

// Stop screenshot capture
ipcMain.on('stop-screenshot-capture', () => {
=======
  });
  statusWindow.loadFile('index.html');

  statusWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      statusWindow.hide();
    }
  });
}

function toggleStatusWindow() {
  if (!statusWindow) {
    createStatusWindow();
    statusWindow.show();
  } else if (statusWindow.isVisible()) {
    statusWindow.hide();
  } else {
    statusWindow.show();
  }
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

function pauseCapture() {
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
<<<<<<< HEAD
  console.log('Screenshot capture stopped');
});

// Start screenshot capture from renderer
ipcMain.on('start-screenshot-capture', () => {
  startScreenshotCapture();
  console.log('Screenshot capture started manually');
});

async function captureAndUploadScreenshot() {
  if (!configUserId) {
    console.log('[Electron Agent] ERROR: No userId set for screenshot upload');
    sendStatusToRenderer('error', 'No user ID configured');
    return;
  }
  if (isCapturing) {
    console.log('[Electron Agent] Screenshot capture already in progress');
    return;
  }
  isCapturing = true;
  sendStatusToRenderer('capturing', 'Capturing screenshot...');
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
    if (!sources[0]) {
      sendStatusToRenderer('error', 'No screen source available');
      isCapturing = false;
      return;
    }
    const screenshotDataUrl = sources[0].thumbnail.toDataURL();
    sendStatusToRenderer('uploading', 'Uploading screenshot...');
    // Upload to backend
    console.log('[Electron Agent] Uploading screenshot for user:', configUserId, '...');
    const payload = {
      userId: configUserId,
      url: screenshotDataUrl,
      blurred: false
    };
    console.log('[Electron Agent] Screenshot upload payload:', JSON.stringify(payload).slice(0, 200) + '...');
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('[Electron Agent] Screenshot upload response status:', response.status);
    let responseBody;
    try {
      responseBody = await response.text();
      console.log('[Electron Agent] Screenshot upload response body:', responseBody.slice(0, 500));
    } catch (e) {
      console.error('[Electron Agent] Error reading response body:', e);
    }
    if (response.ok) {
      let result;
      try {
        result = JSON.parse(responseBody);
      } catch (e) {
        result = responseBody;
      }
      console.log('[Electron Agent] Screenshot uploaded successfully:', result.screenshot?._id || result);
      sendStatusToRenderer('success', 'Screenshot captured successfully');
    } else {
      console.error('[Electron Agent] Screenshot upload failed:', responseBody);
      sendStatusToRenderer('error', 'Failed to upload screenshot: ' + responseBody);
      // Print error to Electron window for diagnostics
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.error('[Electron Agent] Screenshot upload failed:', ${JSON.stringify(responseBody)})`);
      }
    }
  } catch (err) {
    console.error('[Electron Agent] Screenshot capture error:', err.message, err);
    sendStatusToRenderer('error', 'Error: ' + err.message);
    // Print error to Electron window for diagnostics
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript(`console.error('[Electron Agent] Screenshot capture error:', ${JSON.stringify(err.message)})`);
    }
  } finally {
=======
  isPaused = true;
  console.log('[Agent] Capture paused');
  updateTrayMenu();
  sendStatusToWindow('paused', 'Monitoring paused');
}

function resumeCapture() {
  startCapture();
  sendStatusToWindow('success', 'Monitoring resumed');
}

async function captureAndSend() {
  if (!configUserId || isCapturing || isPaused) return;
  isCapturing = true;

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (!sources[0]) {
      isCapturing = false;
      return;
    }

    const fullResDataUrl = sources[0].thumbnail.toDataURL();

    // Live frame: optimized JPEG for streaming
    const fullImage = nativeImage.createFromDataURL(fullResDataUrl);
    const resized = fullImage.resize({ width: 960, height: 540, quality: 'good' });
    const jpegBuf = resized.toJPEG(60);
    const frameDataUrl = `data:image/jpeg;base64,${jpegBuf.toString('base64')}`;

    // Emit live frame immediately
    const connected = socketManager.socket && socketManager.socket.connected;
    if (connected) {
      const payload = {
        userId: configUserId,
        frame: frameDataUrl,
        timestamp: Date.now()
      };
      socketManager.socket.emit('live-frame', payload);
      captureCount++;
      console.log(`[Agent] Frame #${captureCount} emitted (${Math.round(jpegBuf.length / 1024)}KB, socket: ${socketManager.socket.id})`);
      if (captureCount % 10 === 0) updateTrayMenu();
    } else {
      console.warn('[Agent] Socket NOT connected, frame dropped. Socket state:', socketManager.socket?.connected, socketManager.socket?.id);
    }

    isCapturing = false;

    // Full-res screenshot upload on slower cadence
    const now = Date.now();
    if (!isUploadingScreenshot && (now - lastScreenshotUploadTime >= SCREENSHOT_UPLOAD_INTERVAL)) {
      isUploadingScreenshot = true;
      lastScreenshotUploadTime = now;
      uploadScreenshot(fullResDataUrl).finally(() => { isUploadingScreenshot = false; });
    }

  } catch (err) {
    console.error('[Agent] Capture error:', err.message);
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
    isCapturing = false;
  }
}

<<<<<<< HEAD
// Send status to renderer process
function sendStatusToRenderer(status, message) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('screenshot-status', { status, message, timestamp: new Date().toISOString() });
  }
}

// IPC for manual screenshot capture
ipcMain.handle('capture-screen', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.map(source => ({ id: source.id, thumbnail: source.thumbnail.toDataURL() }));
});

// IPC to get screenshot interval status
ipcMain.handle('get-screenshot-status', () => {
  return {
    isCapturing: !!screenshotInterval,
    interval: 30,
    userId: dynamicUserId
  };
=======
async function uploadScreenshot(dataUrl) {
  try {
    const res = await fetch(BACKEND_URL(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: configUserId, url: dataUrl, blurred: false })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[Agent] Screenshot uploaded:', data.screenshot?._id || 'ok');
      sendStatusToWindow('success', 'Screenshot saved');
    } else {
      console.error('[Agent] Upload failed:', res.status);
    }
  } catch (err) {
    console.error('[Agent] Upload error:', err.message);
  }
}

// ─── IPC for Status Window ──────────────────────────────────────────────────
function sendStatusToWindow(status, message) {
  if (statusWindow && statusWindow.webContents) {
    statusWindow.webContents.send('screenshot-status', {
      status, message,
      timestamp: new Date().toISOString(),
      captureCount,
      isPaused,
      connected: socketManager.socket?.connected || false
    });
  }
}

ipcMain.on('stop-screenshot-capture', () => pauseCapture());
ipcMain.on('start-screenshot-capture', () => resumeCapture());
ipcMain.handle('capture-screen', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.map(s => ({ id: s.id, thumbnail: s.thumbnail.toDataURL() }));
});
ipcMain.handle('get-screenshot-status', () => ({
  isCapturing: !isPaused,
  interval: CAPTURE_INTERVAL / 1000,
  userId: configUserId,
  captureCount,
  connected: socketManager.socket?.connected || false
}));

// ─── App Lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setupAutoStart();
  createTray();

  // Start capture if configured
  if (configUserId) {
    startCapture();
  } else {
    console.error('[Agent] No userId configured. Open agent-config.json to set it.');
    // Show status window so user can see the error
    createStatusWindow();
    statusWindow.show();
  }
});

// Keep app running when window is closed (tray mode)
app.on('window-all-closed', (e) => {
  // Do NOT quit - keep running in system tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
});
