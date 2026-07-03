const { waitForSlot } = require('./rateLimiter');

(async () => {
  const url = 'https://example.com/page1';
  console.log('Firing 6 requests at max 3/sec...');
  const start = Date.now();

  for (let i = 1; i <= 6; i++) {
    await waitForSlot(url, 3);
    console.log(`Request ${i} allowed at +${Date.now() - start}ms`);
  }
})();