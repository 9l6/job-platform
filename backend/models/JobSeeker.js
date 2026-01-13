// backend/models/JobSeeker.js
const mongoose = require('mongoose');

const jobSeekerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18'],
    max: [100, 'Age must be less than 100']
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  desiredJobTitle: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  workType: [{
    type: String,
    enum: ['full-time', 'part-time', 'half-day', 'quarter-day', 'freelance', 'remote']
  }],
  experienceLevel: {
    type: String,
    enum: ['no-experience', 'junior', 'mid-level', 'senior'],
    default: 'no-experience'
  },
  cvPath: {
    type: String
  },
  // Extracted plain text from CV (for matching)
  cvText: {
    type: String
  },
  cvParsedAt: {
    type: Date
  },
  cvTextHash: {
    type: String
  },
  profileImage: {
    type: String
  },
  dailyApplications: {
    type: Number,
    default: 0
  },
  lastApplicationDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // ✅ Email + matching preferences (jobseeker-controlled)
  emailJobsConsent: {
    type: Boolean,
    default: false
  },
  emailJobsMinScore: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  emailJobsMaxResults: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  preferredWorkMode: {
    type: String,
    enum: ['any', 'remote', 'hybrid', 'onsite'],
    default: 'any'
  },
  yearsExperience: {
    type: Number,
    min: 0,
    max: 60
  },
  matchWeights: {
    title: { type: Number, default: 40, min: 0, max: 100 },
    skills: { type: Number, default: 30, min: 0, max: 100 },
    city: { type: Number, default: 15, min: 0, max: 100 },
    country: { type: Number, default: 5, min: 0, max: 100 },
    workMode: { type: Number, default: 5, min: 0, max: 100 },
    experience: { type: Number, default: 5, min: 0, max: 100 }
  },

  // ✅ Email anti-repeat: only allow sending when profile data changed & saved
  lastProfileSavedEmailFingerprint: { type: String },
  lastProfileSavedEmailAt: { type: Date },
  lastMatchedJobsEmailFingerprint: { type: String },
  lastMatchedJobsEmailAt: { type: Date }
});

// Update the updatedAt field before saving
jobSeekerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('JobSeeker', jobSeekerSchema);