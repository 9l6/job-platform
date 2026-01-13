// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load .env reliably from backend folder (works even if you start node from project root)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploads from a stable absolute path (works on Windows + when running from project root)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobseeker', require('./routes/jobseeker'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/applications', require('./routes/application'));

// ✅ IMPORTANT: aggregated jobs routes
app.use('/api/aggregated-jobs', require('./routes/aggregatedJobs'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Job Platform API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
