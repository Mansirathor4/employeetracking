// iohook activity tracking for Electron
const iohook = require('iohook');
const axios = require('axios');

let lastActivity = 0;
const userId = configUserId; // Already loaded from config in main.js

function sendActivity(type, event) {
  const now = Date.now();
  if (now - lastActivity < 10000) return; // throttle to 10s
  lastActivity = now;
  axios.post('https://your-backend-url.com/api/activitylog/log', {
    userId,
    type, // 'online', 'idle', 'offline'
    event,
    details: {}
  }).catch(() => {});
}

iohook.on('mousemove', () => sendActivity('online', 'mousemove'));
iohook.on('keydown', () => sendActivity('online', 'keydown'));
iohook.start();

// Idle/offline detection (optional):
let idleTimer = null;
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    sendActivity('idle', 'idle');
    // After another period, mark as offline
    setTimeout(() => sendActivity('offline', 'offline'), 60000); // 1 min after idle
  }, 60000); // 1 min idle
}
iohook.on('mousemove', resetIdleTimer);
iohook.on('keydown', resetIdleTimer);
resetIdleTimer();
