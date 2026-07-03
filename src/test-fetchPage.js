const { fetchPage } = require('./fetchPage');

(async () => {
  const urls = [
    'https://sau.int', //university home page
    'https://www.amazon.in/dp/B0BQY4ZY2C', // a real product page
    'https://this-domain-does-not-exist-xyz123.com', // should fail cleanly
  ];

  for (const url of urls) {
    const result = await fetchPage(url);
    console.log(url, '→', {
      status: result.statusCode,
      ms: result.renderTimeMs,
      htmlLen: result.html ? result.html.length : 0,
      error: result.error,
    });
  }
})();