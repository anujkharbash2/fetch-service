const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: 'http://31.59.20.176:6754',
      username: 'gilnndyw',
      password: 'aifraudi1yy2',
    },
  });

  const page = await browser.newPage();
  const response = await page.goto('https://ipv4.webshare.io/', { timeout: 15000 });
  const text = await page.content();

  console.log('Status:', response.status());
  console.log('Body:', text);

  await browser.close();
})();