'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {secureHtml} = require('./security.cjs');
const root = path.resolve(__dirname, '..');
const {paper, readingMinutes} = require('./paper-data.cjs');
const esc = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const version = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 12);
const sectionPath = section => 'paper/' + (section.slug ? section.slug + '/' : '');
const references = new Map();

// A citation has a stable address in its section. The Sources page also provides
// ordinary return links, so the whole reading path works without JavaScript.
paper.sections.forEach((section,index) => { section.number=index+1; });
const sectionKey = section => section.slug || 'opening';
function renderSection(section, continuous=false) {
  const prefix = continuous || section.slug ? '../../' : '../';
  let html=section.html;
  if (continuous) {
    const ids=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],'all-'+sectionKey(section)+'-'+m[1]]));
    html=html.replace(/\bid="([^"]+)"/g,(_,id)=>'id="'+ids.get(id)+'"')
      .replace(/\b(aria-describedby|aria-labelledby)="([^"]+)"/g,(_,attr,value)=>attr+'="'+value.split(' ').map(id=>ids.get(id)||id).join(' ')+'"')
      .replace(/href="#([^"]+)"/g,(_,id)=>'href="#'+(ids.get(id)||id)+'"');
  }
  let occurrence = 0;
  const reservedIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  html = html.replace(/<a\b([^>]*class="csb-cite"[^>]*)>([\s\S]*?)<\/a>/g, (match, attrs, label) => {
    const source = attrs.match(/href="#csb-source-(\d+)"/)[1];
    let id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!id) {
      do { id = 'citation-' + (++occurrence); } while (reservedIds.has(id));
      reservedIds.add(id);
    }
    const href = prefix + 'paper/sources/#csb-source-' + source;
    if (!references.has(source)) references.set(source, []);
    references.get(source).push({path: continuous?'paper/all/':sectionPath(section), id, title: section.title, number: section.number, continuous});
    return '<a class="csb-cite" id="' + id + '" href="' + href + '" aria-label="Source ' + source + '">' + label + '</a>';
  }).replaceAll('ASSET_ROOT', prefix);
  html = html.replace(/(<a class="csb-cite"[^>]*>[\s\S]*?<\/a>)\s*(?=<a class="csb-cite")/g, '$1<span class="citation-separator">,</span>');
  html = html.replace(/<img\b([^>]*class="csb-book-image"[^>]*)>/g, (image, attrs) => {
    const src = attrs.match(/src="([^"]+)"/)[1];
    return `<a class="paper-image-link" href="${src}" target="_blank" rel="noopener noreferrer" aria-label="Open figure at full size">${image}</a><a class="paper-image-open" href="${src}" target="_blank" rel="noopener noreferrer">Open image</a>`;
  });
  // The existing manuscript heading becomes the page heading.
  if (!continuous) html = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/, '<h1$1>$2</h1>').replace(/<(\/?)h3\b/g, '<$1h2');
  return html;
}

function contents(current, prefix, continuous=false) {
  return `<details class="paper-contents"><summary>Contents <span>${continuous?'All 13 sections':current ? 'Section ' + current + ' of ' + paper.sections.length : 'Sources'}</span></summary><nav aria-label="Paper contents"><ol>${paper.sections.map(s => `<li><a href="${continuous?'#section-'+sectionKey(s):prefix+sectionPath(s)+'#paper-top'}"${!continuous && s.number === current ? ' aria-current="page"' : ''}>${esc(s.title)}</a></li>`).join('')}</ol><a class="contents-sources" href="${prefix}paper/sources/#paper-top"${!current && !continuous ? ' aria-current="page"' : ''}>Sources</a></nav></details>`;
}

function pageHtml({route, current, title, content, table = false, continuous=false}) {
  const prefix = '../'.repeat(route.split('/').filter(Boolean).length);
  const canonical = 'https://coloradostreetbridgeproject.com/' + route;
  const description = current === 1 || continuous ? 'An analytical history of Pasadena’s Colorado Street Bridge barrier project, by Christopher Clark, with linked sources.' : title + ' · The fence everyone can see, an analytical history of the Colorado Street Bridge barrier project.';
  const previous = current > 1 ? paper.sections[current - 2] : null;
  const next = current && current < paper.sections.length ? paper.sections[current] : null;
  return secureHtml(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#182021">
  <meta name="color-scheme" content="dark light">
  <title>${esc(title)} | ${current === 1 ? 'Colorado Street Bridge' : esc(paper.title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Colorado Street Bridge Project Guide">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://coloradostreetbridgeproject.com/bridge-preview.webp">
  <meta property="og:image:width" content="620">
  <meta property="og:image:height" content="250">
  <meta property="og:image:alt" content="Colorado Street Bridge after its 1993 restoration, BCA Associates.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="https://coloradostreetbridgeproject.com/bridge-preview.webp">
  <meta name="twitter:image:alt" content="Colorado Street Bridge after its 1993 restoration, BCA Associates.">
  <script src="${prefix}theme.js?v=${version('theme.js')}"></script>
  <link rel="stylesheet" href="${prefix}paper/reader.css?v=${version('paper/reader.css')}">
  <script src="${prefix}paper/sources.js?v=${version('paper/sources.js')}" defer></script>
</head>
<body id="paper-top">
  <a class="skip" href="#reading">Skip to reading</a>
  <header class="site-head"><a href="${prefix}">Colorado Street Bridge <span>Project guide</span></a><button type="button" class="theme-toggle" data-theme-toggle aria-label="Light reading mode" aria-pressed="false" hidden>Light reading mode</button></header>
  <div class="paper-shell${table ? ' table-page' : ''}${continuous?' continuous-paper':''}">
    <div class="paper-orientation"><a href="${prefix}paper/#paper-top">${esc(paper.title)}</a><span>${continuous?'Continuous edition':current ? 'Section ' + current + ' of ' + paper.sections.length : 'Sources'}</span></div>
    ${contents(current, prefix, continuous)}
    <nav class="reading-options" aria-label="Reading format">${continuous?`<span>Reading on one page</span><a href="${prefix}paper/#paper-top">Read by chapter</a>`:`<a href="${prefix}paper/all/#${current>1?'section-'+sectionKey(paper.sections[current-1]):'paper-top'}">Read on one page</a>`}</nav>
    <main id="reading" tabindex="-1" class="paper-copy">
      ${current === 1 || continuous ? `<header class="paper-title"><p class="eyebrow">An analytical history</p><h1>${esc(paper.title)}</h1><p class="byline">By ${esc(paper.author)}</p><p class="edition">Reading edition · ${paper.edition} · About ${readingMinutes} minutes, excluding Sources</p><p class="research-scope">Main research cutoff: ${paper.evidenceCutoff}. Later checks and additions are dated where they appear.</p></header>` : ''}
      ${content}
    </main>
    <nav class="pagination" aria-label="Paper pages">
      ${previous ? `<a rel="prev" href="${prefix}${sectionPath(previous)}#paper-top"><span>← Previous</span><small>${esc(previous.title)}</small></a>` : `<a href="${continuous?'#paper-top':prefix+'paper/#paper-top'}"><span>↑ Beginning</span><small>${esc(paper.title)}</small></a>`}
      ${next ? `<a rel="next" href="${prefix}${sectionPath(next)}#paper-top"><span>Next →</span><small>${esc(next.title)}</small></a>` : current || continuous ? `<a rel="next" href="${prefix}paper/sources/#paper-top"><span>Next →</span><small>Sources</small></a>` : `<a rel="prev" href="${prefix}paper/in-memory/#paper-top"><span>← Previous</span><small>In memory</small></a>`}
    </nav>
    <footer class="paper-footer"><p>${current ? 'Section ' + current + ' of ' + paper.sections.length + ' · ' : ''}<a href="${prefix}paper/sources/">Sources</a> · <a href="#paper-top">Back to top</a></p><p>Reading edition · ${paper.edition}. Main research cutoff: ${paper.evidenceCutoff}. Later checks and additions are dated where they appear.</p><p>This is an independent research project, not an official City website.</p><p><a href="${prefix}about/">About the guide</a> · <a href="mailto:contact@coloradostreetbridgeproject.com">Questions or corrections</a></p><p>If you or someone you know is struggling or in crisis, call or text <a href="tel:988">988</a>.</p></footer>
  </div>
</body>
</html>
`.replace(/[ \t]+$/gm, ''));
}

function buildPaper() {
  references.clear();
  const output = [];
  for (const section of paper.sections) {
    output.push({path: sectionPath(section), html: pageHtml({route: sectionPath(section), current: section.number, title: section.number === 1 ? paper.title : section.title, content: renderSection(section), table: section.table})});
  }
  const continuous=paper.sections.map(section=>`<section class="continuous-section" id="section-${sectionKey(section)}" aria-label="${esc(section.title)}"><p class="section-marker">Section ${section.number} of 13 · <a href="../../${sectionPath(section)}#paper-top">Open chapter</a></p>${section.number===1?'<h2>'+esc(section.title)+'</h2>':''}${renderSection(section,true)}</section>`).join('\n');
  output.push({path:'paper/all/',html:pageHtml({route:'paper/all/',title:paper.title+' · Read on one page',content:continuous,continuous:true})});
  let sources = paper.sources.replace(/(<div id="csb-source-(\d+)" class="csb-source">)([\s\S]*?)(?=<div id="csb-source-|$)/g, (match, open, number, rest) => {
    // Insert return links before this source's own closing div, never into its note.
    const refs = references.get(number) || [];
    const counts = new Map();
    const links = refs.map(r => {
      const group=r.path+r.number;
      counts.set(group, (counts.get(group) || 0) + 1);
      return `<li><a href="../../${r.path}#${r.id}" data-citation-return>${r.continuous?'One page · ':''}Section ${r.number} · ${esc(r.title)}${refs.filter(x => x.path === r.path && x.number === r.number).length > 1 ? ' · reference ' + counts.get(group) : ''}</a></li>`;
    }).join('');
    const returns = `<a class="return-to-passage" data-return-to-passage hidden>Return to passage ↑</a><details class="source-passages"><summary>Passages citing this source</summary><ul>${links}</ul></details>`;
    return open + rest.replace('</div>', returns + '</div>');
  });
  sources = '<h1>Sources</h1>' + sources;
  output.push({path: 'paper/sources/', html: pageHtml({route: 'paper/sources/', title: 'Sources', content: sources})});
  for (const page of output) {
    const target = path.join(root, page.path, 'index.html');
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, page.html);
  }
  return output;
}
module.exports = {buildPaper};
