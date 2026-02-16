// This file is a placeholder for the Electron agent's Socket.io integration.
// It will connect to the backend and send status updates and live frames.

const fs = require('fs');
const path = require('path');
const { io } = require('socket.io-client');
const { desktopCapturer } = require('electron');

// Read config from agent-config.json
let config = {};
try {
  const configPath = path.join(__dirname, 'agent-config.json');
  console.log('[Electron Agent] Reading config from:', configPath);
  const configData = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configData);
  console.log('[Electron Agent] Config loaded:', JSON.stringify(config));
} catch (err) {
  console.error('[Electron Agent] Failed to load config:', err.message);
}

// Set backendUrl and userId from config
let backendUrl = config.backendUrl || 'http://localhost:5000';
let userId = config.userId || null;

console.log('[Electron Agent] Backend URL:', backendUrl);
console.log('[Electron Agent] User ID:', userId);

const socket = io(backendUrl);

// Send status update every minute
setInterval(() => {
  if (userId) {
    socket.emit('status-update', { userId, status: 'online', timestamp: Date.now() });
    console.log('[Electron Agent] Status update sent for user:', userId);
  }
}, 60 * 1000);

socket.on('connect', () => {
  console.log('[Electron Agent] Connected to backend Socket.io');
});

socket.on('disconnect', () => {
  console.error('[Electron Agent] Disconnected from backend Socket.io');
});

socket.on('connect_error', (err) => {
  console.error('[Electron Agent] Socket.io connection error:', err);
});
