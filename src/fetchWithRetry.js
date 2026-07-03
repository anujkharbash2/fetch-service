const { fetchPage } = require('./fetchPage');

const RETRYABLE_ERRORS = ['TIMEOUT', 'BLOCKED', 'CAPTCHA'];
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, options = {}, proxyManager = null) {
  let lastResult = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // rotate proxy on each retry if a manager is supplied
    const proxy = proxyManager ? proxyManager.getNext() : options.proxy;

    lastResult = await fetchPage(url, { ...options, proxy });

    if (proxyManager) {
      if (lastResult.error) proxyManager.recordFailure(proxy.id);
      else proxyManager.recordSuccess(proxy.id, lastResult.renderTimeMs);
    }

    // success — return immediately
    if (!lastResult.error) return { ...lastResult, attempts: attempt + 1 };

    // non-retryable error — stop immediately
    if (!RETRYABLE_ERRORS.includes(lastResult.error)) {
      return { ...lastResult, attempts: attempt + 1 };
    }

    // retryable — back off before next attempt (unless this was the last one)
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 500ms, 1s, 2s
      console.log(`Retry ${attempt + 1}/${MAX_RETRIES} for ${url} after ${delay}ms (${lastResult.error})`);
      await sleep(delay);
    }
  }

  return { ...lastResult, attempts: MAX_RETRIES + 1 };
}

module.exports = { fetchWithRetry };