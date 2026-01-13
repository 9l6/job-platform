// backend/models/AggregatedJob.js
const mongoose = require('mongoose');

const aggregatedJobSchema = new mongoose.Schema({
  // Unique identifier to prevent duplicates
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Job Information
  jobTitle: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Location
  location: {
    country: {
      type: String,
      required: true,
      index: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    fullLocation: String // "Riyadh, Saudi Arabia"
  },
  
  // Work Details
  workType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite',
    index: true
  },
  contractType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship'],
    default: 'full-time',
    index: true
  },
  
  // Salary
  salary: {
    min: Number,
    max: Number,
    currency: String,
    period: String, // monthly, yearly
    displayText: String // "50,000 - 70,000 SAR/month"
  },
  
  // Job Details
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  qualifications: [String],
  benefits: [String],
  
  // Experience & Skills
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid-level', 'senior', 'executive'],
    index: true
  },
  requiredSkills: [String],
  
  // Source Information
  source: {
    name: {
      type: String,
      required: true,
      index: true
    },
    url: {
      type: String,
      required: true
    },
    logo: String
  },
  
  // Application
  applicationUrl: {
    type: String,
    required: true
  },
  applicationMethod: {
    type: String,
    enum: ['external', 'email', 'company_site'],
    default: 'external'
  },
  applicationEmail: String,
  
  // SEO & Display
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    index: true
  },
  
  // Dates
  postedDate: {
    type: Date,
    required: true,
    index: true
  },
  expiryDate: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isExpired: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Metadata
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  
  // Raw data for reference
  rawData: mongoose.Schema.Types.Mixed,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Text index for search
aggregatedJobSchema.index({ 
  jobTitle: 'text', 
  companyName: 'text', 
  description: 'text',
  'location.city': 'text',
  'location.country': 'text'
});

// Compound indexes for common queries
aggregatedJobSchema.index({ isActive: 1, postedDate: -1 });
aggregatedJobSchema.index({ 'location.country': 1, 'location.city': 1, isActive: 1 });
aggregatedJobSchema.index({ category: 1, isActive: 1 });

// Method to check if job is expired
aggregatedJobSchema.methods.checkExpiry = function() {
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.isExpired = true;
    this.isActive = false;
  }
  // Also check if posted more than 60 days ago
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  if (this.postedDate < sixtyDaysAgo) {
    this.isExpired = true;
    this.isActive = false;
  }
  return this.isExpired;
};

// Static method to generate unique ID
aggregatedJobSchema.statics.generateUniqueId = function(jobData) {
  const crypto = require('crypto');
  const str = `${jobData.jobTitle}-${jobData.companyName}-${jobData.location.city}`;
  return crypto.createHash('md5').update(str.toLowerCase()).digest('hex');
};

// Static method to generate slug
aggregatedJobSchema.statics.generateSlug = function(jobTitle, companyName, uniqueId) {
  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  
  return `${slugify(jobTitle)}-at-${slugify(companyName)}-${uniqueId.substring(0, 8)}`;
};

module.exports = mongoose.model('AggregatedJob', aggregatedJobSchema);