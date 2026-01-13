// backend/routes/jobseeker.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const JobSeeker = require('../models/JobSeeker');
const User = require('../models/User');
const AggregatedJob = require('../models/AggregatedJob');
const { protect, authorize } = require('../middleware/auth');
const { uploadCV, uploadProfileImage } = require('../middleware/upload');
const { sendProfileSavedEmail, sendMatchedJobsEmail } = require('../utils/email');
const { calculateMatchScore, calculateWeightedMatchScore } = require('../utils/matching');
const { buildProfileFingerprint } = require('../utils/profileFingerprint');
const { extractCvText } = require('../utils/cvParser');
const crypto = require('crypto');

const router = express.Router();

// All routes are protected and for jobseekers only
router.use(protect);
router.use(authorize('jobseeker'));

// @route   GET /api/jobseeker/profile
// @desc    Get jobseeker profile
// @access  Private (Jobseeker)
router.get('/profile', async (req, res) => {
  try {
    const profile = await JobSeeker.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/jobseeker/profile
// @desc    Update jobseeker profile
// @access  Private (Jobseeker)
router.put('/profile', [
  body('fullName').optional().trim().notEmpty(),
  body('age').optional().isInt({ min: 16, max: 100 }),
  body('email').optional().isEmail(),
  body('phone').optional().trim(),
  body('country').optional().trim(),
  body('city').optional().trim(),
  body('desiredJobTitle').optional().trim(),
  body('skills').optional().isArray(),
  body('workType').optional().isArray(),
  body('experienceLevel').optional().isIn(['no-experience', 'junior', 'mid-level', 'senior'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const allowedFields = [
      'fullName', 'age', 'country', 'city', 'phone',
      'desiredJobTitle', 'skills', 'workType', 'experienceLevel'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // keep updatedAt accurate (findOneAndUpdate bypasses pre('save'))
    updateData.updatedAt = new Date();

    const profile = await JobSeeker.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/jobseeker/upload-cv
// @desc    Upload CV
// @access  Private (Jobseeker)
router.post('/upload-cv', (req, res) => {
  uploadCV(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a CV file'
        });
      }

      // Store a web-accessible path (avoid absolute filesystem paths / Windows backslashes)
      const cvPath = `/uploads/cv/${req.file.filename}`;

      // Parse CV text accurately (PDF/DOCX) and store for matching
      let cvText = '';
      let cvTextHash = '';
      try {
        cvText = await extractCvText(req.file.path);
        cvTextHash = crypto.createHash('sha256').update(cvText).digest('hex');
      } catch (parseErr) {
        // Keep upload successful, but provide warning
        console.warn('CV parse warning:', parseErr.message);
      }

      const profile = await JobSeeker.findOneAndUpdate(
        { userId: req.user._id },
        { cvPath, cvText, cvTextHash, cvParsedAt: cvText ? new Date() : undefined },
        { new: true }
      );

      res.json({
        success: true,
        message: 'CV uploaded successfully',
        cvPath: profile.cvPath,
        cvParsed: !!profile.cvText
      });
    } catch (error) {
      console.error('CV upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });
});

// @route   POST /api/jobseeker/upload-profile-image
// @desc    Upload profile image
// @access  Private (Jobseeker)
router.post('/upload-profile-image', (req, res) => {
  uploadProfileImage(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an image file'
        });
      }

      // Store a web-accessible path
      const profileImage = `/uploads/profile/${req.file.filename}`;

      const profile = await JobSeeker.findOneAndUpdate(
        { userId: req.user._id },
        { profileImage },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        profileImage: profile.profileImage
      });
    } catch (error) {
      console.error('Profile image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });
});

// @route   PUT /api/jobseeker/preferences
// @desc    Update matching + email preferences
// @access  Private (Jobseeker)
router.put('/preferences', [
  body('emailJobsConsent').optional().isBoolean(),
  body('emailJobsMinScore').optional().isInt({ min: 0, max: 100 }),
  body('emailJobsMaxResults').optional().isInt({ min: 1, max: 50 }),
  body('preferredWorkMode').optional().isIn(['any', 'remote', 'hybrid', 'onsite']),
  body('yearsExperience').optional().isInt({ min: 0, max: 60 }),
  body('matchWeights').optional().isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const profile = await JobSeeker.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const allowed = ['emailJobsConsent', 'emailJobsMinScore', 'emailJobsMaxResults', 'preferredWorkMode', 'yearsExperience', 'matchWeights'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) profile[k] = req.body[k];
    }

    profile.updatedAt = new Date();
    await profile.save();

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/jobseeker/send-matched-jobs
// @desc    Send matched jobs via email (manual button)
// @access  Private (Jobseeker)
router.post('/send-matched-jobs', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.emailVerified) {
      return res.status(400).json({ success: false, code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first.' });
    }
    if (!user.profileCompleted || !user.privacyAcceptedAt) {
      return res.status(400).json({ success: false, code: 'ONBOARDING_INCOMPLETE', message: 'Please submit your profile and accept the privacy policy first.' });
    }

    const profile = await JobSeeker.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (!profile.emailJobsConsent) {
      return res.status(400).json({ success: false, code: 'EMAIL_JOBS_OPTIN_REQUIRED', message: 'Please enable “Send matched jobs to my email” in your profile first.' });
    }

    // Ensure required fields are saved (so resend only happens after save)
    const missing = [];
    if (!profile.age || profile.age < 18) missing.push('age');
    if (!profile.country) missing.push('country');
    if (!profile.city) missing.push('city');
    if (!profile.desiredJobTitle) missing.push('desiredJobTitle');
    if (!profile.cvPath) missing.push('cv');
    if (missing.length) {
      return res.status(400).json({ success: false, code: 'PROFILE_INCOMPLETE', missing, message: 'Please complete your profile and upload your CV first.' });
    }

    const fp = buildProfileFingerprint(user, profile);
    if (profile.lastMatchedJobsEmailFingerprint && profile.lastMatchedJobsEmailFingerprint === fp) {
      return res.json({
        success: true,
        code: 'NO_CHANGES',
        message: 'No changes since last email. Update your profile and save, then try again.'
      });
    }

    const maxResults = Math.min(Math.max(Number(profile.emailJobsMaxResults || 10), 1), 50);
    const minScore = Math.min(Math.max(Number(profile.emailJobsMinScore || 60), 0), 100);

    const jobs = await AggregatedJob.find({ isActive: true, isExpired: false })
      .sort({ postedDate: -1 })
      .limit(250)
      .select('jobTitle companyName location workType experienceLevel requiredSkills slug');

    const scored = jobs.map((j) => {
      const match = calculateWeightedMatchScore(profile, {
        jobTitle: j.jobTitle,
        requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : [],
        location: { country: j.location?.country || '', city: j.location?.city || '' },
        workType: j.workType,
        experienceLevel: j.experienceLevel
      });
      return {
        jobTitle: j.jobTitle,
        companyName: j.companyName,
        matchScore: match.score,
        location: `${j.location?.city || ''}, ${j.location?.country || ''}`.replace(/^,\s*/, '').trim(),
        slug: j.slug
      };
    });

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const matches = scored
      .filter((m) => m.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults)
      .map((m) => ({
        ...m,
        url: `${clientUrl}/jobs/${m.slug}`
      }));

    try {
      await sendMatchedJobsEmail(user.email, user.fullName, matches);
      profile.lastMatchedJobsEmailFingerprint = fp;
      profile.lastMatchedJobsEmailAt = new Date();
      await profile.save();
    } catch (e) {
      console.error('sendMatchedJobsEmail failed:', e.message);
      return res.status(500).json({ success: false, message: 'Failed to send matched jobs email' });
    }

    res.json({
      success: true,
      message: `Sent ${matches.length} matched job(s) to your email.`
    });
  } catch (error) {
    console.error('Send matched jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/jobseeker/submit
// @desc    Finalize onboarding: accept privacy + ensure CV/info uploaded, then unlock jobs
// @access  Private (Jobseeker)
router.post('/submit', [
  body('privacyAccepted').custom(v => v === true).withMessage('Privacy policy acceptance required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const profile = await JobSeeker.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Basic required fields
    const missing = [];
    if (!profile.age || profile.age < 18) missing.push('age');
    if (!profile.country) missing.push('country');
    if (!profile.city) missing.push('city');
    if (!profile.desiredJobTitle) missing.push('desiredJobTitle');
    if (!profile.cvPath) missing.push('cv');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'PROFILE_INCOMPLETE',
        missing,
        message: 'Please complete your profile and upload your CV before continuing.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.privacyAcceptedAt = new Date();
    user.profileCompleted = true;
    await user.save();

    // ✅ Profile confirmation email (anti-repeat):
    // Send only if the user actually changed & saved their profile data.
    const fp = buildProfileFingerprint(user, profile);
    if (!profile.lastProfileSavedEmailFingerprint || profile.lastProfileSavedEmailFingerprint !== fp) {
      try {
        await sendProfileSavedEmail(user.email, user.fullName);
        profile.lastProfileSavedEmailFingerprint = fp;
        profile.lastProfileSavedEmailAt = new Date();
        await profile.save();
      } catch (e) {
        console.error('sendProfileSavedEmail failed:', e.message);
      }
    }

    res.json({
      success: true,
      message: 'Profile submitted successfully. Please verify your email to unlock job browsing.',
      user: {
        id: user._id,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        privacyAcceptedAt: user.privacyAcceptedAt
      }
    });
  } catch (error) {
    console.error('Submit profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;