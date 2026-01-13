// backend/utils/profileFingerprint.js
const crypto = require('crypto');

// Stable sha256 fingerprint for "email-worthy" profile data.
// If the user changes anything important and saves, the fingerprint changes.
function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function normalizeArray(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((s) => String(s || '').trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

exports.buildProfileFingerprint = (user, jobSeeker) => {
  const payload = {
    // identity
    email: String(user?.email || '').toLowerCase(),
    // core profile
    fullName: String(jobSeeker?.fullName || '').trim(),
    age: jobSeeker?.age || null,
    country: String(jobSeeker?.country || '').trim().toLowerCase(),
    city: String(jobSeeker?.city || '').trim().toLowerCase(),
    desiredJobTitle: String(jobSeeker?.desiredJobTitle || '').trim().toLowerCase(),
    experienceLevel: String(jobSeeker?.experienceLevel || ''),
    workType: normalizeArray(jobSeeker?.workType),
    skills: normalizeArray(jobSeeker?.skills),
    cvPath: String(jobSeeker?.cvPath || ''),

    // matching/email prefs
    emailJobsConsent: !!jobSeeker?.emailJobsConsent,
    emailJobsMinScore: Number(jobSeeker?.emailJobsMinScore ?? 60),
    emailJobsMaxResults: Number(jobSeeker?.emailJobsMaxResults ?? 10),
    preferredWorkMode: String(jobSeeker?.preferredWorkMode || 'any'),
    yearsExperience: jobSeeker?.yearsExperience ?? null,
    matchWeights: {
      title: Number(jobSeeker?.matchWeights?.title ?? 40),
      skills: Number(jobSeeker?.matchWeights?.skills ?? 30),
      city: Number(jobSeeker?.matchWeights?.city ?? 15),
      country: Number(jobSeeker?.matchWeights?.country ?? 5),
      workMode: Number(jobSeeker?.matchWeights?.workMode ?? 5),
      experience: Number(jobSeeker?.matchWeights?.experience ?? 5)
    }
  };

  return sha256(JSON.stringify(payload));
};
