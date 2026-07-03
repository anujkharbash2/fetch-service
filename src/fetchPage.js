const { chromium } = require('playwright');

async function fetchPage(url, options = {}) {
  const {
    timeoutMs = 15000,
    waitUntil = 'load',      // 'load' | 'domcontentloaded' | 'networkidle'
  } = options;

  const startTime = Date.now();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'DataLoomBot/1.0 (+https://dataloom.example/bot)', // truthful UA, per doc
    });
    const page = await context.newPage();

    const response = await page.goto(url, {
      timeout: timeoutMs,
      waitUntil,
    });

    const html = await page.content();
    const statusCode = response ? response.status() : null;
    const finalUrl = page.url(); // captures redirects

    await browser.close();

    return {
      html,
      statusCode,
      renderTimeMs: Date.now() - startTime,
      finalUrl,
      error: null,
    };
  } catch (err) {
    if (browser) await browser.close();
    return {
      html: null,
      statusCode: null,
      renderTimeMs: Date.now() - startTime,
      finalUrl: url,
      error: classifyError(err),
    };
  }
}

function classifyError(err) {
  const msg = err.message || '';
  if (msg.includes('Timeout')) return 'TIMEOUT';
  if (msg.includes('net::ERR_NAME_NOT_RESOLVED')) return 'DNS_FAIL';
  if (msg.includes('net::ERR_INVALID_URL')) return 'INVALID_URL';
  return 'UNKNOWN_ERROR';
}

module.exports = { fetchPage };