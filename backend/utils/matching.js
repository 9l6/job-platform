// backend/utils/matching.js

// Calculate matching score between job seeker and job
exports.calculateMatchScore = (jobSeeker, job) => {
  let totalScore = 0;
  const matchingReasons = [];
  const matchedSkills = [];

  // 1. Job Title Match (40%)
  const jobTitleScore = calculateJobTitleMatch(
    jobSeeker.desiredJobTitle || '',
    job.jobTitle
  );
  totalScore += jobTitleScore * 0.4;
  
  if (jobTitleScore > 0.5) {
    matchingReasons.push(`✓ Job title matches your desired position (${Math.round(jobTitleScore * 40)}% match)`);
  }

  // 2. Work Type Match (25%)
  const workTypeScore = calculateWorkTypeMatch(
    jobSeeker.workType || [],
    job.workType || []
  );
  totalScore += workTypeScore * 0.25;
  
  if (workTypeScore > 0) {
    const matchedTypes = (jobSeeker.workType || []).filter(type => 
      (job.workType || []).includes(type)
    );
    matchingReasons.push(`✓ Work type preference matches: ${matchedTypes.join(', ')}`);
  }

  // 3. Location Match (20%)
  const locationScore = calculateLocationMatch(
    jobSeeker.country || '',
    jobSeeker.city || '',
    job.location.country,
    job.location.city
  );
  totalScore += locationScore * 0.2;
  
  if (locationScore === 1) {
    matchingReasons.push(`✓ Perfect location match: ${job.location.city}, ${job.location.country}`);
  } else if (locationScore > 0) {
    matchingReasons.push(`✓ Country matches: ${job.location.country}`);
  }

  // 4. Experience Level Match (15%)
  const experienceScore = calculateExperienceMatch(
    jobSeeker.experienceLevel || 'no-experience',
    job.experienceLevel
  );
  totalScore += experienceScore * 0.15;
  
  if (experienceScore === 1) {
    matchingReasons.push(`✓ Experience level matches: ${formatExperienceLevel(job.experienceLevel)}`);
  } else if (experienceScore > 0) {
    matchingReasons.push(`○ Experience level is close to requirement`);
  }

  // Skills matching (bonus information, not scored)
  if (jobSeeker.skills && jobSeeker.skills.length > 0 && 
      job.requiredSkills && job.requiredSkills.length > 0) {
    const skills = jobSeeker.skills.map(s => s.toLowerCase());
    const required = job.requiredSkills.map(s => s.toLowerCase());
    
    matchedSkills.push(...jobSeeker.skills.filter(skill => 
      required.includes(skill.toLowerCase())
    ));
  }

  return {
    score: Math.round(totalScore * 100),
    matchingReasons,
    matchedSkills
  };
};

// ✅ Weighted matching score (user-controlled weights)
// jobSeeker: JobSeeker document
// job: normalized object with fields: jobTitle, requiredSkills, location{country,city}, workType, experienceLevel
exports.calculateWeightedMatchScore = (jobSeeker, job) => {
  const w = (jobSeeker && jobSeeker.matchWeights) || {};
  const weights = {
    title: Number(w.title ?? 40),
    skills: Number(w.skills ?? 30),
    city: Number(w.city ?? 15),
    country: Number(w.country ?? 5),
    workMode: Number(w.workMode ?? 5),
    experience: Number(w.experience ?? 5)
  };

  const sum = Object.values(weights).reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const n = Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Math.max(0, v) / sum]));

  const titleScore = calculateJobTitleMatch(jobSeeker.desiredJobTitle || '', job.jobTitle || '');
  const skillsScore = calculateSkillsMatch(jobSeeker.skills || [], job.requiredSkills || [], jobSeeker.cvText || '');
  const cityScore = calculateCityMatch(jobSeeker.city || '', job.location?.city || '');
  const countryScore = calculateCountryMatch(jobSeeker.country || '', job.location?.country || '');
  const workModeScore = calculateWorkModeMatch(jobSeeker.preferredWorkMode || 'any', job.workType || 'onsite');
  const experienceScore = calculateAggExperienceMatch(jobSeeker.experienceLevel || 'no-experience', job.experienceLevel || 'entry');

  const total =
    titleScore * n.title +
    skillsScore * n.skills +
    cityScore * n.city +
    countryScore * n.country +
    workModeScore * n.workMode +
    experienceScore * n.experience;

  const matchedSkills = getMatchedSkills(jobSeeker.skills || [], job.requiredSkills || [], jobSeeker.cvText || '');

  return {
    score: Math.round(total * 100),
    titleScore,
    skillsScore,
    cityScore,
    countryScore,
    workModeScore,
    experienceScore,
    matchedSkills
  };
};

// Helper: Calculate job title similarity
function calculateJobTitleMatch(desiredTitle, jobTitle) {
  if (!desiredTitle || !jobTitle) return 0;
  
  const desired = desiredTitle.toLowerCase().trim();
  const actual = jobTitle.toLowerCase().trim();
  
  // Exact match
  if (desired === actual) return 1;
  
  // Contains match
  if (actual.includes(desired) || desired.includes(actual)) return 0.8;
  
  // Word overlap
  const desiredWords = desired.split(/\s+/);
  const actualWords = actual.split(/\s+/);
  const commonWords = desiredWords.filter(word => 
    actualWords.includes(word) && word.length > 2
  );
  
  if (commonWords.length > 0) {
    return commonWords.length / Math.max(desiredWords.length, actualWords.length);
  }
  
  return 0;
}

// Helper: Calculate work type match
function calculateWorkTypeMatch(seekerTypes, jobTypes) {
  if (!seekerTypes || seekerTypes.length === 0) return 0;
  if (!jobTypes || jobTypes.length === 0) return 0;
  
  const matches = seekerTypes.filter(type => jobTypes.includes(type));
  return matches.length > 0 ? 1 : 0;
}

function calculateSkillsMatch(seekerSkills, requiredSkills, cvText = '') {
  const seeker = (Array.isArray(seekerSkills) ? seekerSkills : []).map(s => String(s).toLowerCase());
  const required = (Array.isArray(requiredSkills) ? requiredSkills : []).map(s => String(s).toLowerCase());
  if (required.length === 0) return 0;

  // Combine: explicit profile skills + skills inferred from CV text
  const text = String(cvText || '').toLowerCase();
  const hasInCv = (skill) => {
    if (!text) return false;
    // word-boundary-ish match (handles C++, C#, .NET by loose boundaries)
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return re.test(text);
  };

  const found = new Set();
  for (const r of required) {
    if (seeker.includes(r) || hasInCv(r)) {
      found.add(r);
    }
  }

  // Score: fraction of required skills satisfied
  return found.size / Math.max(1, required.length);
}

function getMatchedSkills(seekerSkills, requiredSkills, cvText = '') {
  const seeker = (Array.isArray(seekerSkills) ? seekerSkills : []);
  const requiredLower = new Set((Array.isArray(requiredSkills) ? requiredSkills : []).map(s => String(s).toLowerCase()));
  const text = String(cvText || '').toLowerCase();
  const matched = new Set();

  // from profile skills
  for (const s of seeker) {
    if (requiredLower.has(String(s).toLowerCase())) matched.add(String(s));
  }
  // from cv text
  for (const r of requiredLower) {
    const escaped = r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (re.test(text)) matched.add(r);
  }
  return Array.from(matched);
}

function calculateCityMatch(seekerCity, jobCity) {
  if (!seekerCity || !jobCity) return 0;
  return seekerCity.toLowerCase().trim() === jobCity.toLowerCase().trim() ? 1 : 0;
}

function calculateCountryMatch(seekerCountry, jobCountry) {
  if (!seekerCountry || !jobCountry) return 0;
  return seekerCountry.toLowerCase().trim() === jobCountry.toLowerCase().trim() ? 1 : 0;
}

function calculateWorkModeMatch(preferred, jobWorkType) {
  const pref = String(preferred || 'any').toLowerCase();
  const wt = String(jobWorkType || 'onsite').toLowerCase();
  if (pref === 'any') return 1;
  if (pref === wt) return 1;
  // soft match for hybrid
  if (pref === 'remote' && wt === 'hybrid') return 0.7;
  if (pref === 'onsite' && wt === 'hybrid') return 0.7;
  if (pref === 'hybrid' && (wt === 'remote' || wt === 'onsite')) return 0.3;
  return 0;
}

function calculateAggExperienceMatch(seekerLevel, jobLevel) {
  const seekerMap = { 'no-experience': 0, 'junior': 1, 'mid-level': 2, 'senior': 3 };
  const jobMap = { 'entry': 0, 'junior': 1, 'mid-level': 2, 'senior': 3, 'executive': 4 };
  const s = seekerMap[seekerLevel] ?? 0;
  const j = jobMap[jobLevel] ?? 0;
  if (s === j) return 1;
  if (s > j) return 0.8;
  if (j - s === 1) return 0.6;
  return 0.3;
}

// Helper: Calculate location match
function calculateLocationMatch(seekerCountry, seekerCity, jobCountry, jobCity) {
  if (!seekerCountry || !jobCountry) return 0;
  
  const countryMatch = seekerCountry.toLowerCase().trim() === jobCountry.toLowerCase().trim();
  const cityMatch = seekerCity && jobCity && 
                    seekerCity.toLowerCase().trim() === jobCity.toLowerCase().trim();
  
  if (countryMatch && cityMatch) return 1;
  if (countryMatch) return 0.5;
  return 0;
}

// Helper: Calculate experience match
function calculateExperienceMatch(seekerLevel, jobLevel) {
  const levels = {
    'no-experience': 0,
    'junior': 1,
    'mid-level': 2,
    'senior': 3
  };
  
  const seekerValue = levels[seekerLevel] || 0;
  const jobValue = levels[jobLevel] || 0;
  
  // Exact match
  if (seekerValue === jobValue) return 1;
  
  // Overqualified (seeker has more experience)
  if (seekerValue > jobValue) return 0.8;
  
  // Underqualified by one level
  if (jobValue - seekerValue === 1) return 0.6;
  
  // Underqualified by more
  return 0.3;
}

// Helper: Format experience level for display
function formatExperienceLevel(level) {
  const formats = {
    'no-experience': 'No Experience',
    'junior': 'Junior',
    'mid-level': 'Mid-Level',
    'senior': 'Senior'
  };
  return formats[level] || level;
}