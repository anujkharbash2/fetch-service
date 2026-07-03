const DEFAULT_MAX_PER_SEC = 3; // politeness ceiling, per spec (2-5 req/sec/domain)
const domainState = new Map(); // domain -> { lastRequestTimes: [] }

function getDomain(url) {
  return new URL(url).hostname;
}

async function waitForSlot(url, maxPerSec = DEFAULT_MAX_PER_SEC) {
  const domain = getDomain(url);
  const now = Date.now();

  if (!domainState.has(domain)) {
    domainState.set(domain, []);
  }

  const timestamps = domainState.get(domain);
  // drop timestamps older than 1 second
  const recent = timestamps.filter(t => now - t < 1000);

  if (recent.length >= maxPerSec) {
    const waitMs = 1000 - (now - recent[0]) + 10; // small buffer
    await new Promise(r => setTimeout(r, waitMs));
    return waitForSlot(url, maxPerSec); // recheck after waiting
  }

  recent.push(Date.now());
  domainState.set(domain, recent);
}

module.exports = { waitForSlot };