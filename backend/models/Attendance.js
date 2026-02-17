const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  punchIn: { type: Date },
  punchOut: { type: Date },
  sessions: [{ started: Date, stopped: Date }], // Multiple sessions per day
  breaks: [{ start: Date, end: Date }],
  activeTime: { type: Number, default: 0 }, // in minutes
  screenshots: [{ type: String }], // URLs to screenshots
  webcamSnaps: [{ type: String }], // URLs to webcam snaps
  status: { type: String, enum: ['online', 'idle', 'offline'], default: 'offline' }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
