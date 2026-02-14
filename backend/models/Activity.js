const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  app: { type: String },
  url: { type: String },
  category: { type: String, enum: ['productive', 'unproductive', 'neutral'], default: 'neutral' },
  keystrokes: { type: Number, default: 0 },
  mouseActivity: { type: Number, default: 0 },
  idleTime: { type: Number, default: 0 }, // in minutes
});

module.exports = mongoose.model('Activity', activitySchema);
