// backend/scrapers/tanqeebScraper.js
const axios = require('axios');
const cheerio = require('cheerio');

class TanqeebScraper {
  constructor() {
    this.baseUrl = 'https://sa.tanqeeb.com';
    this.searchUrl = 'https://sa.tanqeeb.com/jobs-in-saudi-arabia';
    this.userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
  }

  cleanText(t) {
    return (t || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  parseLocation(locationText) {
    const cleaned = this.cleanText(locationText).replace('·', ',');
    const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
    const city = parts[0] || 'Not Specified';
    return {
      city,
      country: 'Saudi Arabia',
      fullLocation: `${city}, Saudi Arabia`
    };
  }

  async scrape(keyword, { limit = 20 } = {}) {
    const url = `${this.searchUrl}?q=${encodeURIComponent(keyword)}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 20000
    });

    const $ = cheerio.load(res.data);
    const jobs = [];

    // هذه selectors تتغير أحياناً — نأخذ الأكثر شيوعاً
    const items = $('.job-item, .job-box, .job_listing, article').toArray();

    for (const el of items.slice(0, limit)) {
      const $el = $(el);

      const title = this.cleanText(
        $el.find('.job-title, h3, h2, a').first().text()
      );

      // الشركة
      const company = this.cleanText(
        $el.find('.company-name, .employer, .job-company, .company').first().text()
      );

      // المكان
      const locText = this.cleanText(
        $el.find('.location, .job-location, .job_city').first().text()
      );

      // رابط
      let href = $el.find('a').first().attr('href');
      if (href && !href.startsWith('http')) href = `${this.baseUrl}${href}`;

      if (!title || !href) continue;

      jobs.push({
        jobTitle: title,
        companyName: company || 'Company Not Specified',
        location: this.parseLocation(locText || 'Saudi Arabia'),
        description: 'View details on Tanqeeb',
        requirements: [],
        applicationUrl: href,
        source: { name: 'Tanqeeb', url: this.baseUrl },
        postedDate: new Date(),
        workType: 'onsite',
        contractType: 'full-time'
      });
    }

    console.log(`Scraped ${jobs.length} jobs from Tanqeeb`);
    return jobs;
  }
}

module.exports = TanqeebScraper;
