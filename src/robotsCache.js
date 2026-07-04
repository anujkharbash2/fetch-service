const robotsParser = require('robots-parser');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function getRobotsForDomain(domain) {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.robots;
  }

  const robotsUrl = `https://${domain}/robots.txt`;
  let robotsTxt = '';

  try {
    const res = await fetchWithTimeout(robotsUrl, 5000);
    if (res.ok) {
      robotsTxt = await res.text();
    }
  } catch {
  robotsTxt = '';
}

  const robots = robotsParser(robotsUrl, robotsTxt);
  cache.set(domain, { robots, fetchedAt: Date.now() });
  return robots;
}

async function isAllowed(url, userAgent = 'DatareyBot') {
  const domain = new URL(url).hostname;
  const robots = await getRobotsForDomain(domain);
  return robots.isAllowed(url, userAgent) !== false;
}

module.exports = { isAllowed, getRobotsForDomain };