const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function enqueueFetchJob(url, options = {}) {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    options,
    enqueuedAt: Date.now(),
  };
  await redis.xadd('fetch-jobs', '*', 'payload', JSON.stringify(job));
  console.log('Enqueued:', job.id, url);
  return job.id;
}

module.exports = { enqueueFetchJob };