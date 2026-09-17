'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {secureHtml} = require('../scripts/security.cjs');
function htmlFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) :
      entry.name.endsWith('.html') && entry.name !== 'index.template.html' ? [file] : [];
  });
}
const pages = htmlFiles(root);
assert.equal(pages.length, 14, 'Check every published HTML document');
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const label = path.relative(root, file);
  const policies = [...html.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)">/gi)];
  assert.equal(policies.length, 1, label + ': one enforced CSP');
  const policy = policies[0];
  assert(policy.index < html.search(/<(?:script|style|link|img|base|iframe)\b/i), label + ': CSP precedes resources');
  const directives = new Map(policy[1].split(';').map(part => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values.join(' ')];
  }));
  for (const name of ['default-src', 'connect-src', 'object-src', 'frame-src', 'base-uri']) {
    assert.equal(directives.get(name), "'none'", label + ': ' + name);
  }
  for (const name of ['script-src', 'style-src', 'form-action']) {
    assert.equal(directives.get(name), "'self'", label + ': ' + name);
  }
  assert.equal(directives.get('img-src'), "'self' data:");
  assert(directives.has('upgrade-insecure-requests'));
  assert(!/unsafe-inline|unsafe-eval|https:|\*/.test(policy[1]), label + ': no permissive CSP sources');
  assert(!directives.has('frame-ancestors'), 'Framing protection requires an HTTP header, not meta');
  assert.equal((html.match(/<meta name="referrer" content="no-referrer">/g) || []).length, 1, label + ': referrer privacy');
  assert.equal(secureHtml(html), html, label + ': metadata refresh is deterministic');
  assert(!/<style\b|\sstyle\s*=|\son\w+\s*=/i.test(html), label + ': no inline styles or event handlers');
  assert(!/<base\b|<iframe\b|<object\b|<embed\b/i.test(html), label + ': no embedded active content');
  assert(!/\b(?:href|src|action)\s*=\s*["']\s*(?:javascript:|http:)/i.test(html), label + ': no unsafe URLs');
  for (const [, attrs, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const source = attrs.match(/\bsrc="([^"]+)"/);
    assert(source && !content.trim(), label + ': only external local scripts');
    assert(!/^(?:[a-z]+:|\/\/)/i.test(source[1]), label + ': scripts stay on this origin');
    assert(fs.existsSync(path.resolve(path.dirname(file), source[1].split('?')[0])), label + ': script exists');
  }
  for (const [, attrs] of html.matchAll(/<a\b([^>]+)>/gi)) {
    if (/target="_blank"/i.test(attrs)) {
      const rel = attrs.match(/rel="([^"]+)"/i);
      assert(rel && rel[1].split(/\s+/).includes('noopener') && rel[1].split(/\s+/).includes('noreferrer'), label + ': external-tab isolation');
    }
  }
  for (const [, attrs] of html.matchAll(/<link\b([^>]+)>/gi)) {
    if (!/rel="stylesheet"/i.test(attrs)) continue;
    const source = attrs.match(/\bhref="([^"]+)"/);
    assert(source && !/^(?:[a-z]+:|\/\/)/i.test(source[1]), label + ': styles stay on this origin');
    assert(fs.existsSync(path.resolve(path.dirname(file), source[1].split('?')[0])), label + ': stylesheet exists');
  }
}
console.log('Security checks passed for all ' + pages.length + ' published pages.');
