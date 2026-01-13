// backend/utils/httpClient.js
const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

function randUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isRetryableStatus(status) {
  return [403, 408, 429, 500, 502, 503, 504].includes(status);
}

async function fetchHtml(url, opts = {}) {
  const {
    timeoutMs = Number(process.env.SCRAPE_TIMEOUT_MS || 15000),
    maxRetries = Number(process.env.SCRAPE_MAX_RETRIES || 2),
    minDelayMs = Number(process.env.SCRAPE_MIN_DELAY_MS || 1200),
    maxDelayMs = Number(process.env.SCRAPE_MAX_DELAY_MS || 2500),
    headers = {},
    params,
  } = opts;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const res = await axios.get(url, {
        params,
        timeout: timeoutMs,
        headers: {
          'User-Agent': randUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
          ...headers,
        },
        // بعض المواقع ترفض بدون referer
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        await sleep(minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
        return { html: res.data, status: res.status, finalUrl: url };
      }

      const retryable = isRetryableStatus(res.status);
      if (!retryable || attempt === maxRetries + 1) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }

      // backoff
      const backoff = attempt * 800 + Math.random() * 400;
      await sleep(backoff);
    } catch (e) {
      const status = e.status || e.response?.status;
      const retryable = status ? isRetryableStatus(status) : true;

      if (!retryable || attempt === maxRetries + 1) throw e;

      const backoff = attempt * 800 + Math.random() * 400;
      await sleep(backoff);
    }
  }

  throw new Error('Unreachable');
}

module.exports = { fetchHtml, sleep };
