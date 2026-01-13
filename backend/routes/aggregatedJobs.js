// backend/routes/aggregatedJobs.js
const express = require('express');
const AggregatedJob = require('../models/AggregatedJob');
const aggregationService = require('../services/aggregationService');
const { protect } = require('../middleware/auth');
const { requireJobseekerOnboarding } = require('../middleware/onboarding');

const router = express.Router();

// GET /api/aggregated-jobs
router.get('/', protect, requireJobseekerOnboarding, async (req, res) => {
  try {
    const {
      search,
      category,
      workType,
      contractType,
      country,
      city,
      source,
      page = 1,
      limit = 20,
      sortBy = 'postedDate',
      order = 'desc'
    } = req.query;

    const query = { isActive: true, isExpired: false };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (workType) query.workType = workType;
    if (contractType) query.contractType = contractType;
    if (country) query['location.country'] = { $regex: country, $options: 'i' };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (source) query['source.name'] = source;

    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const jobs = await AggregatedJob.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('-rawData');

    const total = await AggregatedJob.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Get aggregated jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// GET /api/aggregated-jobs/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await AggregatedJob.countDocuments({ isActive: true });

    const bySource = await AggregatedJob.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, stats: { total, bySource } });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// ✅ POST /api/aggregated-jobs/aggregate/run (Login required فقط)
router.post('/aggregate/run', protect, async (req, res) => {
  try {
    const results = await aggregationService.runNow();
    res.json({
      success: true,
      message: 'Aggregation finished',
      results
    });
  } catch (error) {
    console.error('Manual aggregation error:', error);
    res.status(500).json({ success: false, message: 'Aggregation failed', error: error.message });
  }
});

// GET /api/aggregated-jobs/aggregate/status
router.get('/aggregate/status', async (req, res) => {
  try {
    res.json({ success: true, status: aggregationService.getStatus() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

// GET /api/aggregated-jobs/:slug
// IMPORTANT: keep this route LAST so it doesn't swallow /aggregate/* routes.
router.get('/:slug', protect, requireJobseekerOnboarding, async (req, res) => {
  try {
    const job = await AggregatedJob.findOne({
      slug: req.params.slug,
      isActive: true
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.viewCount += 1;
    await job.save();

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
});

module.exports = router;
