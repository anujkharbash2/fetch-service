const Redis = require('ioredis');
const { fetchPage } = require('./fetchPage');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const STREAM = 'fetch-jobs';
const GROUP = 'fetch-workers';
const CONSUMER = `worker-${process.pid}`;

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM');
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }
}

async function processJob(id, fields) {
  const payload = JSON.parse(fields[1]); // fields = ['payload', '<json>']
  console.log('Processing:', payload.id, payload.url);

  const result = await fetchPage(payload.url, payload.options);

  console.log('Result:', payload.id, {
    status: result.statusCode,
    ms: result.renderTimeMs,
    error: result.error,
  });

  // Step 4+ will publish this result to a Team-2-facing stream.
  // For now, just acknowledge the job as processed.
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