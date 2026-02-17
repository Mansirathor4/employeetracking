// Local disk storage for profile image upload
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/avatars'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });
module.exports.upload = upload;
// Winston logger setup
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'backend.log' })
  ]
});


// Entry point for Express backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
// Increase JSON body size limit to handle large screenshot data URLs (base64 encoded)
app.use(express.json({ limit: '50mb' }));
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 100 * 1024 * 1024 // 100MB for large screenshot payloads
});
const PORT = process.env.PORT || 5000;

require('./db');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Activity = require('./models/Activity');
const Project = require('./models/Project');
const Screenshot = require('./models/Screenshot');
const Report = require('./models/Report');


app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
// Log JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[Backend] JSON parse error:', err.message, 'Raw body:', req.rawBody);
    return res.status(400).json({ error: 'Invalid JSON', details: err.message });
  }
  next();
});


// Serve frontend build (production: Render serves both backend + frontend from one service)
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.get('/', (req, res) => {
  // If frontend build exists, serve it; otherwise show API status
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Employee Tracking System Backend - API is running');
  }
});


// Serve uploaded avatars statically
app.use('/uploads/avatars', express.static(require('path').join(__dirname, 'uploads/avatars')));


// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/user', require('./routes/user'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/project', require('./routes/project'));
app.use('/api/screenshot', require('./routes/screenshot'));
app.use('/api/report', require('./routes/report'));
app.use('/api/activitylog', require('./routes/activitylog'));

// SPA catch-all: serve frontend index.html for all non-API routes (React Router support)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`${err.message} (url: ${req.originalUrl})`);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


// Socket.io events with room-based routing for enterprise scalability
io.on('connection', (socket) => {
  console.log('[Socket.io] Client connected:', socket.id);

  // Electron agent registers itself for a userId
  socket.on('register-agent', (data) => {
    if (data && data.userId) {
      socket.join(`agent-${data.userId}`);
      socket.agentUserId = data.userId;
      console.log('[Socket.io] Agent registered for user:', data.userId);
    }
  });

  // Frontend viewer subscribes to watch a specific user's stream
  socket.on('watch-stream', (data) => {
    if (data && data.userId) {
      socket.join(`viewers-${data.userId}`);
      console.log('[Socket.io] Viewer subscribed to user:', data.userId, '(socket:', socket.id + ')');
    }
  });

  // Frontend viewer unsubscribes from a user's stream
  socket.on('stop-watching', (data) => {
    if (data && data.userId) {
      socket.leave(`viewers-${data.userId}`);
      console.log('[Socket.io] Viewer unsubscribed from user:', data.userId);
    }
  });

  socket.on('status-update', (data) => {
    if (data && data.userId) {
      // Broadcast status to all clients except the sender
      socket.broadcast.emit('status-update', data);
    }
  });

  socket.on('live-frame', (frame) => {
    if (frame && frame.userId && frame.frame) {
      // Only send to viewers watching this specific user (room-based routing)
      const viewerRoom = `viewers-${frame.userId}`;
      io.to(viewerRoom).emit('live-frame', frame);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io] Client disconnected:', socket.id, 'reason:', reason);
  });

  socket.on('error', (err) => {
    console.error('[Socket.io] Socket error:', err);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
