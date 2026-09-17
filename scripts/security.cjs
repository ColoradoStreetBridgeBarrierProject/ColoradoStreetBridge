'use strict';
// Meta CSP supports a static host. Header-only protections must be set by the host.
const policy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests'
].join('; ');

function secureHtml(html) {
  // Refresh existing metadata, keeping the policy before every resource load.
  const clean = html.replace(/\s*<meta\s+(?:http-equiv="Content-Security-Policy"|name="referrer")\s+content="[^"]*"\s*\/?\s*>/gi, '');
  if (!/<meta charset="utf-8">/i.test(clean)) throw new Error('Missing UTF-8 metadata');
  return clean.replace(/<meta charset="utf-8">/i, match => match +
    '\n  <meta http-equiv="Content-Security-Policy" content="' + policy + '">' +
    '\n  <meta name="referrer" content="no-referrer">');
}

module.exports = {secureHtml};
