// Script to generate agent-config.json files for all users in the database
// Usage: node generate-agent-configs.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BACKEND_URL = 'https://employeetracking-3.onrender.com';
const OUTPUT_DIR = path.join(__dirname, '../electron-agent/generated-configs');

async function main() {
  // Prefer MONGO_URI from .env, then MONGODB_URI, then fallback
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/emp';
  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // Only fetch users with role 'employee'
  const users = await User.find({ role: 'employee' });
  console.log('Found employees:', users.length);
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const user of users) {
    const config = {
      userId: user._id.toString(),
      backendUrl: BACKEND_URL,
    };
    const filename = path.join(OUTPUT_DIR, `agent-config-${user._id}.json`);
    fs.writeFileSync(filename, JSON.stringify(config, null, 2));
    console.log('Generated:', filename);
  }
  await mongoose.disconnect();
  console.log('All configs generated in', OUTPUT_DIR);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
