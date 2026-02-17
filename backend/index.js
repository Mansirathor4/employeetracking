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
app.use(express.json()); // <-- Move to top, before any routes or middleware
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
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
app.use(express.json());

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


app.get('/', (req, res) => {
  res.send('Employee Tracking System Backend');
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

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`${err.message} (url: ${req.originalUrl})`);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


// Socket.io events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('status-update', (data) => {
    // Broadcast status update to admins
    io.emit('status-update', data);
  });
  socket.on('live-frame', (frame) => {
    // Broadcast live screen frame to admins
    io.emit('live-frame', frame);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
