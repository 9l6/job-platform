// backend/scripts/insertOneJob.js
require('dotenv').config();
const mongoose = require('mongoose');
const AggregatedJob = require('../models/AggregatedJob');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const job = await AggregatedJob.create({
      uniqueId: 'test-1',
      jobTitle: 'Test Job',
      companyName: 'Test Company',
      location: { country: 'Saudi Arabia', city: 'Riyadh', fullLocation: 'Riyadh, Saudi Arabia' },
      description: 'Test description',
      source: { name: 'Test', url: 'https://example.com' },
      applicationUrl: 'https://example.com/apply',
      slug: 'test-job-at-test-company-test1',
      postedDate: new Date(),
      isActive: true,
      isExpired: false
    });

    console.log('Inserted:', job._id.toString());
  } catch (e) {
    console.error('Insert failed:', e.message);
  } finally {
    await mongoose.disconnect();
  }
})();
