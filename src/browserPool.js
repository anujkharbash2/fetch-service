const { chromium } = require('playwright');

class BrowserPool {
  constructor(size = 5) {
    this.size = size;
    this.browsers = [];
    this.cursor = 0;
  }

  async init() {
    for (let i = 0; i < this.size; i++) {
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
          '--disable-background-networking', '--disable-component-update',
          '--disable-domain-reliability', '--disable-client-side-phishing-detection',
          '--disable-sync', '--metrics-recording-only', '--disable-default-apps',
        ],
      });
      this.browsers.push(browser);
    }
    console.log(`Browser pool ready: ${this.size} instances`);
  }

  getBrowser() {
    const browser = this.browsers[this.cursor % this.browsers.length];
    this.cursor++;
    return browser;
  }

  async shutdown() {
    await Promise.all(this.browsers.map(b => b.close()));
  }
}

module.exports = { BrowserPool };