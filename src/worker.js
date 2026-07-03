const Redis = require('ioredis');
const { fetchPage } = require('./fetchPage');
const { isAllowed } = require('./robotsCache');
const { waitForSlot } = require('./rateLimiter');
const { fetchWithRetry } = require('./fetchWithRetry');
const { ProxyManager } = require('./proxyManager');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const STREAM = 'fetch-jobs';
const GROUP = 'fetch-workers';
const CONSUMER = `worker-${process.pid}`;
const proxyManager = new ProxyManager(); 

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM');
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }
}

async function processJob(id, fields) {
  const payload = JSON.parse(fields[1]);
  console.log('Processing:', payload.id, payload.url);

  // Compliance gate — check robots.txt first
  const allowed = await isAllowed(payload.url);
  if (!allowed) {
    console.log('Blocked by robots.txt:', payload.url);
    // In Step 6 this becomes a proper ROBOTS_DISALLOWED error code
    await redis.xack(STREAM, GROUP, id);
    return;
  }

  // Politeness gate — respect per-domain rate limit
  await waitForSlot(payload.url);

  const result = await fetchWithRetry(payload.url, payload.options);
  console.log('Result:', payload.id, {
    status: result.statusCode,
    ms: result.renderTimeMs,
    error: result.error,
  });

  await redis.xack(STREAM, GROUP, id);
}

async function run() {
  await ensureGroup();
  console.log('Worker started, waiting for jobs...');

  while (true) {
    const res = await redis.xreadgroup(
      'GROUP', GROUP, CONSUMER,
      'COUNT', 1,
      'BLOCK', 5000,
      'STREAMS', STREAM, '>'
    );

    if (!res) continue; // no jobs, loop again

    for (const [, entries] of res) {
      for (const [id, fields] of entries) {
        await processJob(id, fields);
      }
    }
  }
}

run().catch(console.error);