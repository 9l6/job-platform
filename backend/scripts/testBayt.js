const BaytHeadlessScraper = require('../scrapers/baytHeadless');

(async () => {
  const s = new BaytHeadlessScraper();
  const jobs = await s.scrape('developer');
  console.log('Jobs:', jobs.length);
  console.log(jobs.slice(0, 3));
  process.exit(0);
})();
