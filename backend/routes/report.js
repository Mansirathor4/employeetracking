const express = require('express');
const Report = require('../models/Report');
const router = express.Router();

// Create report
router.post('/create', async (req, res) => {
  try {
    const { user, admin, type, data } = req.body;
    const report = new Report({ user, admin, type, data });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get reports
router.get('/all', async (req, res) => {
  try {
    const reports = await Report.find().populate('user admin');
    res.json(reports);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
