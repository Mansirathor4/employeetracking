// Ensure live streaming (Socket.io) is started
const socketManager = require('./socket.js');
const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
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
  // Capture every 3 seconds for smooth live streaming (enterprise-grade)
  const CAPTURE_INTERVAL = 3000; 
  screenshotInterval = setInterval(() => {
    captureAndUploadScreenshot();
  }, CAPTURE_INTERVAL);
  // Also capture immediately
  captureAndUploadScreenshot();
  console.log(`Screenshot capture started with ${CAPTURE_INTERVAL/1000}-second interval for enterprise streaming`);
}

// Stop screenshot capture
ipcMain.on('stop-screenshot-capture', () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  console.log('Screenshot capture stopped');
});

// Start screenshot capture from renderer
ipcMain.on('start-screenshot-capture', () => {
  startScreenshotCapture();
  console.log('Screenshot capture started manually');
});

// Track screenshot upload separately so live frames are never blocked
let isUploadingScreenshot = false;
let lastScreenshotUploadTime = 0;
const SCREENSHOT_UPLOAD_INTERVAL = 15000; // Upload full-res screenshot every 15s (not every frame)

async function captureAndUploadScreenshot() {
  if (!configUserId) {
    console.log('[Electron Agent] ERROR: No userId set for screenshot upload');
    sendStatusToRenderer('error', 'No user ID configured');
    return;
  }
  if (isCapturing) {
    console.log('[Electron Agent] Screenshot capture already in progress, skipping');
    return;
  }
  isCapturing = true;
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (!sources[0]) {
      sendStatusToRenderer('error', 'No screen source available');
      isCapturing = false;
      return;
    }

    // Get full-res image
    const fullResDataUrl = sources[0].thumbnail.toDataURL();

    // --- LIVE FRAME: Create optimized JPEG and emit immediately ---
    const nativeImage = require('electron').nativeImage;
    const fullImage = nativeImage.createFromDataURL(fullResDataUrl);
    const resizedImage = fullImage.resize({ width: 960, height: 540, quality: 'good' });

    // toJPEG returns a Buffer - convert to base64 data URL for the frontend <img> tag
    const jpegBuffer = resizedImage.toJPEG(60);
    const liveFrameDataUrl = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;

    // Emit live frame via Socket.io IMMEDIATELY (non-blocking, fast)
    try {
      if (socketManager.socket && socketManager.socket.connected) {
        socketManager.socket.emit('live-frame', {
          userId: configUserId,
          frame: liveFrameDataUrl,
          timestamp: Date.now()
        });
        console.log('[Electron Agent] Live frame emitted (' + Math.round(jpegBuffer.length / 1024) + 'KB JPEG) for user:', configUserId);
      } else {
        console.warn('[Electron Agent] Socket not connected, skipping live frame');
      }
    } catch (err) {
      console.error('[Electron Agent] Error emitting live frame:', err.message);
    }

    // Release capture lock immediately so next live frame is not blocked
    isCapturing = false;
    sendStatusToRenderer('success', 'Live frame sent');

    // --- FULL-RES SCREENSHOT UPLOAD: Fire-and-forget, on a slower cadence ---
    const now = Date.now();
    if (!isUploadingScreenshot && (now - lastScreenshotUploadTime >= SCREENSHOT_UPLOAD_INTERVAL)) {
      isUploadingScreenshot = true;
      lastScreenshotUploadTime = now;
      uploadFullScreenshot(fullResDataUrl).finally(() => {
        isUploadingScreenshot = false;
      });
    }

  } catch (err) {
    console.error('[Electron Agent] Capture error:', err.message, err);
    sendStatusToRenderer('error', 'Error: ' + err.message);
    isCapturing = false;
  }
}

// Separate async function for full-res screenshot upload (does not block live frames)
async function uploadFullScreenshot(fullResDataUrl) {
  try {
    const payload = { userId: configUserId, url: fullResDataUrl, blurred: false };
    console.log('[Electron Agent] Uploading full-res screenshot (' + Math.round(fullResDataUrl.length / 1024 / 1024) + 'MB)...');
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const result = await response.json();
      console.log('[Electron Agent] Screenshot uploaded:', result.screenshot?._id || 'ok');
    } else {
      const body = await response.text();
      console.error('[Electron Agent] Screenshot upload failed:', response.status, body.slice(0, 300));
    }
  } catch (err) {
    console.error('[Electron Agent] Screenshot upload error:', err.message);
  }
}

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
    interval: 3,
    userId: configUserId
  };
});
