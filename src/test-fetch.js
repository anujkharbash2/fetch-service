const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const html = await page.content();
  console.log('Fetched', html.length, 'bytes');
  await browser.close();
})();