// Ensure live streaming (Socket.io) is started
require('./socket.js');
const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

// Read userId from agent-config.json (enterprise style)
let configUserId = null;
try {
  const config = JSON.parse(fs.readFileSync(__dirname + '/agent-config.json', 'utf-8'));
  configUserId = config.userId;
  if (!configUserId) throw new Error('userId missing in config');
  console.log('[Electron Agent] Loaded userId from config:', configUserId);
} catch (err) {
  console.error('[Electron Agent] Failed to load userId from config:', err);
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

const BACKEND_URL = 'http://localhost:5000/api/screenshot/upload';
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
    isCapturing = false;
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
    interval: 30,
    userId: dynamicUserId
  };
});
