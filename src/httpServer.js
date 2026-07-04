require('dotenv').config();
const express = require('express');
const { fetchWithRetry } = require('./fetchWithRetry');
const { ProxyManager } = require('./proxyManager');
const { isSafeUrl } = require('./urlSafety');
const { isAllowed } = require('./robotsCache');
const { waitForSlot } = require('./rateLimiter');

const app = express();
app.use(express.json());
const manager = new ProxyManager();

app.post('/internal/fetch', async (req, res) => {
  const { url, options } = req.body;

  const safety = await isSafeUrl(url);
  if (!safety.safe) {
    return res.status(400).json({ error: 'UNSAFE_URL', reason: safety.reason });
  }

  const allowed = await isAllowed(url);
  if (!allowed) {
    return res.status(200).json({ html: null, error: 'ROBOTS_DISALLOWED', statusCode: null });
  }

  await waitForSlot(url);
  const result = await fetchWithRetry(url, options || {}, manager);
  res.json(result);
});

const PORT = process.env.FETCH_HTTP_PORT || 4000;
app.listen(PORT, () => console.log(`fetch-service HTTP wrapper on port ${PORT}`));