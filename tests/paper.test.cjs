'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const paper = JSON.parse(read('paper/content.json'));
const routes = paper.sections.map(s => 'paper/' + (s.slug ? s.slug + '/' : ''));
const files = [...routes, 'paper/sources/'].map(route => route + 'index.html');
const rendered = new Map(files.map(file => [file, read(file)]));
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const decode = text => text.replaceAll('&amp;', '&');
assert.equal(routes.length, 13);
assert.equal((rendered.get('paper/sources/index.html').match(/class="csb-source"/g) || []).length, 41);
assert.equal((paper.sources.match(/data-docx-paragraph=/g) || []).length,
  (rendered.get('paper/sources/index.html').match(/data-docx-paragraph=/g) || []).length);
let citations = 0, checked = 0, images = 0;
for (const [file, html] of rendered) {
  assert.equal(new Set(ids(html)).size, ids(html).length, file + ': duplicate IDs');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, file + ': one page heading');
  assert(!/\bhidden(?:="")?[^>]*data-csb-chapter|data-csb-chapter|guide\.js/.test(html), file + ': no embedded chapter switching');
  assert(!/sandbox:|\/workspace\/|libfile_|file_000000|data:image|private preview/.test(html), file + ': no internal references');
  assert(html.includes('href="tel:988"'));
  assert(html.includes('Comprehensive evidence cutoff · September 1, 2026'));
  for (const base of ['https://coloradostreetbridgeproject.com/', 'https://example.org/ColoradoStreetBridge/']) {
    for (const [, attribute, encoded] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
      const value = decode(encoded);
      if (/^(?:https?:|mailto:|tel:|data:)/.test(value)) continue;
      const url = new URL(value, base + file.replace('index.html', ''));
      assert(url.pathname.startsWith(new URL(base).pathname), 'Escaped deployment base: ' + value);
      let target = url.pathname.slice(new URL(base).pathname.length);
      if (target.endsWith('/')) target += 'index.html';
      assert(fs.existsSync(path.join(root, target)), file + ': missing ' + value);
      if (url.hash && target.endsWith('.html')) assert(ids(read(target)).includes(decodeURIComponent(url.hash.slice(1))), file + ': missing target ' + value);
      if (url.searchParams.has('cite')) {
        const cite = url.searchParams.get('cite');
        assert(ids(html).includes(cite), 'Citation must return to a real passage');
        assert(read(target).includes('../../' + file.replace('index.html', '') + '#' + cite), 'Sources must retain exact return link');
      }
      checked++;
    }
  }
  citations += (html.match(/class="csb-cite"/g) || []).length;
  images += (html.match(/class="csb-book-image"/g) || []).length;
}
for (const [index, route] of routes.entries()) {
  const html = rendered.get(route + 'index.html');
  assert(html.includes('Section ' + (index + 1) + ' of 13'));
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  for (const rel of ['prev', 'next']) {
    const href = html.match(new RegExp('rel="' + rel + '" href="([^"]+)"'));
    if (!href) { assert.equal(rel, 'prev'); assert.equal(index, 0); continue; }
    const expected = rel === 'prev' ? routes[index - 1] : routes[index + 1] || 'paper/sources/';
    const actual = new URL(href[1], 'https://example.org/' + route);
    assert.equal(actual.pathname, '/' + expected);
    assert.equal(actual.hash, '#paper-top', 'Page navigation must go to the beginning');
  }
  assert(read('sitemap.xml').includes('/' + route + '</loc>'));
}
assert.equal(images, 10);
assert(citations > 190);
assert(rendered.get('paper/2018-2019/index.html').includes('provided the City approved additional construction funding'));
assert(rendered.get('paper/forecasts/index.html').includes('October – December 2025, then January – March 2026, and then April – June 2026'));
assert(routes.indexOf('paper/questions/') === routes.indexOf('paper/2024/') + 1);
assert(routes.indexOf('paper/forecasts/') === routes.indexOf('paper/2025-2026/') + 1);
assert(!rendered.get('paper/questions/index.html').includes('rescue cushion'));
assert.equal(paper.sections.filter(s => s.table).length, 2);
assert(read('paper/reader.css').includes('.csb-table { font:inherit;'));
console.log(JSON.stringify({readingSections: 13, sourceEntries: 41, images, citations, checkedLocalLinks: checked, result: 'Reader navigation, citations, source returns, deployment roots, and retained qualifications passed'}));
