// This file is a placeholder for the Electron agent's Socket.io integration.
// It will connect to the backend and send status updates and live frames.

const fs = require('fs');
const { io } = require('socket.io-client');
const { desktopCapturer } = require('electron');

// Read backendUrl from agent-config.json, fallback to localhost
let backendUrl = 'http://localhost:5000';
try {
  const config = JSON.parse(fs.readFileSync(__dirname + '/agent-config.json', 'utf-8'));
  if (config.backendUrl) backendUrl = config.backendUrl;
} catch (err) {
  // Already handled below for userId
}
console.log('[Agent] Connecting to:', backendUrl);
const socket = io(backendUrl);

// Always get userId from agent-config.json (Node.js/Electron compatible)
let userId = null;
// const fs = require('fs');
try {
  const config = JSON.parse(fs.readFileSync(__dirname + '/agent-config.json', 'utf-8'));
  userId = config.userId;
  if (!userId) throw new Error('userId missing in config');
  console.log('[Electron Agent] Loaded userId from config:', userId);
} catch (err) {
  console.error('[Electron Agent] Failed to load userId from config:', err);
}

// Send status update every minute
setInterval(() => {
  if (userId) {
    socket.emit('status-update', { userId, status: 'online', timestamp: Date.now() });
    console.log('[Electron Agent] Status update sent for user:', userId);

  const fs = require('fs');
  const { io } = require('socket.io-client');
  const { desktopCapturer } = require('electron');

  // Read backendUrl from agent-config.json, fallback to localhost
  let backendUrl = 'http://localhost:5000';
  try {
    const config = JSON.parse(fs.readFileSync(__dirname + '/agent-config.json', 'utf-8'));
    if (config.backendUrl) backendUrl = config.backendUrl;
  } catch (err) {
    // Already handled below for userId
  }
  console.log('[Agent] Connecting to:', backendUrl);
  const socket = io(backendUrl);

  // Always get userId from agent-config.json (Node.js/Electron compatible)
  let userId = null;
  try {
    const config = JSON.parse(fs.readFileSync(__dirname + '/agent-config.json', 'utf-8'));
    userId = config.userId;
    if (!userId) throw new Error('userId missing in config');
    console.log('[Electron Agent] Loaded userId from config:', userId);
  } catch (err) {
    console.error('[Electron Agent] Failed to load userId from config:', err);
  }
socket.on('connect', () => {
  console.log('[Electron Agent] Connected to backend Socket.io');
});

socket.on('disconnect', () => {
  console.error('[Electron Agent] Disconnected from backend Socket.io');
});

socket.on('connect_error', (err) => {
  console.error('[Electron Agent] Socket.io connection error:', err);
});
