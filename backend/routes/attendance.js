const express = require('express');
const Attendance = require('../models/Attendance');
const router = express.Router();

// Punch In
router.post('/punch-in', async (req, res) => {
  try {
    const { userId } = req.body;
    const now = new Date();
    // Get start and end of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    let attendance = await Attendance.findOne({ user: userId, date: { $gte: startOfDay, $lt: endOfDay } });
    if (!attendance) {
      attendance = new Attendance({ user: userId, date: now, punchIn: now, sessions: [{ started: now }] });
    } else {
      // Only set punchIn if not already set for today
      if (!attendance.punchIn) {
        attendance.punchIn = now;
      }
      // Start new session
      if (!attendance.sessions) attendance.sessions = [];
      attendance.sessions.push({ started: now });
    }
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Punch Out
router.post('/punch-out', async (req, res) => {
  try {
    const { userId } = req.body;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    let attendance = await Attendance.findOne({ user: userId, date: { $gte: startOfDay, $lt: endOfDay } });
    if (!attendance) return res.status(404).json({ error: 'Attendance not found' });
    // End last session
    if (attendance.sessions && attendance.sessions.length > 0) {
      const lastSession = attendance.sessions[attendance.sessions.length - 1];
      if (!lastSession.stopped) {
        lastSession.stopped = now;
      }
      // Set punchOut to last session's stopped value
      attendance.punchOut = lastSession.stopped;
    } else {
      attendance.punchOut = now;
    }
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get attendance history
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    const history = await Attendance.find({ user: userId }).sort({ date: -1 });
    // Ensure sessions array is always present and punchIn/punchOut are mapped to session times
    const mapped = history.map(a => {
      const sessions = a.sessions || [];
      let punchIn = a.punchIn;
      let punchOut = a.punchOut;
      if (sessions.length > 0) {
        punchIn = sessions[0].started || punchIn;
        // Find last session with a stopped value
        let lastStoppedSession = null;
        for (let i = sessions.length - 1; i >= 0; i--) {
          if (sessions[i].stopped) {
            lastStoppedSession = sessions[i];
            break;
          }
        }
        if (lastStoppedSession) {
          punchOut = lastStoppedSession.stopped;
        } else {
          punchOut = sessions[sessions.length - 1].started || punchOut;
        }
      }
      return {
        _id: a._id,
        user: a.user,
        date: a.date,
        punchIn,
        punchOut,
        sessions,
        breaks: a.breaks || [],
        activeTime: a.activeTime,
        screenshots: a.screenshots || [],
        webcamSnaps: a.webcamSnaps || [],
        status: a.status
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Get all employees' attendance
router.get('/admin/all', async (req, res) => {
  try {
    // Populate user info for each attendance
    const allAttendance = await Attendance.find({})
      .populate('user', 'name email')
      .sort({ date: -1 });
    // Ensure sessions array is always present and punchIn/punchOut are mapped to session times
    const mapped = allAttendance.map(a => {
      const sessions = a.sessions || [];
      let punchIn = a.punchIn;
      let punchOut = a.punchOut;
      if (sessions.length > 0) {
        punchIn = sessions[0].started || punchIn;
        // Find last session with a stopped value
        let lastStoppedSession = null;
        for (let i = sessions.length - 1; i >= 0; i--) {
          if (sessions[i].stopped) {
            lastStoppedSession = sessions[i];
            break;
          }
        }
        if (lastStoppedSession) {
          punchOut = lastStoppedSession.stopped;
        } else {
          punchOut = sessions[sessions.length - 1].started || punchOut;
        }
      }
      return {
        _id: a._id,
        user: a.user,
        date: a.date,
        punchIn,
        punchOut,
        sessions,
        breaks: a.breaks || [],
        activeTime: a.activeTime,
        screenshots: a.screenshots || [],
        webcamSnaps: a.webcamSnaps || [],
        status: a.status
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
