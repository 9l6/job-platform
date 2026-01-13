// backend/middleware/onboarding.js
// Gate access to job browsing until the jobseeker completes onboarding.
// Requirements:
// - accepted privacy policy (privacyAcceptedAt)
// - profileCompleted = true
// - emailVerified = true
// - CV uploaded (cvPath)

const JobSeeker = require('../models/JobSeeker');

exports.requireJobseekerOnboarding = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only jobseekers can access this resource'
      });
    }

    // Check DB profile for CV
    const profile = await JobSeeker.findOne({ userId: req.user._id }).select('cvPath');
    const hasCV = !!(profile && profile.cvPath);

    const missing = [];
    if (!req.user.privacyAcceptedAt) missing.push('privacy');
    if (!req.user.profileCompleted) missing.push('profile');
    if (!req.user.emailVerified) missing.push('email');
    if (!hasCV) missing.push('cv');

    if (missing.length > 0) {
      return res.status(403).json({
        success: false,
        code: 'ONBOARDING_INCOMPLETE',
        missing,
        message: 'Please complete your profile, accept privacy policy, upload CV, and verify your email first.'
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
