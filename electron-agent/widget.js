// Always-on-top widget for Electron agent (visible tracking)
const { BrowserWindow } = require('electron');

function createWidget() {
  const widget = new BrowserWindow({
    width: 220,
    height: 80,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  widget.loadURL('data:text/html,<body style="background:rgba(255,255,255,0.8);font-family:sans-serif;padding:10px;"><div id="timer">00:00:00</div><div>Tracking Active</div></body>');
  return widget;
}

module.exports = { createWidget };
