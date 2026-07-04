const { chromium } = require('playwright');
const { detectBlock } = require('./blockDetector');


async function fetchPage(url, options = {}) {
  const { timeoutMs = 15000, waitUntil = 'domcontentloaded', proxy = null, browser = null } = options;
  const startTime = Date.now();
  let ownBrowser = false;
  let b = browser;

  try {
    if (!b) {
      b = await chromium.launch({ headless: true, proxy: proxy ? { server: `http://${proxy.host}:${proxy.port}`, username: proxy.username, password: proxy.password } : undefined });
      ownBrowser = true;
    }

    const context = await b.newContext({
      userAgent: 'DatareyBot/1.0 (+https://datarey.example/bot)',
      proxy: proxy ? { server: `http://${proxy.host}:${proxy.port}`, username: proxy.username, password: proxy.password } : undefined,
    });
    const page = await context.newPage();
    await page.route('**/*', route => ['image','stylesheet','font','media'].includes(route.request().resourceType()) ? route.abort() : route.continue());

    const response = await page.goto(url, { timeout: timeoutMs, waitUntil });
    const html = await page.content();
    const statusCode = response ? response.status() : null;
    const finalUrl = page.url();
    await context.close();
    if (ownBrowser) await b.close();

    const blockSignal = detectBlock({ html, statusCode });
    return { html, statusCode, renderTimeMs: Date.now() - startTime, finalUrl, error: blockSignal, proxyId: proxy ? proxy.id : null };
  } catch (err) {
    if (ownBrowser && b) await b.close();
    return { html: null, statusCode: null, renderTimeMs: Date.now() - startTime, finalUrl: url, error: classifyError(err), proxyId: proxy ? proxy.id : null };
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