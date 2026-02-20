// Script to email agent-config.json files to employees using nodemailer
// Usage: node email-agent-configs.js
// Requires: npm install nodemailer dotenv

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./models/User');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const OUTPUT_DIR = path.join(__dirname, '../electron-agent/generated-configs');

// Configure your SMTP settings here (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS  // your app password (not your main password)
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/emp';

async function main() {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const employees = await User.find({ role: 'employee' });
  for (const user of employees) {
    if (!user.email) {
      console.log(`Skipping user ${user._id} (no email)`);
      continue;
    }
    const configPath = path.join(OUTPUT_DIR, `agent-config-${user._id}.json`);
    if (!fs.existsSync(configPath)) {
      console.log(`Config not found for user ${user.email}`);
      continue;
    }
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
  await mongoose.disconnect();
  console.log('All emails sent.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
