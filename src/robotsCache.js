const robotsParser = require('robots-parser');
const fetch = require('node-fetch');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h, per spec
const cache = new Map(); // domain -> { robots, fetchedAt }

async function getRobotsForDomain(domain) {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.robots;
  }

  const robotsUrl = `https://${domain}/robots.txt`;
  let robotsTxt = '';

  try {
    const res = await fetch(robotsUrl, { timeout: 5000 });
    if (res.ok) {
      robotsTxt = await res.text();
    }
    // if robots.txt doesn't exist or errors, treat as "allow all" (standard practice)
  } catch (err) {
    robotsTxt = '';
  }

  const robots = robotsParser(robotsUrl, robotsTxt);
  cache.set(domain, { robots, fetchedAt: Date.now() });
  return robots;
}

async function isAllowed(url, userAgent = 'DatareyBot') {
  const domain = new URL(url).hostname;
  const robots = await getRobotsForDomain(domain);
  return robots.isAllowed(url, userAgent) !== false; // default allow if undetermined
}

module.exports = { isAllowed, getRobotsForDomain };