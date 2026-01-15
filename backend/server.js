// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
// Load route modules (CommonJS)
const authRoutes = require('./routes/auth');
const jobseekerRoutes = require('./routes/jobseeker');
const jobRoutes = require('./routes/job');
const applicationRoutes = require('./routes/application');
const aggregatedJobsRoutes = require('./routes/aggregatedJobs');
// Load .env reliably from backend folder (works even if you start node from project root)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// Serve uploads from a stable absolute path (works on Windows + when running from project root)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
// ✅ IMPORTANT: aggregated jobs routes
app.use('/api/aggregated-jobs', aggregatedJobsRoutes);

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
