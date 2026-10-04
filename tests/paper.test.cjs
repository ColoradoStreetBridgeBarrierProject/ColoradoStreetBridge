'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const paper = JSON.parse(read('paper/content.json'));
const routes = paper.sections.map(s => 'paper/' + (s.slug ? s.slug + '/' : ''));
const files = [...routes, 'paper/all/', 'paper/sources/'].map(route => route + 'index.html');
const rendered = new Map(files.map(file => [file, read(file)]));
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const decode = text => text.replaceAll('&amp;', '&');
assert.equal(routes.length, 13);
assert.equal((rendered.get('paper/sources/index.html').match(/class="csb-source"/g) || []).length, 50);
assert.equal((paper.sources.match(/data-docx-paragraph=/g) || []).length,
  (rendered.get('paper/sources/index.html').match(/data-docx-paragraph=/g) || []).length);
let citations = 0, checked = 0, images = 0;
for (const [file, html] of rendered) {
  assert.equal(new Set(ids(html)).size, ids(html).length, file + ': duplicate IDs');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, file + ': one page heading');
  assert(!/\bhidden(?:="")?[^>]*data-csb-chapter|data-csb-chapter|guide\.js/.test(html), file + ': no embedded chapter switching');
  assert(!/sandbox:|\/workspace\/|libfile_|file_000000|data:image|private preview/.test(html), file + ': no internal references');
  assert(html.includes('href="tel:988"'));
  assert(html.includes('The main research review covers material through September 1, 2026. Later checks and additions are dated where they appear.'));
  assert(html.includes('not an official City website'));
  assert(html.includes('property="og:site_name"'));
  assert(html.includes('name="twitter:card"'));
  for (const [,id,href] of html.matchAll(/<a class="csb-cite" id="([^"]+)" href="([^"]+)"/g)) {
    assert(!href.includes('?'), 'Citations use one canonical Sources URL');
    const source = href.match(/#csb-source-(\d+)$/)[1];
    const entry = rendered.get('paper/sources/index.html').split('<div id="csb-source-'+source+'"')[1].split('</div>')[0];
    assert(entry.includes('../../' + file.replace('index.html', '') + '#' + id), 'Each source retains the exact citing passage');
  }
  const contents = html.match(/<nav aria-label="Paper contents">([\s\S]*?)<\/nav>/)[1];
  assert.equal((contents.match(/<li>/g)||[]).length,13,'Sources is separate from the 13 numbered sections');
  assert(contents.indexOf('contents-sources')>contents.indexOf('</ol>'));
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
assert.equal(images, 20,'The same ten images appear in both reading formats');
const continuous=rendered.get('paper/all/index.html');
assert.equal((continuous.match(/class="csb-cite"/g)||[]).length,citations/2,'Every chapter citation appears in the continuous edition');
assert.equal((continuous.match(/class="continuous-section"/g)||[]).length,13);
assert(!continuous.includes('class="csb-source"'),'Sources stay on their own page');
assert(continuous.includes('By Christopher Clark'));
assert(continuous.includes('About '+require('../scripts/paper-data.cjs').readingMinutes+' minutes, excluding Sources'));
assert(rendered.get('paper/index.html').includes('href="../paper/all/#paper-top">Read on one page'),'Opening the continuous edition starts at its title');
assert(continuous.includes('href="#paper-top"><span>↑ Beginning</span>'),'Continuous beginning link stays in the continuous edition');

for(const section of paper.sections){
 const key=section.slug||'opening';assert(continuous.includes('id="section-'+key+'"'));
 for(const [,id] of section.html.matchAll(/\bid="([^"]+)"/g))assert(continuous.includes('id="all-'+key+'-'+id+'"'),'Continuous reading preserves a unique form of each passage/citation ID');
}
assert(citations > 380);
assert(rendered.get('paper/2018-2019/index.html').includes('provided the City approved additional construction funding'));
assert(rendered.get('paper/forecasts/index.html').includes('October – December 2025, then January – March 2026, and then April – June 2026'));
assert(routes.indexOf('paper/questions/') === routes.indexOf('paper/2024/') + 1);
assert(routes.indexOf('paper/forecasts/') === routes.indexOf('paper/2025-2026/') + 1);
assert(!rendered.get('paper/questions/index.html').includes('rescue cushion'));
assert.equal(paper.sections.filter(s => s.table).length, 2);
assert(read('paper/reader.css').includes('.csb-table { font:inherit;'));
// Exercise citation return behavior with real generated links, including storage
// failures, prior shared URLs, hash navigation, and back/forward restoration.
const sampleHref = 'https://example.org/ColoradoStreetBridge/paper/2024/#citation-2';
function returnContext({url='https://example.org/ColoradoStreetBridge/paper/sources/#csb-source-21', stored, blocked=false, target=sampleHref, citeId='citation-2'}={}) {
  const events={}, storage=new Map(stored ? [['csb-paper-return:csb-source-21',stored]] : []);
  const back={hidden:true,setAttribute(k,v){this[k]=v;}};
  const fallback={href:target,getAttribute(){return target;}};
  const source={id:'csb-source-21',classList:{contains:()=>true},querySelectorAll:()=>[fallback],querySelector:()=>back};
  const citation={href:'https://example.org/ColoradoStreetBridge/paper/sources/#csb-source-21',id:citeId,addEventListener(k,fn){this[k]=fn;}};
  const context={URL,URLSearchParams,location:new URL(url),sessionStorage:{getItem(k){if(blocked)throw Error('Denied');return storage.get(k);},setItem(k,v){if(blocked)throw Error('Denied');storage.set(k,v);}},addEventListener(k,fn){events[k]=fn;},document:{querySelectorAll(s){return s==='.csb-cite'?[citation]:[back];},getElementById(id){return id===source.id?source:null;}}};
  vm.runInNewContext(read('paper/sources.js'),context);
  return {context,back,citation,events,storage};
}
const expected = '/ColoradoStreetBridge/paper/2024/#citation-2';
const active=returnContext({stored:expected});assert(!active.back.hidden);assert.equal(active.back.href,sampleHref);
active.context.location.hash='';active.events.hashchange();assert(active.back.hidden);
active.context.location.hash='#csb-source-21';active.events.pageshow();assert(!active.back.hidden);
const reader=returnContext({url:sampleHref});reader.citation.click();assert.equal(reader.storage.get('csb-paper-return:csb-source-21'),expected);
for(const options of [{blocked:true},{stored:'/other-site/#citation-2'},{url:'https://example.org/ColoradoStreetBridge/paper/sources/?from=../../other&cite=citation-2#csb-source-21'}])assert(returnContext(options).back.hidden);
const denied=returnContext({url:sampleHref,blocked:true});assert.doesNotThrow(()=>denied.citation.click());
const legacy=returnContext({url:'https://example.org/ColoradoStreetBridge/paper/sources/?from=2024&cite=citation-2#csb-source-21'});assert(!legacy.back.hidden);assert.equal(legacy.back.href,sampleHref);
const continuousId=continuous.match(/id="([^"]+)" href="\.\.\/\.\.\/paper\/sources\/#csb-source-21"/)[1];
const fullTarget='https://example.org/ColoradoStreetBridge/paper/all/#'+continuousId;
const full=returnContext({url:fullTarget,target:fullTarget,citeId:continuousId});full.citation.click();
const fullReturn=returnContext({stored:full.storage.get('csb-paper-return:csb-source-21'),target:fullTarget});assert(!fullReturn.back.hidden);assert.equal(fullReturn.back.href,fullTarget,'Return stays in the continuous edition at the exact citation');
console.log(JSON.stringify({readingSections: 13, sourceEntries: 50, images, citations, checkedLocalLinks: checked, result: 'Reader navigation, citations, source returns, deployment roots, and retained qualifications passed'}));
