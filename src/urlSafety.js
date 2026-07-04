const dns = require('dns').promises;
const net = require('net');

// Private/reserved IP ranges that should never be fetched
const BLOCKED_RANGES = [
  /^127\./,           // loopback
  /^10\./,            // private
  /^172\.(1[6-9]|2\d|3[01])\./, // private
  /^192\.168\./,      // private
  /^169\.254\./,      // link-local (includes cloud metadata endpoint!)
  /^::1$/,             // IPv6 loopback
  /^fc00:/,            // IPv6 private
  /^fe80:/,            // IPv6 link-local
];

const BLOCKED_HOSTS = ['localhost', '0.0.0.0'];

function isBlockedIp(ip) {
  return BLOCKED_RANGES.some(range => range.test(ip));
}

async function isSafeUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { safe: false, reason: 'INVALID_URL' };
  }

  // only allow http/https — block file://, ftp://, gopher://, etc.
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, reason: 'INVALID_PROTOCOL' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.includes(hostname)) {
    return { safe: false, reason: 'BLOCKED_HOST' };
  }

  // if hostname is already a raw IP, check directly
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) return { safe: false, reason: 'PRIVATE_IP' };
    return { safe: true };
  }

  // otherwise resolve DNS and check what IP it actually points to
  // (this catches DNS rebinding: a domain that LOOKS public but resolves to a private IP)
  try {
    const addresses = await dns.resolve4(hostname).catch(() => dns.resolve6(hostname));
    const blocked = addresses.some(ip => isBlockedIp(ip));
    if (blocked) return { safe: false, reason: 'PRIVATE_IP_VIA_DNS' };
    return { safe: true };
  } catch {
  return { safe: false, reason: 'DNS_RESOLUTION_FAILED' };
}
}

module.exports = { isSafeUrl };