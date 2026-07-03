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

  // Strongest signal: block-associated status codes
  if (BLOCK_STATUS_CODES.includes(statusCode)) {
    return 'BLOCKED';
  }

  // Suspiciously tiny page combined with non-200 — likely a block/error page
  if (html.length < 2000 && statusCode !== 200) {
    const hasBlockPhrase = CAPTCHA_SIGNALS.some(s => lowerHtml.includes(s));
    return hasBlockPhrase
      ? (lowerHtml.includes('captcha') ? 'CAPTCHA' : 'BLOCKED')
      : 'BLOCKED';
  }

  // For otherwise-normal-looking pages (200, reasonable size), only trust
  // a signal if it's in a prominent, structural location — the <title> tag —
  // not buried anywhere in a 1MB page's JS/config.
  const titleMatch = lowerHtml.match(/<title>(.*?)<\/title>/s);
  if (titleMatch) {
    const title = titleMatch[1];
    const hasBlockPhrase = CAPTCHA_SIGNALS.some(s => title.includes(s));
    if (hasBlockPhrase) {
      return title.includes('captcha') ? 'CAPTCHA' : 'BLOCKED';
    }
  }

  return null;
}

module.exports = { detectBlock };