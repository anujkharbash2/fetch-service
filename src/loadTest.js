const { enqueueFetchJob } = require('./enqueueJob');
(async () => {
  const urls = Array(50).fill('https://example.com');
  for (const url of urls) await enqueueFetchJob(url);
  console.log('Enqueued 50 jobs');
})();