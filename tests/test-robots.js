const { isAllowed } = require('./robotsCache');

(async () => {
  const tests = [
    'https://www.google.com/search?q=test', // Google disallows /search for most bots
    'https://en.wikipedia.org/wiki/Node.js', // should be allowed
    'https://example.com/',                  // no robots.txt, should default allow
  ];

  for (const url of tests) {
    const allowed = await isAllowed(url);
    console.log(url, '→ allowed:', allowed);
  }
})();