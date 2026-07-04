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
    let proxy;
    try {
      proxy = proxyManager ? proxyManager.getNext() : options.proxy;
    } catch {
  return { error: 'NO_PROXIES_AVAILABLE', statusCode: null, html: null, attempts: attempt };
}

    lastResult = await fetchPage(url, { ...options, proxy });
    if (proxyManager) {
      if (lastResult.error) proxyManager.recordFailure(proxy.id);
      else proxyManager.recordSuccess(proxy.id, lastResult.renderTimeMs);
    }
    if (!lastResult.error) return { ...lastResult, attempts: attempt + 1 };
    if (!RETRYABLE_ERRORS.includes(lastResult.error)) return { ...lastResult, attempts: attempt + 1 };
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  return { ...lastResult, attempts: MAX_RETRIES + 1 };
}

module.exports = { fetchWithRetry };