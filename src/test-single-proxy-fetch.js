const { fetchPage } = require('./fetchPage');

(async () => {
  const proxy = {
    id: 'p1',
    host: '31.59.20.176',
    port: 6754,
    username: 'gilnndyw',
    password: 'aifraudi1yy2',
  };

  const result = await fetchPage('https://en.wikipedia.org/wiki/HTML', { proxy });
  console.log({
    status: result.statusCode,
    error: result.error,
    htmlLen: result.html ? result.html.length : 0,
  });
})();