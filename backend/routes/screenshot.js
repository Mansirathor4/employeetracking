const express = require('express');
const Screenshot = require('../models/Screenshot');
const router = express.Router();

// Upload screenshot (with optional blur)
router.post(
  '/upload',
  async (req, res) => {
    try {
      console.log('[Screenshot Upload] Raw req.body:', JSON.stringify(req.body).slice(0, 200));
      const { userId, attendanceId, url, blurred } = req.body;
      
      console.log('[Screenshot Upload] Destructured values:');
      console.log('  userId:', userId, 'type:', typeof userId);
      console.log('  url length:', url ? url.length : 'undefined');
      console.log('  blurred:', blurred);
      
      // Validate userId
      if (!userId || typeof userId !== 'string') {
        console.log('[Screenshot Upload] Validation failed: userId is not valid string');
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: [{ path: 'userId', msg: 'userId must be a valid string' }] 
        });
      }
      
      if (userId.length !== 24) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: [{ path: 'userId', msg: `userId must be exactly 24 characters (got ${userId.length})` }] 
        });
      }
      
      // Validate screenshot data URL
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: [{ path: 'url', msg: 'url must be a valid string' }] 
        });
      }
      
      if (!url.startsWith('data:image/')) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: [{ path: 'url', msg: 'url must be a valid data URL starting with "data:image/"' }] 
        });
      }
      
      // Convert userId to ObjectId
      const mongoose = require('mongoose');
      let userObjId;
      try {
        userObjId = new mongoose.Types.ObjectId(userId);
      } catch (err) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: [{ path: 'userId', msg: 'userId is not a valid MongoDB ObjectId' }] 
        });
      }
      
      // Check if user exists
      const User = require('../models/User');
      const userExists = await User.findById(userObjId);
      if (!userExists) {
        console.log('[Screenshot Upload] User not found:', userObjId);
        return res.status(400).json({ 
          error: 'User not found', 
          details: [{ path: 'userId', msg: 'User does not exist in database' }] 
        });
      }
      
      console.log('[Screenshot Upload] User found, saving screenshot...');
      
      const screenshot = new Screenshot({
        user: userObjId,
        attendance: attendanceId,
        url,
        blurred: !!blurred,
        timestamp: new Date()
      });
      
      await screenshot.save();
      console.log(`[Screenshot Upload] Screenshot saved: ${screenshot._id} for user: ${userObjId}`);
      
      res.status(201).json({
        success: true,
        message: 'Screenshot uploaded successfully',
        screenshot: screenshot
      });
    } catch (err) {
      console.error('[Screenshot Upload] Error:', err);
      res.status(500).json({
        error: err.message || 'Failed to upload screenshot',
        success: false
      });
    }
  }
);


// Manual deletion by employee (and remove associated time if needed)
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Screenshot ID is required' });
    }
    
    const screenshot = await Screenshot.findById(id);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    // Optionally, remove associated attendance time (handled in frontend or with additional logic)
    await Screenshot.findByIdAndDelete(id);
    
    console.log(`Screenshot deleted: ${id}`);
    
    res.json({ 
      success: true,
      message: 'Screenshot deleted successfully' 
    });
  } catch (err) {
    console.error('Screenshot deletion error:', err);
    res.status(400).json({ 
      error: err.message || 'Failed to delete screenshot',
      success: false 
    });
  }
});

// Get screenshots for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const screenshots = await Screenshot.find({ user: userId }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      count: screenshots.length,
      screenshots: screenshots
    });
  } catch (err) {
    console.error('Screenshot fetch error:', err);
    res.status(400).json({ 
      error: err.message || 'Failed to fetch screenshots',
      success: false 
    });
  }
});

// Get screenshot by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Screenshot ID is required' });
    }
    
    const screenshot = await Screenshot.findById(id);
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    res.json({
      success: true,
      screenshot: screenshot
    });
  } catch (err) {
    console.error('Screenshot fetch error:', err);
    res.status(400).json({ 
      error: err.message || 'Failed to fetch screenshot',
      success: false 
    });
  }
});

module.exports = router;
