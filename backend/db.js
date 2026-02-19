const mongoose = require('mongoose');

<<<<<<< HEAD
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
=======
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/emp';

mongoose.connect(mongoUri)
  .then(() => console.log('[MongoDB] Connected successfully to:', mongoUri.replace(/\/\/.*@/, '//<credentials>@')))
  .catch(err => console.error('[MongoDB] Connection FAILED:', err.message));

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
>>>>>>> f5baf6e1142e12cf81cce8165e6174e327ad0c6f
});

module.exports = mongoose;
