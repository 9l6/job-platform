// backend/routes/job.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const JobSeeker = require('../models/JobSeeker');
const { protect, authorize } = require('../middleware/auth');
const { calculateMatchScore } = require('../utils/matching');

// Simple slugify utility (no extra deps)
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function makeUniqueSlug(base) {
  const baseSlug = slugify(base);
  if (!baseSlug) return undefined;
  let slug = baseSlug;
  let i = 2;
  while (await Job.exists({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all jobs with search and filter (with matching for jobseekers)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      workType, 
      country, 
      city, 
      experienceLevel,
      sortBy = 'match' 
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    if (workType) {
      query.workType = { $in: workType.split(',') };
    }

    if (country) {
      query['location.country'] = { $regex: country, $options: 'i' };
    }

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    // Default: only published jobs for public listing
    if (!req.headers.authorization) {
      query.status = 'published';
    }

    let jobs = await Job.find(query).sort({ createdAt: -1 });

    // If user is logged in as jobseeker, calculate match scores
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id);

        if (user && user.role === 'jobseeker') {
          const jobSeeker = await JobSeeker.findOne({ userId: user._id });
          
          if (jobSeeker) {
            // Calculate match score for each job
            jobs = jobs.map(job => {
              const jobObj = job.toObject();
              const matchData = calculateMatchScore(jobSeeker, jobObj);
              return {
                ...jobObj,
                matchScore: matchData.score,
                matchingReasons: matchData.matchingReasons,
                matchedSkills: matchData.matchedSkills
              };
            });

            // Sort by match score if requested
            if (sortBy === 'match') {
              jobs.sort((a, b) => b.matchScore - a.matchScore);
            }
          }
        }
      } catch (err) {
        // Token invalid or user not found, continue without matching
        console.log('Match calculation skipped:', err.message);
      }
    }

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/jobs/mine
// @desc    Get jobs created by current employer
// @access  Private (Employer/Admin)
router.get('/mine', protect, authorize('admin', 'employer'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/jobs/slug/:slug
// @desc    Get a published company job by slug (public)
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const job = await Job.findOne({ slug, status: 'published' });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    return res.json({ success: true, job });
  } catch (error) {
    console.error('Get job by slug error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Protected routes for admin
router.use(protect);
router.use(authorize('admin', 'employer'));

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Admin)
router.post('/', [
  body('companyName').trim().notEmpty(),
  body('jobTitle').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('workType').optional().isArray(),
  body('contractType').optional().isIn(['full-time', 'part-time', 'internship', 'temporary', 'contract']),
  body('workMode').optional().isIn(['onsite', 'hybrid', 'remote']),
  body('workingHours').optional().trim(),
  body('location.country').trim().notEmpty(),
  body('location.city').trim().notEmpty(),
  body('experienceLevel').isIn(['no-experience', 'junior', 'mid-level', 'senior']),
  body('requiredSkills').optional().isArray(),
  body('skills').optional().isArray(),
  body('responsibilities').optional().isArray(),
  body('requirements').optional().isArray(),
  body('preferred').optional().isArray(),
  body('benefits').optional().isArray(),
  body('salary').optional().isObject(),
  body('hrEmail').optional().isEmail(),
  body('status').optional().isIn(['draft', 'published', 'closed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Normalize skills: keep requiredSkills + also fill skills tags
    const requiredSkills = Array.isArray(req.body.requiredSkills) ? req.body.requiredSkills : [];
    const skills = Array.isArray(req.body.skills) ? req.body.skills : requiredSkills;

    const status = req.body.status || 'draft';
    const slug = await makeUniqueSlug(`${req.body.companyName}-${req.body.jobTitle}`);

    const jobData = {
      ...req.body,
      requiredSkills,
      skills,
      createdBy: req.user._id,
      hrEmail: req.body.hrEmail || req.user.email,
      slug,
      status,
      publishedAt: status === 'published' ? new Date() : undefined
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const existing = await Job.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (req.user.role === 'employer' && String(existing.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    const update = { ...req.body };
    if (Array.isArray(update.requiredSkills) && !Array.isArray(update.skills)) {
      update.skills = update.requiredSkills;
    }
    const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const existing = await Job.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (req.user.role === 'employer' && String(existing.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    await existing.deleteOne();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/jobs/:id/publish
// @desc    Publish a job
// @access  Private (Employer/Admin)
router.post('/:id/publish', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (req.user.role === 'employer' && String(job.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    job.status = 'published';
    job.publishedAt = new Date();
    if (!job.slug) job.slug = await makeUniqueSlug(`${job.companyName}-${job.jobTitle}`);
    await job.save();

    res.json({ success: true, job });
  } catch (error) {
    console.error('Publish job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/close
// @desc    Close a job
// @access  Private (Employer/Admin)
router.post('/:id/close', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (req.user.role === 'employer' && String(job.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    job.status = 'closed';
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;