// backend/services/jobProcessor.js
const AggregatedJob = require('../models/AggregatedJob');

class JobProcessor {
  constructor() {
    this.categories = {
      'software': 'Technology & IT',
      'developer': 'Technology & IT',
      'engineer': 'Engineering',
      'manager': 'Management',
      'accountant': 'Finance',
      'sales': 'Sales & Marketing',
      'marketing': 'Sales & Marketing',
      'hr': 'Human Resources',
      'doctor': 'Healthcare',
      'nurse': 'Healthcare',
      'teacher': 'Education',
      'designer': 'Creative & Design'
    };
  }

  // Prevent "fake" jobs (login/app download/menus) from being saved
  isValidScrapedJob(rawJob) {
    const title = (rawJob?.jobTitle || '').toString().trim();
    const url = (rawJob?.applicationUrl || '').toString().trim();
    const desc = (rawJob?.description || '').toString();

    if (!title || title.length < 3) return false;
    if (!url || !/^https?:\/\//i.test(url)) return false;

    const badTitles = [
      'sign in',
      'log in',
      'register',
      'create job',
      'add job',
      'jobs by location',
      'jobs by companies',
      'job search',
      'find jobs',
      'use app',
      'use our mobile app'
    ];
    const t = title.toLowerCase();
    if (badTitles.some(b => t === b || t.startsWith(b))) return false;

    // Guard against pages that are clearly not job details
    const junkSignals = [
      /home\s+find\s+jobs/i,
      /premium\s+resources/i,
      /for\s+employers/i,
      /download\s+now/i,
      /create\s+your\s+profile/i
    ];
    if (junkSignals.some(r => r.test(desc))) return false;

    return true;
  }

  // Clean and normalize job data
  cleanJobData(rawJob) {
    return {
      jobTitle: this.normalizeTitle(rawJob.jobTitle),
      companyName: this.normalizeCompany(rawJob.companyName),
      location: this.normalizeLocation(rawJob.location),
      description: this.cleanDescription(rawJob.description),
      // Normalize workType to an array because schema expects [String]
      workType: Array.isArray(rawJob.workType)
        ? rawJob.workType
        : rawJob.workType
          ? [rawJob.workType]
          : ['onsite'],
      contractType: rawJob.contractType || 'full-time',
      salary: rawJob.salary,
      workingHours: rawJob.workingHours,
      experienceLevel: rawJob.experienceLevel,
      applicationUrl: rawJob.applicationUrl,
      source: rawJob.source,
      postedDate: rawJob.postedDate || new Date(),
      requirements: rawJob.requirements || [],
      responsibilities: rawJob.responsibilities || [],
      qualifications: rawJob.qualifications || [],
      benefits: rawJob.benefits || [],
      requiredSkills: rawJob.requiredSkills || []
    };
  }

  // Normalize job title
  normalizeTitle(title) {
    if (!title) return 'Untitled Position';
    
    // Remove excessive whitespace
    let normalized = title.replace(/\s+/g, ' ').trim();
    
    // Capitalize properly
    normalized = normalized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Common replacements
    const replacements = {
      'Sr.': 'Senior',
      'Jr.': 'Junior',
      'Mgr': 'Manager',
      'Dev': 'Developer',
      'Admin': 'Administrator'
    };
    
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalized = normalized.replace(regex, replacements[key]);
    });
    
    return normalized;
  }

  // Normalize company name
  normalizeCompany(company) {
    if (!company) return 'Company Name Not Available';
    
    let normalized = company.replace(/\s+/g, ' ').trim();
    
    // Remove common suffixes for comparison but keep for display
    const suffixes = ['LLC', 'Inc', 'Ltd', 'Co', 'Corp', 'Corporation'];
    
    return normalized;
  }

  // Normalize location
  normalizeLocation(location) {
    if (!location) {
      return {
        city: 'Not Specified',
        country: 'Saudi Arabia',
        fullLocation: 'Saudi Arabia'
      };
    }

    // If already an object
    if (typeof location === 'object' && location.city) {
      return {
        city: location.city.trim(),
        country: location.country?.trim() || 'Saudi Arabia',
        fullLocation: location.fullLocation || `${location.city}, ${location.country || 'Saudi Arabia'}`
      };
    }

    // If string, parse it
    if (typeof location === 'string') {
      const parts = location.split(',').map(p => p.trim());
      return {
        city: parts[0] || 'Not Specified',
        country: parts[parts.length - 1] || 'Saudi Arabia',
        fullLocation: location
      };
    }

    return {
      city: 'Not Specified',
      country: 'Saudi Arabia',
      fullLocation: 'Saudi Arabia'
    };
  }

  // Clean description
  cleanDescription(description) {
    if (!description) return 'No description available';
    
    // Remove HTML tags
    let cleaned = description.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length
    if (cleaned.length > 5000) {
      cleaned = cleaned.substring(0, 5000) + '...';
    }
    
    return cleaned;
  }

  // Detect category
  detectCategory(jobTitle, description) {
    const text = `${jobTitle} ${description}`.toLowerCase();
    
    for (const [keyword, category] of Object.entries(this.categories)) {
      if (text.includes(keyword)) {
        return category;
      }
    }
    
    return 'Other';
  }

  // Check if job is duplicate
  async isDuplicate(jobData) {
    const uniqueId = AggregatedJob.generateUniqueId(jobData);
    const existing = await AggregatedJob.findOne({ uniqueId });
    return !!existing;
  }

  // Process and save job
  async processJob(rawJob) {
    try {
      if (!this.isValidScrapedJob(rawJob)) {
        return { success: false, action: 'skipped', error: 'Invalid/junk job page' };
      }

      // Clean data
      const cleanedJob = this.cleanJobData(rawJob);
      
      // Generate unique ID
      const uniqueId = AggregatedJob.generateUniqueId(cleanedJob);
      
      // Check for duplicates
      const existing = await AggregatedJob.findOne({ uniqueId });
      if (existing) {
        // Update existing job
        existing.lastUpdated = new Date();
        existing.isActive = true;
        await existing.save();
        return { success: true, action: 'updated', job: existing };
      }
      
      // Generate slug
      const slug = AggregatedJob.generateSlug(
        cleanedJob.jobTitle,
        cleanedJob.companyName,
        uniqueId
      );
      
      // Detect category
      const category = this.detectCategory(cleanedJob.jobTitle, cleanedJob.description);
      
      // Create new job
      const newJob = await AggregatedJob.create({
        ...cleanedJob,
        uniqueId,
        slug,
        category,
        isActive: true,
        isExpired: false,
        rawData: rawJob
      });
      
      return { success: true, action: 'created', job: newJob };
    } catch (error) {
      console.error('Error processing job:', error);
      return { success: false, error: error.message };
    }
  }

  // Process multiple jobs
  async processJobs(rawJobs) {
    const results = {
      total: rawJobs.length,
      created: 0,
      updated: 0,
      failed: 0,
      duplicates: 0
    };

    for (const rawJob of rawJobs) {
      const result = await this.processJob(rawJob);
      
      if (result.success) {
        if (result.action === 'created') {
          results.created++;
        } else if (result.action === 'updated') {
          results.updated++;
        }
      } else {
        results.failed++;
      }
    }

    // Mark old jobs as inactive
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await AggregatedJob.updateMany(
      { lastUpdated: { $lt: thirtyDaysAgo }, isActive: true },
      { isActive: false, isExpired: true }
    );

    return results;
  }

  // Remove duplicates from array
  removeDuplicatesFromArray(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const title = (job.jobTitle || '').toLowerCase();
    const company = (job.companyName || '').toLowerCase();
    const city = (job.location?.city || job.location?.fullLocation || '').toLowerCase();
    const url = (job.applicationUrl || '').toLowerCase();
    const key = `${title}|${company}|${city}|${url}`.trim();

    if (!title || !company) return false; // تجاهل الوظائف الناقصة

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
}

module.exports = JobProcessor;