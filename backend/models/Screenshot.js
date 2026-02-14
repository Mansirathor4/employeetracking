const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
  url: { type: String, required: true }, // Cloud storage URL
  timestamp: { type: Date, default: Date.now },
  blurred: { type: Boolean, default: false },
});

module.exports = mongoose.model('Screenshot', screenshotSchema);
