// backend/services/contentCleaner.js
// Text cleanup helpers for scraping.

function normalizeWhitespace(text) {
  return (text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/gm, '')
    .trim();
}

const BOILERPLATE_LINE_PATTERNS = [
  /^use app$/i,
  /^use our mobile app/i,
  /^download (now|app)$/i,
  /^get the bayt app/i,
  /^home$/i,
  /^find jobs$/i,
  /^job search$/i,
  /^jobs by (location|companies)/i,
  /^executive jobs$/i,
  /^remote jobs$/i,
  /^salaries$/i,
  /^create your profile$/i,
  /^premium$/i,
  /^resources$/i,
  /^for employers$/i,
  /^log in$/i,
  /^register$/i,
  /^arabic/i,
  /^all locations$/i,
  /\b(sign in|log in|register)\b/i,
];

const BOILERPLATE_FRAGMENT_PATTERNS = [
  /get contacted by recruiters directly/i,
  /newest chat feature/i,
  /download now/i,
  /create a job alert/i,
  /manage your real time conversation/i,
  /\bprivacy\b/i,
];

function isLikelyBoilerplate(line) {
  const s = (line || '').trim();
  if (!s) return true;
  if (s.length <= 2) return true;
  return BOILERPLATE_LINE_PATTERNS.some((re) => re.test(s));
}

function cleanTextBlock(text) {
  const raw = normalizeWhitespace(text);
  if (!raw) return '';

  const lines = raw
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const cleaned = [];
  for (const line of lines) {
    if (isLikelyBoilerplate(line)) continue;
    if (BOILERPLATE_FRAGMENT_PATTERNS.some((re) => re.test(line))) continue;
    // Ignore giant country/city pickers (lots of commas or many short tokens)
    if (line.split(' ').length > 25 && /\b(saudi|bahrain|qatar|kuwait|egypt|oman|jordan|uae|morocco|lebanon|iraq)\b/i.test(line)) {
      continue;
    }
    cleaned.push(line);
  }

  // De-duplicate consecutive identical lines
  const deduped = cleaned.filter((l, idx) => idx === 0 || l !== cleaned[idx - 1]);
  return deduped.join('\n');
}

function looksLikeJunkJob(job) {
  const title = (job?.jobTitle || '').toLowerCase();
  const url = (job?.applicationUrl || '').toLowerCase();
  const desc = (job?.description || '').toLowerCase();

  const badTitle = [
    'sign in',
    'log in',
    'register',
    'jobs by companies',
    'jobs by location',
    'job search',
    'use app',
    'وظائف في السعودية',
    'steps for adding a new job',
  ].some((t) => title.includes(t));

  const badUrl = [
    '/jobs/add',
    '/jobs/create',
    '/users/login',
    '/register',
    '/login',
    'create_widget',
  ].some((p) => url.includes(p));

  // If description is basically a menu block
  const menuLike = desc.includes('home find jobs') || desc.includes('log in register') || desc.includes('for employers');

  return badTitle || badUrl || menuLike;
}

function pickBestCompanyName(candidates) {
  const list = (candidates || []).map((c) => normalizeWhitespace(c)).filter(Boolean);
  const filtered = list.filter((c) => !/\b(saudi arabia|riyadh|jeddah|dammam|\u00b7)\b/i.test(c));
  const best = (filtered[0] || list[0] || '').trim();
  if (!best) return 'Company Not Specified';
  if (best.length > 80) return best.slice(0, 80).trim();
  return best;
}

module.exports = {
  normalizeWhitespace,
  cleanTextBlock,
  looksLikeJunkJob,
  pickBestCompanyName,
  isLikelyBoilerplate,
};
