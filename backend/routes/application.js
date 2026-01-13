// backend/routes/application.js - FIXED VERSION
const express = require('express');
const path = require('path');
const Job = require('../models/Job');
const JobSeeker = require('../models/JobSeeker');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendApplicationEmail, sendConfirmationEmail } = require('../utils/email');
const { calculateMatchScore } = require('../utils/matching');

const router = express.Router();

// All routes are protected and for jobseekers only
router.use(protect);
router.use(authorize('jobseeker'));

// @route   POST /api/applications/apply
// @desc    Apply to a job
// @access  Private (Jobseeker)
router.post('/apply', async (req, res) => {
  try {
    const { jobId } = req.body;

    console.log('Application attempt:', { jobId, userId: req.user._id });

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    // Get job
    const job = await Job.findById(jobId);
    if (!job) {
      console.error('Job not found:', jobId);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get jobseeker profile
    const jobSeeker = await JobSeeker.findOne({ userId: req.user._id });
    if (!jobSeeker) {
      console.error('JobSeeker profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Job seeker profile not found. Please complete your profile first.'
      });
    }

    // Check if CV is uploaded
    if (!jobSeeker.cvPath) {
      console.error('No CV uploaded for user:', req.user._id);
      return res.status(400).json({
        success: false,
        message: 'Please upload your CV in your profile before applying'
      });
    }

    // Verify CV file exists
    const fs = require('fs');
    // jobSeeker.cvPath is stored as a web path like /uploads/cv/...
    const cvRel = String(jobSeeker.cvPath || '').replace(/^\/+/g, '');
    const cvFullPath = path.join(__dirname, '..', cvRel);
    if (!fs.existsSync(cvFullPath)) {
      console.error('CV file not found at path:', cvFullPath);
      return res.status(400).json({
        success: false,
        message: 'CV file not found. Please re-upload your CV.'
      });
    }

    // Anti-spam: Check daily application limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastAppDate = jobSeeker.lastApplicationDate 
      ? new Date(jobSeeker.lastApplicationDate)
      : null;

    if (lastAppDate) {
      lastAppDate.setHours(0, 0, 0, 0);
    }

    // Reset counter if it's a new day
    if (!lastAppDate || lastAppDate.getTime() !== today.getTime()) {
      jobSeeker.dailyApplications = 0;
      jobSeeker.lastApplicationDate = new Date();
    }

    // Check if limit reached
    const maxApplications = parseInt(process.env.MAX_DAILY_APPLICATIONS) || 10;
    if (jobSeeker.dailyApplications >= maxApplications) {
      console.log('Daily limit reached for user:', req.user._id);
      return res.status(429).json({
        success: false,
        message: `Daily application limit reached (${maxApplications} applications per day). Please try again tomorrow.`
      });
    }

    // Calculate match score
    const matchData = calculateMatchScore(jobSeeker, job);

    // Prepare email data
    const jobSeekerData = {
      fullName: jobSeeker.fullName,
      email: req.user.email,
      phone: jobSeeker.phone || 'Not provided',
      country: jobSeeker.country || 'Not specified',
      city: jobSeeker.city || 'Not specified',
      desiredJobTitle: jobSeeker.desiredJobTitle || 'Not specified',
      skills: jobSeeker.skills || [],
      experienceLevel: jobSeeker.experienceLevel,
      workType: jobSeeker.workType || []
    };

    const jobData = {
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      hrEmail: job.hrEmail
    };

    console.log('Sending application email to:', job.hrEmail);

    // Send application email to company
    try {
      await sendApplicationEmail(jobData, jobSeekerData, cvFullPath);
      console.log('Application email sent successfully');
    } catch (emailError) {
      console.error('Failed to send application email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send application email. Please check your email configuration.'
      });
    }

    // Add delay to prevent spam
    const emailDelay = parseInt(process.env.EMAIL_DELAY_MS) || 2000;
    await new Promise(resolve => setTimeout(resolve, emailDelay));

    // Send confirmation email to job seeker
    const applicationData = {
      jobSeekerName: jobSeeker.fullName,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      location: `${job.location.city}, ${job.location.country}`,
      hrEmail: job.hrEmail,
      submittedAt: new Date(),
      matchPercentage: matchData.score,
      matchingReasons: matchData.matchingReasons,
      matchedSkills: matchData.matchedSkills
    };

    try {
      await sendConfirmationEmail(req.user.email, applicationData);
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if confirmation email fails
    }

    // Update application count
    jobSeeker.dailyApplications += 1;
    jobSeeker.lastApplicationDate = new Date();
    await jobSeeker.save();

    console.log('Application successful for user:', req.user._id);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationData: {
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        matchScore: matchData.score,
        remainingApplications: maxApplications - jobSeeker.dailyApplications
      }
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit application. Please try again.'
    });
  }
});

// @route   GET /api/applications/stats
// @desc    Get application statistics
// @access  Private (Jobseeker)
router.get('/stats', async (req, res) => {
  try {
    const jobSeeker = await JobSeeker.findOne({ userId: req.user._id });
    
    if (!jobSeeker) {
      return res.status(404).json({
        success: false,
        message: 'Job seeker profile not found'
      });
    }

    const maxApplications = parseInt(process.env.MAX_DAILY_APPLICATIONS) || 10;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastAppDate = jobSeeker.lastApplicationDate 
      ? new Date(jobSeeker.lastApplicationDate)
      : null;

    let dailyApplications = 0;
    if (lastAppDate) {
      lastAppDate.setHours(0, 0, 0, 0);
      if (lastAppDate.getTime() === today.getTime()) {
        dailyApplications = jobSeeker.dailyApplications;
      }
    }

    res.json({
      success: true,
      stats: {
        dailyApplications,
        maxApplications,
        remainingApplications: maxApplications - dailyApplications,
        hasCV: !!jobSeeker.cvPath
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;