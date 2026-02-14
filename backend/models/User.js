const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  projects: [{ type: String }],
  isActive: { type: Boolean, default: true },
  avatar: { type: String }, // URL or path to profile photo
});

module.exports = mongoose.model('User', userSchema);
