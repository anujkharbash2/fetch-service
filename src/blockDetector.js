// Known signals that a page is actually a block/CAPTCHA page, not real content
const CAPTCHA_SIGNALS = [
  'captcha',
  'are you a robot',
  'verify you are human',
  'unusual traffic',
  'access denied',
  'request blocked',
];

const BLOCK_STATUS_CODES = [403, 429, 503];

function detectBlock({ html, statusCode }) {
  if (!html) return null;

  const lowerHtml = html.toLowerCase();

  // Signal 1: known CAPTCHA/block phrases in the body
  const hasBlockPhrase = CAPTCHA_SIGNALS.some(signal => lowerHtml.includes(signal));
  if (hasBlockPhrase) {
    return lowerHtml.includes('captcha') ? 'CAPTCHA' : 'BLOCKED';
  }

  // Signal 2: block-associated status codes
  if (BLOCK_STATUS_CODES.includes(statusCode)) {
    return 'BLOCKED';
  }

  // Signal 3: suspiciously tiny page for a normal fetch (real pages are rarely under ~2KB)
  // Tune this threshold per-target later; it's a heuristic, not a hard rule.
  if (html.length < 2000 && statusCode !== 200) {
    return 'BLOCKED';
  }

  return null; // no block detected
}

module.exports = { detectBlock };