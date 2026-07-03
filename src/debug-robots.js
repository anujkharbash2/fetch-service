const robotsParser = require('robots-parser');

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  const url = 'https://www.google.com/robots.txt';
  const res = await fetchWithTimeout(url);
  const text = await res.text();

  console.log('--- Status ---', res.status);
  console.log('--- First 500 chars of robots.txt ---');
  console.log(text.slice(0, 500));

  const robots = robotsParser(url, text);
  console.log('\n--- isAllowed checks ---');
  console.log('Search path:', robots.isAllowed('https://www.google.com/search?q=test', 'DatareyBot'));
  console.log('Search path (wildcard *):', robots.isAllowed('https://www.google.com/search?q=test', '*'));
})();