// backend/scrapers/baytHeadless.js
// Bayt scraper (Playwright) that extracts *clean* job details.
// Key goals:
// - Avoid header/nav text leaking into Job description / requirements.
// - Extract structured sections (description, responsibilities, skills) from the job page.

const { chromium } = require('playwright');
const {
  cleanTextBlock,
  isLikelyBoilerplate,
  pickBestCompanyName,
  normalizeWhitespace
} = require('../services/contentCleaner');

class BaytHeadlessScraper {
  constructor() {
    this.baseUrl = 'https://www.bayt.com/en/saudi-arabia/jobs/?q=';
    this.maxJobs = parseInt(process.env.BAYT_MAX_JOBS || '30', 10);
    this.concurrency = parseInt(process.env.BAYT_CONCURRENCY || '2', 10);
  }

  async scrape(keyword) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-US'
    });

    try {
      const page = await context.newPage();
      const searchUrl = `${this.baseUrl}${encodeURIComponent(keyword)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Job links: Bayt job pages include /jobs/<slug>-<id>/
      await page.waitForTimeout(800);
      const jobLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
        const urls = anchors
          .map((a) => a.href)
          .filter((u) => /\/jobs\/.+\d+\/?$/.test(u));
        // Unique preserve order
        return [...new Set(urls)];
      });

      const uniqueLinks = jobLinks.slice(0, this.maxJobs);
      const results = [];

      // Small concurrency to keep Bayt stable
      for (let i = 0; i < uniqueLinks.length; i += this.concurrency) {
        const chunk = uniqueLinks.slice(i, i + this.concurrency);
        const chunkResults = await Promise.all(
          chunk.map(async (url) => {
            const p = await context.newPage();
            try {
              return await this.scrapeJobDetails(p, url);
            } catch (e) {
              return null;
            } finally {
              await p.close().catch(() => {});
            }
          })
        );

        for (const r of chunkResults) {
          if (r) results.push(r);
        }
      }

      console.log(`Scraped ${results.length} jobs from Bayt (details)`);
      return results;
    } finally {
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }

  async scrapeJobDetails(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(900);

    // Sometimes Bayt lazy-loads the main content.
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    const data = await page.evaluate(() => {
      const text = (el) => (el ? (el.innerText || '').trim() : '');
      const attr = (el, a) => (el ? el.getAttribute(a) : null);
      const first = (sel) => document.querySelector(sel);

      const titleEl = first('h1');
      const jobTitle = text(titleEl);

      // Company name is usually a link to /companies/
      const companyLink =
        document.querySelector('a[href*="/companies/"]') ||
        document.querySelector('a[href*="/company/"]');
      const companyName = text(companyLink);

      // Location: Bayt often shows "City · Country".
      const locationEl =
        document.querySelector('[data-testid="job-location"]') ||
        Array.from(document.querySelectorAll('span'))
          .find((s) => /\bSaudi Arabia\b/i.test(s.innerText) && s.innerText.includes('·'));
      const locationText = text(locationEl);

      // Posted time / easy apply / contract tags are usually small chips near title.
      const metaChips = Array.from(document.querySelectorAll('li, span, div'))
        .map((e) => (e.innerText || '').trim())
        .filter((t) => t && t.length <= 40);

      const hasEasyApply = metaChips.some((t) => /easy apply/i.test(t));
      const postedAgo = metaChips.find((t) => /\b(hour|hours|day|days|week|weeks|month|months)\b/i.test(t)) || null;
      const employmentType = metaChips.find((t) => /full\s*time|part\s*time|contract|internship|temporary/i.test(t)) || null;
      const workType = metaChips.find((t) => /remote|hybrid|on\s*site|onsite/i.test(t)) || null;

      const companySize = metaChips.find((t) => /employees/i.test(t)) || null;

      // Extract section text under headings within the *main content* area.
      // Bayt's DOM moves around a lot; the safest pattern is:
      // 1) pick a "root" container (main/role=main)
      // 2) find the heading inside that root
      // 3) collect paragraph/list text between this heading and the next heading
      function extractSection(headingText) {
        const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const target = normalize(headingText);

        const root =
          document.querySelector('main') ||
          document.querySelector('[role="main"]') ||
          document.querySelector('article') ||
          document.body;

        const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4'));
        const h = headings.find((x) => normalize(x.innerText) === target);
        if (!h) return '';

        // Narrow the scope to the closest logical section to avoid footer/navigation noise.
        const scope =
          h.closest('section') ||
          h.closest('article') ||
          h.closest('[data-testid]') ||
          h.parentElement ||
          root;

        // Collect text blocks between h and the next heading in DOM order *within the scope*.
        const all = Array.from(scope.querySelectorAll('*'));
        const hIdx = all.indexOf(h);
        if (hIdx === -1) return '';

        // Find the next heading after this one (any level).
        let nextH = null;
        for (let i = hIdx + 1; i < all.length; i++) {
          const el = all[i];
          const tag = (el.tagName || '').toLowerCase();
          if (/^h[1-6]$/.test(tag) && normalize(el.innerText)) {
            nextH = el;
            break;
          }
        }
        const nextIdx = nextH ? all.indexOf(nextH) : all.length;

        const out = [];
        const pushLine = (t) => {
          const v = (t || '').replace(/\s+/g, ' ').trim();
          if (!v) return;
          // Avoid obvious chrome/menu junk from sneaking in.
          if (/(^|\b)(home|find jobs|job search|create your profile|premium|resources|log in|register|for employers|use app|get the bayt app|download app)(\b|$)/i.test(v)) return;
          // Location-picker / country lists sometimes leak into scraped blocks.
          if (/^all locations\b/i.test(v)) return;
          if (/\b(algeria|bahrain|egypt|iraq|jordan|kuwait|lebanon|morocco|oman|pakistan|qatar|saudi arabia)\b/i.test(v) && v.split(' ').length > 12) return;
          if (v.length < 3) return;
          out.push(v);
        };

        // Prefer paragraphs and list items; they are the most stable across layouts.
        for (let i = hIdx + 1; i < nextIdx; i++) {
          const el = all[i];
          const tag = (el.tagName || '').toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'svg') continue;
          if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') continue;
          const role = (el.getAttribute && (el.getAttribute('role') || '').toLowerCase()) || '';
          if (role === 'navigation') continue;

          if (tag === 'p' || tag === 'li') {
            pushLine(el.innerText);
          }
        }

        // Fallback: if Bayt rendered plain text without <p>/<li>
        if (out.length === 0) {
          let n = h.nextElementSibling;
          while (n) {
            const tag = (n.tagName || '').toLowerCase();
            if (/^h[1-6]$/.test(tag) && normalize(n.innerText)) break;
            if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') {
              n = n.nextElementSibling;
              continue;
            }
            pushLine(n.innerText);
            n = n.nextElementSibling;
          }
        }

        return out.join('\n');
      }

      const description = extractSection('Job description') || extractSection('Job Description') || '';
      const responsibilities = extractSection('Key Responsibilities') || extractSection('Responsibilities') || '';
      const skills = extractSection('Skills') || extractSection('Skill') || '';

      // Fallback: sometimes responsibilities are part of description.
      const combined = [description, responsibilities, skills].filter(Boolean).join('\n\n');

      return {
        jobTitle,
        companyName,
        locationText,
        employmentType,
        workType,
        hasEasyApply,
        postedAgo,
        companySize,
        description,
        responsibilities,
        skills,
        combined,
        applicationUrl: url
      };
    });

    // Hard filter: if this is a login/app page, skip.
    if (!data.jobTitle || isLikelyBoilerplate(data.jobTitle)) return null;

    const location = this.parseLocation(data.locationText);
    const companyName = pickBestCompanyName([data.companyName, data.locationText]) || 'Company Not Specified';

    // Clean text blocks: remove nav/menu spill.
    const description = cleanTextBlock(data.description || data.combined || '');
    const responsibilitiesText = cleanTextBlock(data.responsibilities || '');
    const skillsText = cleanTextBlock(data.skills || '');

    // Heuristic split skills into list.
    const requiredSkills = this.extractSkillsList(skillsText);
    const responsibilities = this.extractBulletLikeList(responsibilitiesText);

    // If description is basically boilerplate, skip.
    if (isLikelyBoilerplate(description) || description.length < 25) return null;

    return {
      jobTitle: normalizeWhitespace(data.jobTitle),
      companyName,
      location,
      description,
      responsibilities,
      requiredSkills,
      applicationUrl: data.applicationUrl,
      source: { name: 'Bayt', url: 'https://www.bayt.com' },
      postedDate: new Date(),
      workType: this.normalizeWorkType(data.workType),
      contractType: this.normalizeContractType(data.employmentType),
      applyEase: data.hasEasyApply ? 'easy' : undefined,
      postedAgo: data.postedAgo || undefined,
      companySize: data.companySize || undefined,
      rawData: {
        pageUrl: url,
        locationText: data.locationText || '',
        employmentType: data.employmentType || '',
        workType: data.workType || ''
      }
    };
  }

  parseLocation(locationText) {
    const text = (locationText || '').trim();
    // Example: "Jeddah · Saudi Arabia"
    const parts = text.split('·').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) {
      return { city: 'Not Specified', country: 'Saudi Arabia', fullLocation: 'Saudi Arabia' };
    }
    const city = parts[0] || 'Not Specified';
    const country = parts[1] || 'Saudi Arabia';
    return {
      city,
      country,
      fullLocation: parts.join(', ')
    };
  }

  normalizeWorkType(workType) {
    const t = (workType || '').toLowerCase();
    if (t.includes('remote')) return 'remote';
    if (t.includes('hybrid')) return 'hybrid';
    if (t.includes('site') || t.includes('onsite') || t.includes('on site')) return 'onsite';
    return 'onsite';
  }

  normalizeContractType(employmentType) {
    const t = (employmentType || '').toLowerCase();
    if (t.includes('full')) return 'full-time';
    if (t.includes('part')) return 'part-time';
    if (t.includes('intern')) return 'internship';
    if (t.includes('contract')) return 'contract';
    if (t.includes('temporary')) return 'temporary';
    return 'full-time';
  }

  extractSkillsList(skillsText) {
    const t = cleanTextBlock(skillsText);
    if (!t) return [];
    // Prefer bullet / newline separation.
    const candidates = t
      .split(/\n|•|\u2022|\-|\*|\u00b7|\,\s+/)
      .map((s) => s.trim())
      .filter((s) => s && s.length >= 2 && s.length <= 80);
    const dedup = [...new Set(candidates)].slice(0, 30);
    return dedup;
  }

  extractBulletLikeList(text) {
    const t = cleanTextBlock(text);
    if (!t) return [];
    const lines = t
      .split(/\n|•|\u2022/)
      .map((s) => s.trim())
      .filter((s) => s && s.length >= 6);
    // Keep meaningful lines, drop headings.
    const out = [];
    for (const l of lines) {
      if (/^key responsibilities$/i.test(l)) continue;
      if (/^responsibilities$/i.test(l)) continue;
      out.push(l);
      if (out.length >= 25) break;
    }
    return out;
  }
}

module.exports = BaytHeadlessScraper;
