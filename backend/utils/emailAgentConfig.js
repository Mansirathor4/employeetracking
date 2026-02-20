// backend/utils/emailAgentConfig.js
// Utility to generate and email agent config for a user (used in registration route)
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const BACKEND_URL = 'https://employeetracking-3.onrender.com';

// Configure your SMTP settings here (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const OUTPUT_DIR = path.join(__dirname, '../../electron-agent/generated-configs');

async function generateAndEmailAgentConfig(user) {
  if (!user.email) return;
  // Generate config object
  const config = {
    userId: user._id.toString(),
    backendUrl: BACKEND_URL,
  };
  // Save config file (optional, for record)
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const configPath = path.join(OUTPUT_DIR, `agent-config-${user._id}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  // Email config
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: 'Your Employee Tracking Agent Config File',
    text: `Dear ${user.name || 'Employee'},\n\nAttached is your agent-config.json file for the Employee Tracking system.\n\nPlease download this file and place it in your Electron agent folder.\n\nIf you have any questions, contact your admin.\n\nBest regards,\nAdmin`,
    attachments: [
      {
        filename: 'agent-config.json',
        path: configPath
      }
    ]
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Sent config to ${user.email}`);
  } catch (err) {
    console.error(`Failed to send to ${user.email}:`, err.message);
  }
}

module.exports = generateAndEmailAgentConfig;
