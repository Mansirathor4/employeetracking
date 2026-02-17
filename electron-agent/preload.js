const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  sendUserId: (userId) => ipcRenderer.send('set-user-id', userId),
  stopScreenshotCapture: () => ipcRenderer.send('stop-screenshot-capture'),
  startScreenshotCapture: () => ipcRenderer.send('start-screenshot-capture'),
  getScreenshotStatus: () => ipcRenderer.invoke('get-screenshot-status'),
  
  // Listen for screenshot status updates from main process
  onScreenshotStatus: (callback) => {
    ipcRenderer.on('screenshot-status', (event, data) => callback(data));
  },
  
  // Listen for user ID confirmation
  onUserIdConfirmed: (callback) => {
    ipcRenderer.on('user-id-confirmed', (event, userId) => callback(userId));
  },
  
  // Remove listeners
  removeScreenshotStatusListener: () => {
    ipcRenderer.removeAllListeners('screenshot-status');
  },
  
  removeUserIdConfirmedListener: () => {
    ipcRenderer.removeAllListeners('user-id-confirmed');
  }
});
