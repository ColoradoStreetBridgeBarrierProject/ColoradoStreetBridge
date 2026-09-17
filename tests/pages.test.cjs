'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pages=['','timeline/','alternatives-studied/','evidence-and-limits/','who-said-what/','meetings-and-documents/','news-and-commentary/','search/','about/','changes/',...['netting','landscaping','staffing','technology'].map(key=>'alternatives-studied/'+key+'/')];
const noop=()=>{};
function load(url,html){
  const nodes={},events={};
  const node=key=>nodes[key]??={innerHTML:'',value:'',dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},addEventListener:noop,querySelector:()=>node('heading'),querySelectorAll:()=>[],focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}};
  const links=[...html.matchAll(/<(a|img)\b([^>]+)>/g)].map(([,tag,attrs])=>{const element={...node('link-'+Object.keys(nodes).length),tagName:tag.toUpperCase(),attributes:{}};for(const [,name,value] of attrs.matchAll(/([\w-]+)="([^"]*)"/g))element.attributes[name]=value.replaceAll('&amp;','&');return element;});
  const document={getElementById:node,querySelector:node,querySelectorAll:selector=>selector==='a[href],img[src]'?links:[],addEventListener:(name,fn)=>{events[name]=fn;},documentElement:{dataset:{siteRoot:html.match(/data-site-root="([^"]+)"/)[1]},style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop}}};
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
  assert.equal((html.match(/data-view="[^"]+" aria-current="page"/g)||[]).length,['search/','about/','changes/'].includes(page)?0:1);
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
  assert.equal((app.nodes.content.innerHTML.match(/class="remark-card"/g)||[]).length,71);
  const beforeClick=app.context.location.href;
  app.events.click({ctrlKey:true,target:{closest(){throw new Error('Modified click was intercepted');}}});
  assert.equal(app.context.location.href,beforeClick);
 }
}
const overview=read('index.html');
assert(!overview.includes('Research baseline:'));
assert(!overview.includes('Later source checks are identified with the material they support.'));
assert(overview.includes('Last updated September 17, 2026'));
for(const [legacy,view,id] of [['#timeline/2020-02-03','timeline'],['#speakers/delgado/delgado-cacti','speakers','delgado-cacti'],['#meetings/meeting-2024-01-09','meetings','meeting-2024-01-09'],['#news/lat-1989','news','lat-1989'],['#alternatives/landscaping','alternatives']]){
 const app=load('https://coloradostreetbridgeproject.com/'+legacy,overview);
 assert.equal(app.run('readRoute().view'),view,'Legacy route '+legacy);
 if(id)assert(app.nodes[id].scrolled,'Legacy entry focus '+id);
}
const who=read('who-said-what/index.html');
const about=read('about/index.html'),changes=read('changes/index.html');
assert(!about.includes('Updating the website does not mean every claim has been checked again.'));
assert(!about.includes('Please identify the passage and include a supporting source when available.'));
assert(about.includes('whether they support or challenge the guide’s reading'));
const changesBody=changes.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
assert.equal((changesBody.match(/<time /g)||[]).length,3);
assert(changesBody.includes('September 15, 2026'));
assert(changesBody.includes('September 16, 2026'));
assert(changesBody.includes('the committee’s recorded action.'));
assert(changesBody.includes('Retained the limits concerning outstanding commitments and federal ARPA accounting.'));
assert(!/floating|permanent pages|meeting-record explanation|<h[1-6]>\s*<\/h[1-6]>/.test(changesBody));
assert.equal((who.match(/class="remark-card"/g)||[]).length,71);
assert.equal((read('meetings-and-documents/index.html').match(/class="directory-card"/g)||[]).length,34);
assert.equal((read('news-and-commentary/index.html').match(/class="directory-card news-card"/g)||[]).length,8);
for(const page of pages)assert(!/star[\s\u2010-\u2015-]*news|pasadenastarnews|psn-2018-barriers|psn-2018-fence|psn-2020/i.test(read(page+'index.html')),page+': excluded publisher returned');
assert(read('timeline/index.html').includes('committee received and filed'));
assert(read('evidence-and-limits/index.html').includes('$2,874,000'));
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,13);
console.log(JSON.stringify({staticPages:pages.length,deploymentBases:2,checkedLinks,legacyRoutes:5,checks:'shared static content, relative assets and navigation, direct loads, alternatives, back/forward, modified clicks, full record counts, email, 988, canonical URLs, and sitemap passed'}));

for(const page of pages){
 const html=read(page+'index.html');
 assert(html.includes('property="og:title"'));
 assert(html.includes('property="og:image:alt"'));
 const body=html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
 const headings=[...body.matchAll(/<h([1-6])\b/g)].map(m=>+m[1]);
 assert(headings.every((h,i)=>!i||h<=headings[i-1]+1),page+': heading level jump');
}
assert.equal((read('alternatives-studied/index.html').match(/assets\/illustrations\/[^"]+\.jpeg/g)||[]).length,4);
const alternatives=read('alternatives-studied/index.html');
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
