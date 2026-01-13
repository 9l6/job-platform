// backend/scripts/testScrape.js
require('dotenv').config();
const SaudiJobSitesScraper = require('../scrapers/saudiJobSites');

(async () => {
  const scraper = new SaudiJobSitesScraper();
  const jobs = await scraper.scrapeAll('developer');
  console.log('Jobs:', jobs.length);
  console.log(jobs.slice(0, 3));
  process.exit(0);
})();
