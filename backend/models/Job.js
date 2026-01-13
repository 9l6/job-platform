// backend/models/Job.js
// Company-created jobs (structured sections for clean storage + easy UI)

const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema(
  {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'SAR' },
    period: { type: String, enum: ['monthly', 'yearly', 'hourly'], default: 'monthly' },
    negotiable: { type: Boolean, default: false }
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    // Basics
    companyName: { type: String, required: [true, 'Company name is required'], trim: true },
    jobTitle: { type: String, required: [true, 'Job title is required'], trim: true },

    // Contract / work mode
    contractType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'temporary', 'contract'],
      default: 'full-time'
    },
    workMode: { type: String, enum: ['onsite', 'hybrid', 'remote'], default: 'onsite' },

    // Backwards compatible field used by older UI (multi-select)
    workType: [
      {
        type: String,
        enum: ['full-time', 'part-time', 'half-day', 'quarter-day', 'freelance', 'remote']
      }
    ],

    workingHours: { type: String, trim: true },

    location: {
      country: { type: String, required: [true, 'Country is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      address: { type: String, trim: true }
    },

    experienceLevel: {
      type: String,
      enum: ['no-experience', 'junior', 'mid-level', 'senior'],
      required: [true, 'Experience level is required']
    },
    experienceYearsMin: { type: Number, min: 0 },
    experienceYearsMax: { type: Number, min: 0 },

    // Structured sections
    description: { type: String, required: [true, 'Job description is required'], trim: true },
    responsibilities: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    preferred: [{ type: String, trim: true }],
    benefits: [{ type: String, trim: true }],

    // Skills (tags)
    requiredSkills: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true, lowercase: true }],

    // Compensation
    salary: { type: SalarySchema, default: {} },

    // Application
    hrEmail: {
      type: String,
      required: [true, 'HR email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },

    // Ownership
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Publishing
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
    publishedAt: { type: Date },

    // SEO / internal navigation
    slug: { type: String, unique: true, sparse: true, index: true }
  },
  { timestamps: true }
);

// Indexes for search
jobSchema.index({ jobTitle: 'text', companyName: 'text', description: 'text' });
jobSchema.index({ 'location.country': 1, 'location.city': 1 });

module.exports = mongoose.model('Job', jobSchema);
