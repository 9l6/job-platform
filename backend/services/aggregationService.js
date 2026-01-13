// backend/services/aggregationService.js
const cron = require('node-cron');
const SaudiJobSitesScraper = require('../scrapers/saudiJobSites');
const JobProcessor = require('./jobProcessor');

class AggregationService {
  constructor() {
    this.saudiScraper = new SaudiJobSitesScraper();
    this.jobProcessor = new JobProcessor();
    this.isRunning = false;

    // Default limits (can override via .env)
    this.maxKeywords = parseInt(process.env.SCRAPING_MAX_KEYWORDS || '2', 10);
    this.delayMs = parseInt(process.env.SCRAPING_DELAY_MS || '2000', 10);

    this.keywords = [
      'software engineer',
      'developer',
      'accountant',
      'data analyst',
      'project manager',
      'hr',
      'marketing',
      'sales'
    ];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ✅ Runs aggregation and RETURNS final results (for testing)
  async aggregateJobs() {
    if (this.isRunning) {
      console.log('Aggregation already running, skipping...');
      return { success: false, message: 'Already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    console.log('🚀 Starting job aggregation:', new Date().toISOString());

    try {
      let allJobs = [];
      let scrapedCount = 0;

      console.log(`🇸🇦 Scraping Saudi job sites... (keywords=${this.maxKeywords})`);

      const keywordsToRun = this.keywords.slice(0, this.maxKeywords);

      for (const keyword of keywordsToRun) {
        const jobs = await this.saudiScraper.scrapeAll(keyword);
        allJobs.push(...jobs);
        scrapedCount += jobs.length;
        console.log(`  ✓ Found ${jobs.length} jobs for "${keyword}"`);
        await this.delay(this.delayMs);
      }

      console.log('🧹 Removing duplicates...');
      const beforeDedup = allJobs.length;
      allJobs = this.jobProcessor.removeDuplicatesFromArray(allJobs);
      console.log(`  ✓ Removed ${beforeDedup - allJobs.length} duplicates`);

      console.log(`💾 Processing ${allJobs.length} jobs...`);
      const results = await this.jobProcessor.processJobs(allJobs);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Aggregation complete in ${duration}s:`, results);

      return {
        success: true,
        message: 'Aggregation completed',
        scrapedCount,
        processed: results
      };
    } catch (error) {
      console.error('❌ Aggregation error:', error);
      return { success: false, message: 'Aggregation failed', error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  // Cron (اختياري)
  startScheduler() {
    const autoScrapingEnabled = process.env.ENABLE_AUTO_SCRAPING === 'true';

    console.log('📅 Job aggregation scheduler initialized');
    console.log(`   Auto-scraping: ${autoScrapingEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);

    if (autoScrapingEnabled) {
      cron.schedule('0 0,6,12,18 * * *', () => {
        console.log('\n⏰ Scheduled job aggregation triggered');
        this.aggregateJobs();
      });
      console.log('✅ Scheduler ready (every 6 hours)\n');
    } else {
      console.log('   Manual only (recommended for development)\n');
    }
  }

  async runNow() {
    console.log('Manual aggregation triggered');
    return await this.aggregateJobs();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      maxKeywords: this.maxKeywords,
      delayMs: this.delayMs
    };
  }
}

module.exports = new AggregationService();
