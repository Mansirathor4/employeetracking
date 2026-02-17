const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['online', 'idle', 'offline'], required: true },
  event: { type: String }, // e.g. 'mousemove', 'keydown', 'system', etc.
  details: { type: Object }, // extra info if needed
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
