const { fetchWithRetry } = require('./fetchWithRetry');
const { ProxyManager } = require('./proxyManager');

(async () => {
  const manager = new ProxyManager();
  const result = await fetchWithRetry('https://example.com', {}, manager);
  console.log(result.html.slice(0, 300));
  console.log('Final result:', {
    status: result.statusCode,
    error: result.error,
    attempts: result.attempts,
    htmlLen: result.html ? result.html.length : 0,
  });
})();