const express = require('express');
const Project = require('../models/Project');
const router = express.Router();

// Create project
router.post('/create', async (req, res) => {
  try {
    const { name, description, employees } = req.body;
    const project = new Project({ name, description, employees });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all projects
router.get('/all', async (req, res) => {
  try {
    const projects = await Project.find().populate('employees');
    res.json(projects);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
