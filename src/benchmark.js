const fs = require('fs');
const { fetchWithRetry } = require('./fetchWithRetry');
const { ProxyManager } = require('./proxyManager');
const { isSafeUrl } = require('./urlSafety');
const { isAllowed } = require('./robotsCache');

async function runBenchmark() {
  const data = JSON.parse(fs.readFileSync('./data/benchmark-urls.json', 'utf-8'));
  const manager = new ProxyManager();
  const results = [];

  for (const [category, urls] of Object.entries(data)) {
    for (const url of urls) {
      const safety = await isSafeUrl(url);
      if (!safety.safe) {
        results.push({ category, url, outcome: 'SKIPPED_UNSAFE' });
        continue;
      }

      const allowed = await isAllowed(url);
      if (!allowed) {
        results.push({ category, url, outcome: 'SKIPPED_ROBOTS' });
        continue;
      }

      let result;
      try {
        result = await fetchWithRetry(url, {}, manager);
      } catch {
  result = { error: 'CRASHED', statusCode: null, renderTimeMs: 0, attempts: 0 };
}

      results.push({
        category, url,
        outcome: result.error || 'SUCCESS',
        statusCode: result.statusCode,
        renderTimeMs: result.renderTimeMs,
        attempts: result.attempts,
      });
    }
  }

  fs.writeFileSync('./data/benchmark-results.json', JSON.stringify(results, null, 2));

  const total = results.length;
  const success = results.filter(r => r.outcome === 'SUCCESS').length;
  console.log(`\n=== Benchmark: ${success}/${total} succeeded (${((success/total)*100).toFixed(1)}%) ===`);

  const byCategory = {};
  for (const r of results) {
    byCategory[r.category] = byCategory[r.category] || { total: 0, success: 0 };
    byCategory[r.category].total++;
    if (r.outcome === 'SUCCESS') byCategory[r.category].success++;
  }
  console.table(byCategory);
}

runBenchmark();