const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const router = express.Router();

// Log an activity event
router.post('/log', async (req, res) => {
  try {
    const { userId, type, event, details } = req.body;
    const log = new ActivityLog({ user: userId, type, event, details });
    await log.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get activity logs for a user (optionally by date)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    let query = { user: userId };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    const logs = await ActivityLog.find(query).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get working ratio for a user (online/idle/offline counts)
router.get('/user/:userId/ratio', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    let query = { user: userId };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    const logs = await ActivityLog.find(query);
    const ratio = { online: 0, idle: 0, offline: 0 };
    logs.forEach(l => { if (ratio[l.type] !== undefined) ratio[l.type]++; });
    const total = logs.length;
    res.json({
      online: total ? Math.round((ratio.online / total) * 100) : 0,
      idle: total ? Math.round((ratio.idle / total) * 100) : 0,
      offline: total ? Math.round((ratio.offline / total) * 100) : 0,
      total
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
