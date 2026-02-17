const express = require('express');
const Activity = require('../models/Activity');
const router = express.Router();

// Log activity
router.post('/log', async (req, res) => {
  try {
    const { userId, app, url, category, keystrokes, mouseActivity, idleTime } = req.body;
    const activity = new Activity({
      user: userId,
      date: new Date(),
      app,
      url,
      category,
      keystrokes,
      mouseActivity,
      idleTime,
    });
    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get activity history
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    const history = await Activity.find({ user: userId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
