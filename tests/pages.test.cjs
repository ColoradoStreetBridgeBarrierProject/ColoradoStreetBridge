'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pages=['','timeline/','alternatives-studied/','evidence-and-limits/','who-said-what/','meetings-and-documents/','news-and-commentary/','search/','about/',...['netting','landscaping','staffing','technology'].map(key=>'alternatives-studied/'+key+'/')];
const noop=()=>{};
function load(url,html){
  const nodes={},events={};
  const node=key=>nodes[key]??={innerHTML:'',value:'',dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},addEventListener:noop,querySelector:()=>node('heading'),querySelectorAll:()=>[],focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}};
  const links=[...html.matchAll(/<(a|img)\b([^>]+)>/g)].map(([,tag,attrs])=>{const element={...node('link-'+Object.keys(nodes).length),tagName:tag.toUpperCase(),attributes:{}};for(const [,name,value] of attrs.matchAll(/([\w-]+)="([^"]*)"/g))element.attributes[name]=value.replaceAll('&amp;','&');return element;});
  const document={getElementById:node,querySelector:node,querySelectorAll:selector=>selector==='a[href],img[src]'?links:[],createElement:()=>({innerHTML:'',querySelectorAll:()=>[]}),addEventListener:(name,fn)=>{events[name]=fn;},documentElement:{dataset:{siteRoot:html.match(/data-site-root="([^"]+)"/)[1]},style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop}}};
  const context={document,location:new URL(url),URL,URLSearchParams,addEventListener:(name,fn)=>{events[name]=fn;},history:{pushState(_,__,href){context.location=new URL(href,context.location);}}};
  vm.createContext(context);vm.runInContext(read('assets/guide.js'),context);
  return {context,nodes,events,links,run:code=>vm.runInContext(code,context)};
}
let checkedLinks=0;
for(const base of ['https://coloradostreetbridgeproject.com/','https://example.org/ColoradoStreetBridge/']){
 for(const page of pages){
  const html=read(page+'index.html');
  const url=base+page;
  assert(!/__[A-Z_]+__/.test(html));
  assert(html.includes('rel="canonical" href="https://coloradostreetbridgeproject.com/'+page+'"'));
  assert(!html.includes('role="tab"'),'Navigation is ordinary links');
  assert.equal((html.match(/data-view="/g)||[]).length,7);
  assert.equal((html.match(/data-view="[^"]+" aria-current="page"/g)||[]).length,['search/','about/'].includes(page)?0:1);
  assert.equal(/class="intro"[^>]+ hidden/.test(html),page!=='');
  assert(html.includes('mailto:contact@coloradostreetbridgeproject.com'));
  assert(html.includes('href="tel:988"'));
  assert(html.includes('data-route="about">About</a>'),'Every footer must retain About');
  assert(!html.includes('data-route="changes">Changes</a>'),'The Changes link must not appear in the footer');
  const app=load(url,html),route=JSON.parse(app.run('JSON.stringify(readRoute())'));
  const prefix=page?'../'.repeat(page.split('/').filter(Boolean).length):'./';
  const expected=app.run('viewMarkup(readRoute())').replace(/<h([12])>/,'<h$1 id="view-heading">').replace(new RegExp('(?:href|src)="'+new URL(base).pathname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?!/)','g'),(match)=>match.startsWith('src')?'src="'+prefix:'href="'+prefix);
  assert(html.includes(expected),page+': static content differs from the interactive renderer');
  assert.equal(app.run('siteBase'),new URL(base).pathname,page+': deployment root');
  if(page.startsWith('alternatives-studied/')&&page.split('/')[1])assert.equal(route.arg,page.split('/')[1]);
  for(const [,attr,raw] of html.matchAll(/(href|src)="([^"]+)"/g)){
   const value=raw.replaceAll('&amp;','&');
   if(/^(?:https?:|data:|mailto:|tel:)/.test(value))continue;
   const resolved=new URL(value,url);
   assert(resolved.pathname.startsWith(new URL(base).pathname),page+': escaped project root '+value);
   const file=resolved.pathname.slice(new URL(base).pathname.length);
   const target=path.join(root,file.endsWith('/')?file+'index.html':file);
   assert(fs.existsSync(target),page+': broken '+attr+' '+value);
   checkedLinks++;
  }
  const persistent=app.links.filter(link=>link.attributes['data-view']);
  const before=persistent.map(link=>link.attributes.href);
  app.run('navigate("timeline")');
  app.run('navigate("alternatives/landscaping")');
  app.run('navigate("overview")');
  assert.deepEqual(persistent.map(link=>link.attributes.href),before,'Persistent links changed after history navigation');
  assert(before.every(href=>href.startsWith(new URL(base).pathname)),'Persistent links must be rooted');
  const previous=base+'who-said-what/';
  app.context.location=new URL(previous);app.events.popstate();
  assert.equal(app.run('readRoute().view'),'speakers','Back/forward must read the pathname');
  assert.equal((app.nodes.content.innerHTML.match(/class="remark-card"/g)||[]).length,75);
  const beforeClick=app.context.location.href;
  app.events.click({ctrlKey:true,target:{closest(){throw new Error('Modified click was intercepted');}}});
  assert.equal(app.context.location.href,beforeClick);
 }
}
const overview=read('index.html');
assert(!overview.includes('Research baseline:'));
assert(!overview.includes('Later source checks are identified with the material they support.'));
assert(overview.includes('Last updated September 22, 2026'));
for(const [legacy,view,id] of [['#timeline/2020-02-03','timeline'],['#speakers/delgado/delgado-cacti','speakers','delgado-cacti'],['#meetings/meeting-2024-01-09','meetings','meeting-2024-01-09'],['#news/lat-1989','news','lat-1989'],['#alternatives/landscaping','alternatives']]){
 const app=load('https://coloradostreetbridgeproject.com/'+legacy,overview);
 assert.equal(app.run('readRoute().view'),view,'Legacy route '+legacy);
 if(id)assert(app.nodes[id].scrolled,'Legacy entry focus '+id);
}
const who=read('who-said-what/index.html');
// Skip links must move focus without changing routes, results, or active filters.
const skipCases=[
 ['#meetings/source-folder','index.html'],
 ['#speakers/delgado/delgado-cacti','index.html'],
 ['who-said-what/#speakers/all?topic=netting&year=2024','who-said-what/index.html'],
 ['meetings-and-documents/#meetings?year=2024&order=newest','meetings-and-documents/index.html'],
 ['search/#search?q=netting','search/index.html'],
 ['timeline/#timeline/2020-02-03','timeline/index.html'],
 ['about/','about/index.html']
];
for(const base of ['https://coloradostreetbridgeproject.com/','https://example.org/ColoradoStreetBridge/']){
 for(const [suffix,file] of skipCases){
  const app=load(base+suffix,read(file));
  const before={url:app.context.location.href,route:app.run('JSON.stringify(readRoute())'),html:app.nodes.content.innerHTML};
  app.nodes.content.focused=false;app.nodes.content.scrolled=false;
  app.run('menuOpen=true');
  let prevented=false;
  app.events.click({button:0,target:{closest:selector=>selector==='a.skip[href="#content"]'?{}:null},preventDefault(){prevented=true;}});
  assert(prevented,'Skip link must prevent a hash-route change: '+suffix);
  assert.equal(app.context.location.href,before.url,'Skip must preserve the complete URL');
  assert.equal(app.run('JSON.stringify(readRoute())'),before.route,'Skip must preserve filters and search');
  assert.equal(app.nodes.content.innerHTML,before.html,'Skip must not replace content or reset disclosures');
  assert(app.nodes.content.focused&&app.nodes.content.scrolled,'Skip must focus and reveal the reading area');
  assert.equal(app.run('menuOpen'),false,'Skip must close an open phone menu');
 }
 const process=load(base+'timeline/#timeline/who-decides',read('timeline/index.html'));
 const disclosure={tagName:'DETAILS',open:false,parentElement:null};
 process.nodes['who-decides'].tagName='DETAILS';
 process.nodes['who-decides'].open=false;
 process.nodes['who-decides'].parentElement=disclosure;
 process.run('render(true)');
 assert.equal(process.run('readRoute().view'),'timeline');
 assert(process.nodes['who-decides'].focused&&process.nodes['who-decides'].scrolled);
 assert(disclosure.open,'The decision-process search destination must reveal its explanation');
 assert(process.nodes['who-decides'].open,'Direct disclosure destinations must open and keep their summary in view');
}
assert(read('preserved-records/tables.html').includes('href="../meetings-and-documents/#source-folder"'));
assert(read('index.template.html').includes('class="skip" href="#content"'),'Native skip fallback must remain available');
console.log('Skip-link route/filter preservation and decision-process destination checks passed');
const about=read('about/index.html');
assert(!about.includes('Updating the website does not mean every claim has been checked again.'));
assert(!about.includes('Please identify the passage and include a supporting source when available.'));
assert(about.includes('whether they support or challenge the guide’s reading'));
assert(!fs.existsSync(path.join(root,'changes/index.html')),'The Changes page must not be published');
assert(!read('assets/guide.js').includes('Changes to this guide'),'Removed page content must not remain in the bundle');
assert(!read('sitemap.xml').includes('/changes/'),'Removed page must not remain in the sitemap');
const removedRoute=load('https://coloradostreetbridgeproject.com/#changes',overview);
assert.equal(removedRoute.run('readRoute().view'),'overview','Old hash links must not render the removed page');
assert.equal(removedRoute.run('Object.hasOwn(sectionPaths,"changes")'),false);
assert.equal(removedRoute.run('typeof changesView'),'undefined');
assert.equal((who.match(/class="remark-card"/g)||[]).length,75);
assert.equal((read('meetings-and-documents/index.html').match(/class="directory-card"/g)||[]).length,34);
assert.equal((read('news-and-commentary/index.html').match(/class="directory-card news-card"/g)||[]).length,8);
for(const page of pages)assert(!/star[\s\u2010-\u2015-]*news|pasadenastarnews|psn-2018-barriers|psn-2018-fence|psn-2020/i.test(read(page+'index.html')),page+': excluded publisher returned');
assert(read('timeline/index.html').includes('committee received and filed'));
assert(read('evidence-and-limits/index.html').includes('$2,874,000'));
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,14);
assert(read('sitemap.xml').includes('/preserved-records/tables.html'));
assert(read('robots.txt').includes('Sitemap: https://coloradostreetbridgeproject.com/sitemap.xml'));
console.log(JSON.stringify({staticPages:pages.length,deploymentBases:2,checkedLinks,legacyRoutes:5,checks:'shared static content, relative assets and navigation, direct loads, alternatives, back/forward, modified clicks, full record counts, email, 988, canonical URLs, and sitemap passed'}));

for(const page of pages){
 const html=read(page+'index.html');
 assert(html.includes('property="og:title"'));
 assert(html.includes('property="og:image:alt"'));
 const body=html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
 const headings=[...body.matchAll(/<h([1-6])\b/g)].map(m=>+m[1]);
 assert(headings.every((h,i)=>!i||h<=headings[i-1]+1),page+': heading level jump');
}
assert.equal((read('alternatives-studied/index.html').match(/<img src="[^"]*assets\/illustrations\/[^"]+\.jpeg/g)||[]).length,4);
const alternatives=read('alternatives-studied/index.html');
for(const [key,title] of Object.entries({netting:'Horizontal netting',landscaping:'Trees &amp; landscaping',staffing:'Staffing &amp; patrols',technology:'Cameras &amp; technology'})){
 const detail=read('alternatives-studied/'+key+'/index.html');
 assert(detail.includes('<h1 id="view-heading">'+title+'</h1>'),key+': topic-specific heading');
 assert(!detail.includes('Start with the upright barrier designs.'),key+': overview instructions must not appear on a detail page');
}
assert(alternatives.includes('Start with the upright barrier designs.'));
assert(alternatives.includes('href="../alternatives-studied/#other-approaches"'));
assert(alternatives.includes('id="other-approaches" class="scroll-focus" tabindex="-1"'));
for(const base of ['https://coloradostreetbridgeproject.com/','https://example.org/ColoradoStreetBridge/']){
 const app=load(base+'alternatives-studied/#other-approaches',alternatives);
 assert.equal(app.run('readRoute().view'),'alternatives');
 assert.equal(app.run('readRoute().anchor'),'other-approaches');
 assert(app.nodes['other-approaches'].scrolled&&app.nodes['other-approaches'].focused,'Gallery shortcut must focus and scroll to the approaches');
}
const galleryRule=read('styles.css').match(/\.design-grid img\s*\{([^}]+)\}/)[1];
assert(/aspect-ratio:\s*4\s*\/\s*3/.test(galleryRule),'Equal illustration frames');
assert(/object-fit:\s*contain/.test(galleryRule),'Never crop design evidence');
assert(read('preserved-records/tables.html').includes('aria-label="Guide sections"'));
console.log('Audit static metadata, illustrations, and heading checks passed');

// Metadata must follow navigation, including search and browser history.
const metadataApp=load('https://coloradostreetbridgeproject.com/',overview);
function assertMetadata(app,description,title,canonical,robots='index, follow'){
 assert.equal(app.context.document.title,title);
 for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(app.nodes[selector].attributes.content,description,selector);
 for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])assert.equal(app.nodes[selector].attributes.content,title,selector);
 assert.equal(app.nodes['link[rel="canonical"]'].attributes.href,canonical);
 assert.equal(app.nodes['meta[property="og:url"]'].attributes.content,canonical);
 assert.equal(app.nodes['meta[name="robots"]'].attributes.content,robots);
}
for(const [route,page] of [['alternatives/landscaping','alternatives-studied/landscaping/'],['evidence/funding','evidence-and-limits/'],['search','search/'],['overview','']]){
 metadataApp.run('navigate('+JSON.stringify(route)+')');
 const html=read(page+'index.html');
 const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');
 const desc=decode(html.match(/name="description" content="([^"]+)"/)[1]);
 const title=decode(html.match(/<title>([^<]+)<\/title>/)[1]);
 assertMetadata(metadataApp,desc,title,'https://coloradostreetbridgeproject.com/'+page,page==='search/'?'noindex, follow':'index, follow');
}
metadataApp.context.location=new URL('https://coloradostreetbridgeproject.com/alternatives-studied/staffing/');metadataApp.events.popstate();
assertMetadata(metadataApp,'Compare the Colorado Street Bridge discussions of patrols, staffing costs, response time, and the limits of continuous coverage.','Colorado Street Bridge Project Guide | Staffing & patrols','https://coloradostreetbridgeproject.com/alternatives-studied/staffing/');
assert.equal((alternatives.match(/class="approach-card"/g)||[]).length,4);
assert(!alternatives.includes('aria-current="page">Horizontal netting'),'Overview must not silently select one alternative');
assert.equal((who.match(/class="earlier-work"/g)||[]).length,75,'Keep every earlier-work passage in an accessible disclosure');
assert(who.includes('Jump to a date'));
assert(!who.includes('for this website update'),'Routine update history belongs in the internal handoff');
assert(!who.includes('No new listening'));
for(const page of pages)assert(!/#page=\d+#page=/.test(read(page+'index.html')),'Duplicate PDF fragment on '+page);
const filtered=metadataApp.run('speakerView("jones","staffing","2024")');
assert(filtered.includes('Clear filters'));assert(filtered.includes('data-route="speakers"'));
const directory=read('meetings-and-documents/index.html');
assert(directory.indexOf('id="meeting-year"')<directory.indexOf('id="source-folder"'));
assert(metadataApp.run('meetingsView("2024","newest")').includes('Reset filters'));
console.log('Route metadata, excerpt preservation, meeting navigation, and disclosure checks passed');

const recordsPage=read("preserved-records/index.html");
assert(recordsPage.includes("<h1>Preserved City records</h1>"));
assert(read("sitemap.xml").includes("https://coloradostreetbridgeproject.com/preserved-records/</loc>"));
for(const item of JSON.parse(read("preserved-records/city-records-manifest.json")))assert(recordsPage.includes(`href="${item.file}"`),item.file+": missing index link");
for(const page of [...pages.map(p=>p+"index.html"),"preserved-records/index.html"])assert(!/dropbox\.com|In that folder, select/.test(read(page)),page+": obsolete Dropbox destination");
