const express = require('express');
const { body, validationResult } = require('express-validator');
const Screenshot = require('../models/Screenshot');
const router = express.Router();
// Serve screenshot image as binary from base64 data URL
router.get('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const screenshot = await Screenshot.findById(id);
    if (!screenshot) {
      return res.status(404).send('Screenshot not found');
    }
    // The url field contains a data URL (base64), not a file path
    if (screenshot.url && screenshot.url.startsWith('data:image/')) {
      const matches = screenshot.url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) return res.status(400).send('Invalid image data');
      const type = matches[1];
      const data = matches[2];
      const img = Buffer.from(data, 'base64');
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': img.length
      });
      return res.end(img);
    } else {
      return res.status(400).send('No image data');
    }
  } catch (err) {
    console.error('Image fetch error:', err);
    res.status(500).send('Server error');
  }
});

// Upload screenshot (with optional blur)
router.post(
  '/upload',
  [
    body('userId').isString().isLength({ min: 24, max: 24 }).withMessage('Valid userId is required'),
    body('url').isString().matches(/^data:image\//).withMessage('Valid screenshot data URL is required')
  ],
  async (req, res) => {
    // Debug log for received values
    console.log('Request body:', req.body);
    console.log('Received userId:', req.body.userId);
    if (req.body.url) {
      console.log('Received url:', req.body.url.slice(0, 30)); // Print first 30 chars
    } else {
      console.log('Received url: undefined');
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      const { userId, attendanceId, url, blurred } = req.body;
      // Convert userId to ObjectId if needed
      let userObjId = userId;
      const mongoose = require('mongoose');
      if (typeof userId === 'string' && userId.length === 24) {
        userObjId = new mongoose.Types.ObjectId(userId);
      }
      // Check if user exists
      const User = require('../models/User');
      const userExists = await User.findById(userObjId);
      if (!userExists) {
        return res.status(400).json({ error: 'User not found', details: [{ path: 'userId', msg: 'User does not exist' }] });
      }
      // Validate screenshot data URL
      if (!url || typeof url !== 'string' || !url.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid screenshot data URL', details: [{ path: 'url', msg: 'Valid screenshot data URL is required' }] });
      }
      const screenshot = new Screenshot({
        user: userObjId,
        attendance: attendanceId,
        url,
        blurred: !!blurred,
        timestamp: new Date()
      });
      await screenshot.save();
      console.log(`Screenshot saved: ${screenshot._id} for user: ${userObjId}`);
      res.status(201).json({
        success: true,
        message: 'Screenshot uploaded successfully',
        screenshot: screenshot
      });
    } catch (err) {
      console.error('Screenshot upload error:', err);
      res.status(400).json({
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
