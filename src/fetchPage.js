const { chromium } = require('playwright');
const { detectBlock } = require('./blockDetector');


async function fetchPage(url, options = {}) {
  const {
    timeoutMs = 15000,
    waitUntil = 'load',
    proxy = null, // { id, host, port, username, password }
  } = options;

  const startTime = Date.now();
  let browser;

  try {
    const launchOptions = { headless: true };


    if (proxy) {
      launchOptions.proxy = {
        server: `http://${proxy.host}:${proxy.port}`,
        username: proxy.username,
        password: proxy.password,
      };
    }

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      userAgent: 'DatareyBot/1.0 (+https://datarey.example/bot)',
    });
    const page = await context.newPage();

    const response = await page.goto(url, { timeout: timeoutMs, waitUntil });
    const html = await page.content();
    const statusCode = response ? response.status() : null;
    const finalUrl = page.url();
    const blockSignal = detectBlock({ html, statusCode });

    await browser.close();

    return {
      html, statusCode,
      renderTimeMs: Date.now() - startTime,
      finalUrl, error: blockSignal,
      proxyId: proxy ? proxy.id : null,
    };
  } catch (err) {
    if (browser) await browser.close();
    return {
      html: null, statusCode: null,
      renderTimeMs: Date.now() - startTime,
      finalUrl: url, error: classifyError(err),
      proxyId: proxy ? proxy.id : null,
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