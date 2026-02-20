
const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { upload } = require('../index');
const router = express.Router();

// Get all employees (for admin dashboard)
router.get('/employees', async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' });
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ...existing code...



// Upload avatar for existing user
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.body.id;
    if (!userId || !req.file) return res.status(400).json({ error: 'Missing user id or file' });
    const avatar = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, { avatar }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Avatar updated', avatar });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Register with avatar upload
const generateAndEmailAgentConfig = require('../utils/emailAgentConfig');
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    let avatar = undefined;
    if (req.file) {
      avatar = `/uploads/avatars/${req.file.filename}`;
    }
    const user = new User({ name, email, password: hashedPassword, role, avatar });
    await user.save();

    // Email agent config if employee
    if (role === 'employee') {
      console.log(`[Register] Generating and emailing agent config for ${email} (${user._id})`);
      try {
        await generateAndEmailAgentConfig(user);
        console.log(`[Register] Email sent to ${email}`);
      } catch (emailErr) {
        console.error(`[Register] Failed to send config email to ${email}:`, emailErr);
      }
    }

    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    console.error('[Register] Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get profile
router.get('/profile', async (req, res) => {
  try {
    // For demo, get user by id from query
    const user = await User.findById(req.query.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
