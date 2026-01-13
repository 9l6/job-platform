const BaytHeadlessScraper = require('./baytHeadless');
const TanqeebHeadlessScraper = require('./tanqeebHeadless');

class SaudiJobSitesScraper {
  constructor() {
    this.bayt = new BaytHeadlessScraper();
    this.tanqeeb = new TanqeebHeadlessScraper();
  }

  async scrapeAll(keyword) {
    const allJobs = [];
    console.log(`\nStarting Saudi job sites scraping for "${keyword}"...`);

    const baytJobs = await this.bayt.scrape(keyword, 25);
    console.log(`Scraped ${baytJobs.length} jobs from Bayt (details)`);
    allJobs.push(...baytJobs);

    const tanqeebJobs = await this.tanqeeb.scrape(keyword, 25);
    console.log(`Scraped ${tanqeebJobs.length} jobs from Tanqeeb (details)`);
    allJobs.push(...tanqeebJobs);

    console.log(`Total jobs scraped from Saudi sites: ${allJobs.length}`);
    return allJobs;
  }
}

module.exports = SaudiJobSitesScraper;
