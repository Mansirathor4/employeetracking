const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://your-backend-url.com:27017/emp';

mongoose.connect(mongoUri)
  .then(() => console.log('[MongoDB] Connected successfully to:', mongoUri.replace(/\/\/.*@/, '//<credentials>@')))
  .catch(err => console.error('[MongoDB] Connection FAILED:', err.message));

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

module.exports = mongoose;
