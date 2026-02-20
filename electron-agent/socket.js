// This file is a placeholder for the Electron agent's Socket.io integration.
// It will connect to the backend and send status updates and live frames.

const fs = require('fs');
const path = require('path');
const { io } = require('socket.io-client');
const { desktopCapturer } = require('electron');

// Read config from agent-config.json (supports packaged app)
let config = {};
try {
  // In packaged app, config is in resources; in dev, it's in __dirname
  const { app } = require('electron');
  const configPath = path.join(
    (app && app.isPackaged) ? process.resourcesPath : __dirname,
    'agent-config.json'
  );
  console.log('[Agent Socket] Reading config from:', configPath);
  const configData = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configData);
  console.log('[Agent Socket] Config loaded:', JSON.stringify(config));
} catch (err) {
  console.error('[Agent Socket] Config error:', err.message);
}

// Set backendUrl and userId from config
let backendUrl = config.backendUrl || 'http://localhost:5000';
let userId = config.userId || null;


console.log('[Electron Agent] Backend URL:', backendUrl);
console.log('[Electron Agent] User ID:', userId);

const socket = io(backendUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000, // Increased max delay
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling'],
  upgrade: true,
  timeout: 20000,
  pingInterval: 10000, // Ping every 10 seconds
  pingTimeout: 5000
});

// Connection state tracking
let isConnected = false;
let lastConnectedTime = null;

// Send status update every 30 seconds (reduced from 60 for more frequent heartbeats)
setInterval(() => {
  if (userId && isConnected) {
    socket.emit('status-update', { userId, status: 'online', timestamp: Date.now() });
    console.log('[Electron Agent] Status update sent for user:', userId);
  }
}, 30 * 1000);

// Enhanced connection handlers with better logging and reconnection handling
socket.on('connect', () => {
  isConnected = true;
  lastConnectedTime = new Date();
  console.log('[Electron Agent] Connected to backend Socket.io (ID:', socket.id + ')');
  
  // Register as agent for this user so backend routes frames to the right viewers
  if (userId) {
    socket.emit('register-agent', { userId });
    socket.emit('status-update', { userId, status: 'online', timestamp: Date.now() });
    console.log('[Electron Agent] Registered agent and sent status for user:', userId);
  }
});

socket.on('disconnect', (reason) => {
  isConnected = false;
  console.warn('[Electron Agent] ✗ Disconnected from backend Socket.io. Reason:', reason);
  
  // If manually closed by server, try to reconnect
  if (reason === 'io server disconnect') {
    console.log('[Electron Agent] Server disconnected, attempting to reconnect...');
    socket.connect();
  }
});

socket.on('connect_error', (err) => {
  console.error('[Electron Agent] Socket.io connection error:', err.message || err);
  isConnected = false;
});

// Enhanced reconnection event handlers
socket.io.on('reconnect', (attemptNumber) => {
  console.log('[Electron Agent] ✓ Reconnected after', attemptNumber, 'attempts');
  isConnected = true;
  
  // Send status update on reconnect
  if (userId) {
    socket.emit('status-update', { userId, status: 'online', timestamp: Date.now() });
    console.log('[Electron Agent] Status update sent after reconnection for user:', userId);
  }
});

socket.io.on('reconnect_attempt', (attemptNumber) => {
  console.log('[Electron Agent] Reconnection attempt #', attemptNumber);
});

socket.io.on('reconnect_error', (err) => {
  console.error('[Electron Agent] Reconnection error:', err.message);
});

socket.io.on('reconnect_failed', () => {
  console.error('[Electron Agent] Failed to reconnect after all attempts');
});

// Export connection status helper
const isSocketConnected = () => isConnected;

module.exports = {
  socket,
  userId,
  backendUrl
};
