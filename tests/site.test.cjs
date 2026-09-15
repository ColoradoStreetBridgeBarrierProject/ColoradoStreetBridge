const fs=require('fs'), vm=require('vm'), assert=require('assert'), path=require('path'), crypto=require('crypto');
const dir=path.resolve(__dirname,'..');
const listeners={}, elements={};
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
function node(id='') {return elements[id]??= {innerHTML:'',value:'',dataset:{view:'overview'},attributes:{},setAttribute(key,value){this.attributes[key]=value;},addEventListener(type,fn){listeners[id+':'+type]=fn;},querySelector(){return node('heading');},querySelectorAll(){return [];},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;this.headerAtScroll=cssProperties['--mobile-header-height'];}};}
const doc={getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(type,fn){listeners['document:'+type]=fn;},createElement:()=>({innerHTML:'',querySelectorAll(){return [...this.innerHTML.matchAll(/<(article|aside)\b[^>]*class="[^"]*feature-card[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>({textContent:strip(m[2]),querySelector:()=>({textContent:strip((m[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)||[])[1]||'Project overview')})}));}})};
const classes=new Set(),cssProperties={};
let headerHeight=68,headerWrites=0,heightReadLabels=[];
node('.topbar').getBoundingClientRect=()=>{heightReadLabels.push(node('mobile-view').textContent);return {height:headerHeight};};
doc.documentElement={style:{setProperty(name,value){cssProperties[name]=value;headerWrites++;}},classList:{add(name){classes.add(name);},remove(name){classes.delete(name);},toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}};
let resizeCallback,resizeTarget;
class TestResizeObserver{constructor(callback){resizeCallback=callback;}observe(target){resizeTarget=target;}}
const context={document:doc,location:{hash:''},URL,URLSearchParams,console,addEventListener(type,fn){listeners['window:'+type]=fn;},history:{pushState(_,__,hash){context.location.hash=hash;}}};
if(!process.argv.includes('--no-resize-observer'))context.ResizeObserver=TestResizeObserver;
vm.createContext(context);
const bundled=process.argv.includes('--bundle');
for(const name of bundled?['assets/guide.js']:['search.js','speakers.js','other-speakers.js','resources.js','app.js']) vm.runInContext(fs.readFileSync(dir+'/'+name,'utf8'),context,{filename:name});
const run=code=>vm.runInContext(code,context), json=code=>JSON.parse(run('JSON.stringify('+code+')'));
assert.equal(cssProperties['--mobile-header-height'],'68px','Initial render measures the mobile header');
if(context.ResizeObserver)assert.equal(resizeTarget,elements['.topbar']);
assert.equal(run('Object.keys(speakers).length'),4);
// Preserve the reviewed speaker and resource data during the hosting migration.
const preserved={
 'speakers.js':'222eb4f923658b098e7be0b5d8e952447da743fc1a0c6c0c0122612ff7484268',
 'other-speakers.js':'9dc05b4bf8aee88ae57ba47450ec66b6c03625dcab0fd347b7e3b1dc2d8f544e',
 'resources.js':'6f6827d51d2f04a68c14788ec6bbc91b47a9cc195dd0b8ae6c9f3e7615af9d95'
};
for(const [name,sha] of Object.entries(preserved))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex'),sha,name+': reviewed data changed');
assert.equal(run('Object.keys(otherSpeakers).length'),15);
assert.equal(run('speakerEntries().length'),71);
assert.equal(run('speakerEntries("other").length'),35);
const metadata=json('speakerEntries().map(x=>x.remark)'), ids=metadata.map(x=>x.id);
assert.equal(new Set(ids).size,71);
const written=metadata.filter(r=>!r.meeting);assert.equal(written.length,3);
for(const r of metadata){
 if(r.meeting)assert(r.time.match(/^\d{2}:\d{2}:\d{2}$/),r.id);else assert.equal(r.time,null);
 for(const field of ['earlier','response','outcome','context','basis','body','sortDate'])assert(r[field],r.id+':'+field);
 for(const l of r.links)assert(l.url||run(`Object.hasOwn(urls,${JSON.stringify(l.source)})`),r.id+':source');
}
let filters=0;
for(const key of ['all','other',...json('Object.keys(speakerDirectory)')])for(const topic of json('Object.keys(speakerTopics)')) {
 const list=json(`speakerEntries('${key}','${topic}')`),order=list.map(x=>x.remark.sortDate+' '+(x.remark.time||'00:00:00'));
 assert.deepEqual(order,[...order].sort());
 assert(list.every(x=>(key==='all'||key==='other'&&run(`Object.hasOwn(otherSpeakers,'${x.id}')`)||x.id===key)&&(topic==='all'||x.remark.topic===topic)));
 const html=run(`speakerView('${key}','${topic}')`);assert(!html.includes('undefined'));assert(!html.includes('go to null'));
 assert.equal((html.match(/class="remark-card"/g)||[]).length,list.length);filters++;
}
const meetings=json('meetingRecords'),news=json('newsRecords');assert.equal(meetings.length,34);assert.equal(news.length,11);
assert.deepEqual(meetings.map(m=>m.date),meetings.map(m=>m.date).sort());
for(const m of meetings)for(const l of m.links)assert(l.url||run(`Object.hasOwn(urls,${JSON.stringify(l.source)})`),m.id+':source');
for(const year of ['all',...new Set(meetings.map(m=>m.date.slice(0,4)))]){
 const html=run(`meetingsView('${year}')`);assert(!html.includes('undefined'));assert.equal((html.match(/class="directory-card"/g)||[]).length,meetings.filter(m=>year==='all'||m.date.startsWith(year)).length);
}
assert.equal((run('newsView()').match(/class="directory-card news-card"/g)||[]).length,11);
const index=json('searchIndex()');assert.equal(index.filter(x=>x.type==='Selected remark').length,71);
assert.equal(index.length,142,'February 2020 adds one timeline record');
assert(index.some(x=>x.route==='timeline/2020-02-03'));
assert.equal(run('timeline.find(t=>t.id==="4").date'),'Aug 2021','Existing numeric timeline links remain stable');
assert(run('steps(timeline,true)').includes('data-timeline-id="2020-02-03"'));
assert(run('steps(timeline,true)').includes('committee received and filed'));
assert(run('evidence()').includes('$130,000 on June 9 and $46,000 on July 21'));
assert(run('evidence()').includes('Staff said enough remained to finish design'));
assert(run('evidence()').includes('after outstanding commitments'));
assert(!run('evidence()').includes('A complete appropriation history has not been reconciled'));
assert(index.some(x=>x.title==='Height depends on the measurement point'),'Height comparison must be searchable');
assert(index.some(x=>x.title==='Option B led among respondents who ranked the mockups'));
assert(run('evidence()').includes('73324'));
assert(!run('evidence()').includes('Of 678 respondents'));
assert(run('overview()').includes('p. 184 excerpt'));
assert(run('overview()').includes('What alternatives were studied?'));
assert(run('speakerView()').includes('whether they support or challenge'));
assert(!run('timeline.find(t=>t.date==="Nov 2023").result').includes('meeting that timing milestone'));
assert.notEqual(run('reviewDates.baseline'),run('reviewDates.siteUpdated'));
const tablePage=fs.readFileSync(path.join(dir,'preserved-records/tables.html'),'utf8');
for(const id of ['survey-2021','police-2021','fiscal-2021','schedule-2022','finance-2026'])assert(tablePage.includes('id="'+id+'"'));
for(const item of JSON.parse(fs.readFileSync(path.join(dir,'preserved-records/manifest.json'),'utf8'))){
 const file=path.join(dir,'preserved-records',item.file);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),item.derivative_sha256,item.file+': preserved derivative changed');
 assert(item.source_url.startsWith('https://www.cityofpasadena.net/'));
}
assert.equal(index.filter(x=>x.type==='Overview').length,1,'Only the retained short-version card is indexed');
assert(!index.some(x=>x.title.includes('Three different decisions')),'Removed overview card must not appear in search');
assert.equal(index.filter(x=>x.type==='Meeting & documents').length,34);
for(const [q,want] of [['Delgado cacti','delgado-cacti'],['Kennedy','kennedy-review'],['Mermell three months','mermell-return'],['2019 minutes','meeting-2019-05-15'],['Dropbox','source-folder'],['Los Angeles Times','lat-2017'],['Kris','markarian-exhausted']]){
 const routes=json(`searchIndex().filter(i=>SearchText.score(i,SearchText.terms(${JSON.stringify(q)}))>0).map(i=>i.route)`);assert(routes.some(r=>r.endsWith('/'+want)),q);
}
for(const entry of index){context.location.hash='#'+entry.route;run('render()');assert(!elements.content.innerHTML.includes('href="undefined"'),entry.route);}
for(const hash of ['#speakers/other','#speakers/delgado?topic=netting','#meetings?year=2019','#meetings?year=unknown','#speakers/unknown','#news']){context.location.hash=hash;run('render()');}
context.location.hash='#speakers/delgado?topic=design';listeners['document:change']({target:{id:'other-speaker',value:'kennedy'}});assert.equal(context.location.hash,'#speakers/kennedy?topic=design');
listeners['document:change']({target:{id:'speaker-topic',value:'staffing'}});assert.equal(context.location.hash,'#speakers/kennedy?topic=staffing');
listeners['document:change']({target:{id:'meeting-year',value:'2024'}});assert.equal(context.location.hash,'#meetings?year=2024');
context.location.hash='#search?q=%3Cscript%3E';run('render()');assert(!elements.content.innerHTML.includes('<script>'));
const html=run('speakerView()+meetingsView()+newsView()');
assert(html.includes('class="source-label"'));
for(const m of html.matchAll(/href="([^"]+)"/g)){const href=m[1].replaceAll('&amp;','&');assert(href.startsWith('#')||href.startsWith('https://'),href);if(href.startsWith('https'))new URL(href);}
const page=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const styles=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
const styleBlocks=[...styles.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([,selectors,body])=>({selectors,body}));
const styleBlock=(...selectors)=>styleBlocks.find(block=>selectors.every(selector=>block.selectors.includes(selector)))?.body||'';
assert(fs.existsSync(path.join(dir,'.nojekyll')));
assert.strictEqual(fs.readFileSync(path.join(dir,'CNAME'),'utf8'),'coloradostreetbridgeproject.com','CNAME must preserve the configured custom domain');
assert(page.includes('Independent guide'));
assert(!page.includes('Private preview'));
assert(!page.includes('noindex'));
assert(!page.includes('<iframe'));
assert.equal((page.match(/<img /g)||[]).length,1);
assert(page.includes('src="bridge-preview.webp"'));
assert(!page.includes('src="bridge.jpeg"'));
assert(page.includes('class="figure-links"'));
assert(page.includes('class="footer-link"'));
assert(page.includes('class="source-link"'));
assert(!page.includes('return-tools'),'Floating control must not cover reading content');
assert(page.includes('aria-controls="site-sidebar"'));
assert(page.includes('name="color-scheme" content="dark"'));
assert(!page.includes('section-num'));
assert(!run('head("01","Title","Description")').includes('01'));
assert(styleBlock('.mobile-brand').includes('min-height: 44px'),'Mobile brand needs a 44px tap target');
assert(styleBlock('.menu-toggle').includes('flex: 0 0 auto'),'Menu button must not shrink around enlarged text');
assert(styleBlock('.menu-toggle').includes('white-space: nowrap'),'Menu label must stay on one line');
const mobileSidebar=styleBlocks.find(b=>b.selectors.trim()==='.site-sidebar'&&b.body.includes('display: none')).body;
assert(mobileSidebar.includes('top: var(--mobile-header-height,var(--mobile-header-fallback))'));
assert(mobileSidebar.includes('100dvh - var(--mobile-header-height,var(--mobile-header-fallback))'));
assert(styleBlock('.search-form','main','.scroll-focus').includes('scroll-margin-top: calc(var(--mobile-header-height,var(--mobile-header-fallback)) + 20px)'));
headerHeight=132.98;
(resizeCallback||listeners['window:resize'])();
assert.equal(cssProperties['--mobile-header-height'],'133px','Larger text updates the sticky offset');
const previousWrites=headerWrites;
listeners['window:resize']();assert.equal(headerWrites,previousWrites,'Unchanged height must not cause repeated style writes');
headerHeight=0;listeners['window:resize']();assert.equal(cssProperties['--mobile-header-height'],'0px','Desktop hidden header resets the measurement');
headerHeight=68;listeners['window:resize']();assert.equal(cssProperties['--mobile-header-height'],'68px');
headerHeight=133;
assert(styleBlock('.figure-links a','.source-link').includes('min-height: 44px'),'Key guide links need 44px tap targets');
assert(styleBlock('.footer-link').includes('min-height: 44px'),'The footer crisis link needs a 44px tap target');
listeners['menu-toggle:click']();assert(classes.has('menu-open'));assert.equal(elements['menu-toggle'].attributes['aria-expanded'],'true');
assert.equal(cssProperties['--mobile-header-height'],'133px','Opening the menu refreshes the offset synchronously');
listeners['.view-nav:keydown']({key:'ArrowDown',target:{closest:()=>({dataset:{view:'overview'}})},preventDefault(){}});
assert.equal(context.location.hash,'#timeline');assert(classes.has('menu-open'));assert(elements['tab-timeline'].focused);
listeners['document:keydown']({key:'Escape'});assert(!classes.has('menu-open'));assert.equal(elements['menu-toggle'].attributes['aria-expanded'],'false');assert(elements['menu-toggle'].focused);
listeners['menu-toggle:click']();headerHeight=165;run('navigate("meetings")');assert(!classes.has('menu-open'));assert.equal(elements['menu-toggle'].attributes['aria-expanded'],'false');assert(elements.content.focused);
assert.equal(elements['mobile-view'].textContent,'Meetings & documents');
assert.equal(heightReadLabels.at(-1),'Meetings & documents','Measure after updating the section label');
assert.equal(elements.content.headerAtScroll,'165px','Section scrolling uses the new header height without waiting for ResizeObserver');
headerHeight=166;run('navigate("meetings/meeting-2024-01-09")');
assert.equal(elements['meeting-2024-01-09'].headerAtScroll,'166px','Deep links use the measured header offset');
headerHeight=68;
elements.content.scrolled=false;
listeners['document:click']({target:{closest:selector=>selector==='[data-view]'?({dataset:{view:'news'},focus(){}}):null}});
assert.equal(context.location.hash,'#news');assert(elements.content.scrolled,'Persistent navigation must reveal the new section heading');
assert(!listeners['return-tools:click']);
assert.equal((page.match(/<script src=/g)||[]).length,1);
assert(page.includes(run('overview()').replace('<h2>','<h2 id="view-heading">')),'Static overview diverges from the interactive overview');
for(const html of [page,run('overview()')]){
 assert(!html.includes('Three different decisions'),'Removed card must not appear in either overview');
 assert(!html.includes('class="status-list"'),'Removed policy/design/construction list must not remain');
 assert(html.includes('THE SHORT VERSION'),'Keep the opening explanation');
 assert(!html.includes('A useful distinction'),'Removed note must not appear in either overview');
 assert(!html.includes('Repeated questions are documented.'),'Removed note body must not remain');
}
const overviewColumns=styleBlocks.filter(block=>block.selectors.includes('.overview-grid')&&block.body.includes('grid-template-columns')).map(block=>block.body.match(/grid-template-columns:\s*([^;]+)/)[1].trim());
assert(overviewColumns.length>0&&overviewColumns.every(value=>value==='minmax(0,1fr)'),'Overview must use one column at every breakpoint');
for(const [name,file] of [['SCRIPT','assets/guide.js'],['STYLE','styles.css']]){
 const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex').slice(0,12);
 assert(page.includes(file+'?v='+version),name+': cache version mismatch');
}
const base='https://example.org/ColoradoStreetBridge/';
for(const match of page.matchAll(/(?:src|href)="([^"]+)"/g)){
 const value=match[1];
 if(value.startsWith('#')||/^(https:|data:|tel:)/.test(value))continue;
 assert(!value.startsWith('/'),'Asset must work under the project path: '+value);
 assert(new URL(value,base).pathname.startsWith('/ColoradoStreetBridge/'));
 assert(fs.existsSync(path.join(dir,value.split('?')[0])),value);
}
const rootEntries=fs.readdirSync(dir,{withFileTypes:true});
const allowedVisibleEntries=new Set(['index.html','index.template.html','styles.css','search.js','speakers.js','other-speakers.js','resources.js','app.js','bridge-preview.webp','bridge.jpeg','README.md','CNAME','tests','scripts','assets','preserved-records']);
const allowedHiddenEntries=new Set(['.nojekyll']);
const ignoredHiddenEntries=new Set(['.DS_Store','.git']);
const visibleEntries=rootEntries.filter(entry=>!entry.name.startsWith('.')).map(entry=>entry.name);
const hiddenEntries=rootEntries.filter(entry=>entry.name.startsWith('.')).map(entry=>entry.name).filter(name=>!ignoredHiddenEntries.has(name));
assert.deepEqual(visibleEntries.filter(name=>!allowedVisibleEntries.has(name)),[],'Unexpected public files');
assert.deepEqual(hiddenEntries.filter(name=>!allowedHiddenEntries.has(name)),[],'Unexpected hidden public files');
for(const name of ['index.html','app.js','search.js','speakers.js','other-speakers.js','resources.js','README.md']){
 const text=fs.readFileSync(path.join(dir,name),'utf8');
 assert(!/sandbox:|\/workspace\/|libfile_|file_000000|chatgpt\.site/.test(text),name+': internal reference');
}
// Remove entry-sharing controls without removing records or existing deep-link routes.
for(const marker of ['data-copy-link','entry-sharing','entry-link','Copy link to this entry','Link to this article entry','Link to this meeting'])assert(!html.includes(marker),'Removed sharing control returned: '+marker);
assert.equal(run('typeof copyEntryLink'),'undefined');
assert.equal(run('typeof entryShare'),'undefined');
assert.equal((html.match(/class="remark-card"/g)||[]).length,71);
assert.equal((html.match(/class="directory-card(?: news-card)?"/g)||[]).length,45);
for(const [route,id] of [['news/lat-1989','lat-1989'],['meetings/meeting-2024-01-09','meeting-2024-01-09'],['speakers/delgado/delgado-cacti','delgado-cacti']]){
 run('navigate('+JSON.stringify(route)+')');
 assert(elements[id].focused&&elements[id].scrolled,'Existing entry route must still work: '+route);
}
// Editorial cleanup: retain the evidence while changing its presentation.
for(const view of ['overview','timeline','alternatives','evidence','speakers','meetings','news','search']){
 run('navigate('+JSON.stringify(view)+')');
 assert.equal(elements['.intro'].hidden,view!=='overview',view+': hero visibility');
 assert(elements.content.innerHTML.includes(view==='overview'?'<h2>':'<h1>'),view+': section heading');
}
assert(styleBlock('[hidden]').includes('display: none !important'),'Responsive display rules must not unhide the hero');
assert(run('speakerView()').includes('Other speakers <span>35 entries</span>'));
assert(run('speakerView("other")').includes('35 entries from 15 people'));
assert(!run('speakerView("madison")').includes('class="chronology-note"'));
assert(!run('speakerView("other")').includes('Remarks are included when'));
assert(run('speakerView()').includes('Remarks are included when'));
assert(run('searchView("final mesh type")').includes('timeline/2020-02-03'),'Search includes the February source note');
for(const r of metadata){
 const parts=json(`outcomeParts(${JSON.stringify(r)})`);
 const preservedText=[parts.event,parts.note].filter(Boolean).join(' ');
 assert.equal([...preservedText].sort().join(''),[...r.outcome].sort().join(''),r.id+': outcome text lost');
 if(parts.event)assert(/20\d\d/.test(parts.event),r.id+': What followed needs an explicit date');
 if(r.quote){
  const excerpt=run(`remarkExcerpt(${JSON.stringify(r)})`);
  assert(excerpt.includes(run(`esc(${JSON.stringify(r.quote)})`)),r.id+': excerpt changed');
  assert.equal(excerpt.includes('<blockquote>'),['Author-confirmed excerpt','Author-checked quotation'].includes(r.kind));
  assert(excerpt.includes('excerpt-verification'));
 }
}
assert(run('remarkExcerpt(speakers.jones.remarks.find(r=>r.id==="jones-continue"))').includes('author checked the speaker, passage, and locator'));
const aprilLinks=run('citations(7,"5–7",[["Council minutes",urls.m2018],["Task-force report",urls.r2018]])');
assert(!aprilLinks.includes('href="'+run('urls.m2018')+'"'));
assert(aprilLinks.includes('href="'+run('urls.m2018')+'#page=4"'));
const distinctPages=run('citations(1,"",[["Survey",urls.p2024+"#page=18"],["Commission feedback",urls.p2024+"#page=16"]])');
assert(distinctPages.includes('#page=18')&&distinctPages.includes('#page=16'),'Keep distinct cited page locators');
for(const url of ['#overview','bridge.jpeg','https://coloradostreetbridgeproject.com/preserved-records/tables.html'])assert(!run(`link("Test",${JSON.stringify(url)})`).includes('↗'));
assert(run('link("Test",urls.project)').includes('↗'));
assert(!run('overview()').includes('More supporting records'),'A single extra source stays visible');
assert(!run('overview()').includes('stands in the record'));
assert(run('overview()').includes('September 2018'));
assert(run('overview()').includes('records reviewed for this guide'));
console.log(JSON.stringify({mode:bundled?'production bundle':'source files',resizeObserver:!!context.ResizeObserver,speakers:19,entries:71,newEntries:35,quotes:metadata.filter(x=>x.quote).length,writtenEntries:written.length,meetings:34,articles:11,filters,indexRecords:index.length,shareControls:0,checks:'preserved data, chronology, filters, source-note search, routes, static overview, hero visibility, count units, excerpt verification labels, dated follow-ups, link locators, cache versions, and enlarged-header offsets passed'}));
