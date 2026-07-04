const { fetchPage } = require('./fetchPage');
const { ProxyManager } = require('./proxyManager');

(async () => {
  const manager = new ProxyManager();
  const testUrls = [
    'https://example.com',
  'https://example.org',
  'https://api.ipify.org?format=json',
  'https://www.wikipedia.org',
  'https://www.bbc.com',
  ];

  for (const url of testUrls) {
    const proxy = manager.getNext();
    const result = await fetchPage(url, { proxy });

    if (result.error) {
      manager.recordFailure(proxy.id);
    } else {
      manager.recordSuccess(proxy.id, result.renderTimeMs);
    }

    console.log(url, '→ proxy:', proxy.id, 'status:', result.statusCode, 'error:', result.error);
  }

  console.log('\n--- Proxy stats ---');
  console.table(manager.stats());
})();