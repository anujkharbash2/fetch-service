const { isSafeUrl } = require('./urlSafety');

(async () => {
  const tests = [
    'https://example.com',                    // should be safe
    'http://169.254.169.254/latest/meta-data', // cloud metadata — MUST block
    'http://localhost:6379',                   // your own redis — MUST block
    'http://127.0.0.1',                        // loopback — MUST block
    'http://192.168.1.1',                       // private network — MUST block
    'file:///etc/passwd',                       // wrong protocol — MUST block
  ];

  for (const url of tests) {
    const result = await isSafeUrl(url);
    console.log(url, '→', result);
  }
})();