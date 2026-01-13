// backend/scrapers/tanqeebHeadless.js
// Tanqeeb.com (Saudi) headless scraper using Playwright.
// Important: Tanqeeb listing URLs frequently change; current stable pattern is:
//   https://saudi.tanqeeb.com/s/jobs/<keyword>
// We extract only real job detail links (*/jobs-in-saudi/*/*.html) and then
// scrape details from each job page.

const { chromium } = require('playwright');

function cleanText(s) {
  return (s || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function normalizeLocation(fullLocation) {
  const t = cleanText(fullLocation);
  // Tanqeeb often has "City, Country" or "City - Country" or just "Saudi Arabia"
  const parts = t
    .replace(/\s*-\s*/g, ',')
    .split(',')
    .map((x) => cleanText(x))
    .filter(Boolean);
  const country = parts.length ? parts[parts.length - 1] : 'Saudi Arabia';
  const city = parts.length >= 2 ? parts[0] : 'Not Specified';
  return { city, country, fullLocation: t || 'Saudi Arabia' };
}

function normalizeWorkType(text) {
  const t = cleanText(text).toLowerCase();
  if (!t) return 'not-specified';
  if (t.includes('remote') || t.includes('عن بعد')) return 'remote';
  if (t.includes('hybrid') || t.includes('هجين')) return 'hybrid';
  if (t.includes('on-site') || t.includes('onsite') || t.includes('حضوري')) return 'onsite';
  return 'not-specified';
}

function safeSlug(input) {
  return cleanText(input)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

class TanqeebHeadlessScraper {
  constructor(options = {}) {
    this.baseUrl = 'https://saudi.tanqeeb.com';
    this.maxJobsPerKeyword = options.maxJobsPerKeyword ?? 25;
    this.timeoutMs = options.timeoutMs ?? 45000;
    this.headless = options.headless ?? true;
  }

  buildSearchUrl(keyword) {
    // Example patterns Tanqeeb uses:
    //   /s/jobs/python-developer-jobs
    // We generate a best-effort slug and append -jobs.
    const slug = String(keyword || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06ff-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const safe = slug || 'jobs';
    return `${this.baseUrl}/s/jobs/${encodeURIComponent(safe)}-jobs`;
  }

  isValidJobUrl(href) {
    if (!href) return false;
    // must be a job detail page and end with .html
    return /\/jobs-in-saudi\//i.test(href) && /\.html(\?.*)?$/i.test(href) && !/\/jobs\/(add|create)/i.test(href);
  }

  async scrapeListing(page, keyword) {
    const url = this.buildSearchUrl(keyword);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs });

    // Extract candidate links and keep only job detail pages
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')).filter(Boolean));
    const abs = links
      .map((href) => {
        try {
          return new URL(href, 'https://saudi.tanqeeb.com').toString();
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const jobLinks = uniq(abs).filter((u) => /\/jobs-in-saudi\//i.test(u) && /\.html/i.test(u));
    return jobLinks.slice(0, this.maxJobsPerKeyword);
  }

  async scrapeJobDetails(page, jobUrl) {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs });
    await page.waitForTimeout(200);

    // Title: h1 is reliable
    const jobTitle = cleanText(await page.textContent('h1').catch(() => '')) || 'Untitled Job';

    // Tanqeeb uses a details header area. We'll pull the nearest text blocks.
    const headerText = cleanText(
      await page
        .locator('body')
        .evaluate((el) => {
          // take first ~1500 chars from the top area for parsing
          const txt = (el.innerText || '').split('\n').slice(0, 80).join(' \n ');
          return txt;
        })
        .catch(() => '')
    );

    // Company: look for labeled section or a link near title
    const companyName =
      cleanText(await page.locator('a[href*="/company/"]').first().textContent().catch(() => '')) ||
      cleanText(await page.locator('a[href*="/companies/"]').first().textContent().catch(() => '')) ||
      (headerText.match(/Company\s*:\s*(.+)/i)?.[1] ? cleanText(headerText.match(/Company\s*:\s*(.+)/i)[1]) : '') ||
      'Company Not Specified';

    // Location & salary: try to parse from header text
    const salaryText = headerText.match(/Salary\s*:?\s*(.+)/i)?.[1] || '';
    const locationText = headerText.match(/Location\s*:?\s*(.+)/i)?.[1] || '';

    // Fallback: scan for common patterns in the page
    const salary = cleanText(salaryText) || (headerText.match(/\b(SAR|ريال)\b[^\n]{0,60}/i)?.[0] ? cleanText(headerText.match(/\b(SAR|ريال)\b[^\n]{0,60}/i)[0]) : undefined);
    const location = normalizeLocation(locationText || headerText.match(/Saudi\s*Arabia[^\n]*/i)?.[0] || 'Saudi Arabia');

    // Work type: infer from keywords present
    const workType = normalizeWorkType(headerText);

    // Description sections: pull the main content container
    // Tanqeeb often has headings like "Job Description" and lists.
    const mainText = cleanText(
      await page
        .locator('main, #main, .main, .container')
        .first()
        .evaluate((el) => (el.innerText ? el.innerText : ''))
        .catch(() => '')
    );

    // Extract sections heuristically
    const extractSection = (label) => {
      const re = new RegExp(`(?:^|\\n)\\s*${label}\\s*(?:\\n|:)+([\\s\\S]*?)(?=\\n\\s*[A-Z][^\\n]{2,40}\\s*(?:\\n|:)+|$)`, 'i');
      const m = mainText.match(re);
      return m ? cleanText(m[1]) : '';
    };

    const description = extractSection('Job Description') || extractSection('الوصف الوظيفي') || undefined;
    const requirementsBlock = extractSection('Requirements') || extractSection('المتطلبات');

    // Convert requirements block to bullets
    const requirements = requirementsBlock
      ? uniq(
          requirementsBlock
            .split(/\n|•|\u2022|\-/)
            .map((x) => cleanText(x))
            .filter((x) => x && x.length > 2)
        )
      : [];

    // skills: look for "Skills" section, or parse hashtags/keywords
    const skillsBlock = extractSection('Skills') || extractSection('المهارات') || '';
    const requiredSkills = skillsBlock
      ? uniq(skillsBlock.split(/\n|,|•|\u2022/).map((x) => cleanText(x)).filter((x) => x && x.length > 1))
      : [];

    // Apply URL (sometimes it is external). Keep it but the frontend can hide external button.
    const applyHref =
      (await page.locator('a:has-text("Apply")').first().getAttribute('href').catch(() => null)) ||
      (await page.locator('a:has-text("قدم")').first().getAttribute('href').catch(() => null));
    const applicationUrl = applyHref ? new URL(applyHref, this.baseUrl).toString() : jobUrl;

    // Posted date: hard to parse reliably; keep scrape timestamp + optional text.
    const postedDate = new Date();

    return {
      jobTitle,
      companyName,
      location,
      description: description || 'View full details on Tanqeeb',
      requirements,
      responsibilities: [],
      qualifications: [],
      benefits: [],
      requiredSkills,
      salary,
      applicationUrl,
      source: { name: 'Tanqeeb', url: this.baseUrl },
      postedDate,
      workType,
      contractType: 'not-specified',
      slug: `${safeSlug(jobTitle)}-${safeSlug(companyName)}-${jobUrl.split('/').pop().replace(/\.html.*/i, '')}`.replace(/-+/g, '-'),
      rawData: { jobUrl, locationText: location.fullLocation, salaryText: salary }
    };
  }

  async scrape(keyword) {
    const browser = await chromium.launch({ headless: this.headless });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      locale: 'en-US'
    });
    const page = await context.newPage();

    try {
      const jobLinks = await this.scrapeListing(page, keyword);
      const jobs = [];
      for (const link of jobLinks) {
        try {
          // Filter very aggressively to prevent "Sign In" / "Add job" pages
          if (!this.isValidJobUrl(link)) continue;
          const job = await this.scrapeJobDetails(page, link);
          // guard against garbage titles
          if (!job.jobTitle || job.jobTitle.length < 3) continue;
          const badTitle = /^(sign\s*in|log\s*in|register|وظائف في السعودية)$/i;
          if (badTitle.test(job.jobTitle)) continue;
          jobs.push(job);
        } catch (e) {
          // skip broken job
        }
      }
      return jobs;
    } finally {
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }
}

module.exports = TanqeebHeadlessScraper;
