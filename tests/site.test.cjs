const fs=require('fs'), vm=require('vm'), assert=require('assert'), path=require('path'), crypto=require('crypto');
const dir=path.resolve(__dirname,'..');
const listeners={}, elements={};
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
function node(id='') {return elements[id]??= {innerHTML:'',value:'',dataset:{view:'overview'},attributes:{},setAttribute(key,value){this.attributes[key]=value;},addEventListener(type,fn){listeners[id+':'+type]=fn;},querySelector(){return node('heading');},querySelectorAll(){return [];},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;this.headerAtScroll=cssProperties['--mobile-header-height'];}};}
const doc={getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(type,fn){listeners['document:'+type]=fn;},createElement:()=>({innerHTML:'',querySelectorAll(){return [...this.innerHTML.matchAll(/<(article|aside)\b[^>]*class="[^"]*feature-card[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>({dataset:{evidenceId:(m[0].match(/data-evidence-id="(\d+)"/)||[])[1],searchTitle:(m[0].match(/data-search-title="([^"]+)"/)||[])[1]},textContent:m[2].replace(/<[^>]*>/g,''),querySelector:()=>({textContent:strip((m[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)||[])[1]||'Project overview')}),querySelectorAll:()=>[...m[2].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(p=>({textContent:p[1].replace(/<[^>]*>/g,'')}))}));}})};
const classes=new Set(),cssProperties={};
let headerHeight=68,headerWrites=0,heightReadLabels=[];
node('.topbar').getBoundingClientRect=()=>{heightReadLabels.push(node('mobile-view').textContent);return {height:headerHeight};};
doc.documentElement={style:{setProperty(name,value){cssProperties[name]=value;headerWrites++;}},classList:{add(name){classes.add(name);},remove(name){classes.delete(name);},toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}};
let resizeCallback,resizeTarget;
class TestResizeObserver{constructor(callback){resizeCallback=callback;}observe(target){resizeTarget=target;}}
const context={document:doc,location:{hash:'',pathname:'/',href:'https://coloradostreetbridgeproject.com/'},URL,URLSearchParams,console,addEventListener(type,fn){listeners['window:'+type]=fn;},history:{pushState(_,__,href){const url=new URL(href,context.location.href);Object.assign(context.location,{href:url.href,pathname:url.pathname,hash:url.hash});}}};
if(!process.argv.includes('--no-resize-observer'))context.ResizeObserver=TestResizeObserver;
vm.createContext(context);
const bundled=process.argv.includes('--bundle');
for(const name of bundled?['assets/guide.js']:['search.js','speakers.js','other-speakers.js','resources.js','app.js']) vm.runInContext(fs.readFileSync(dir+'/'+name,'utf8'),context,{filename:name});
const run=code=>vm.runInContext(code,context), json=code=>JSON.parse(run('JSON.stringify('+code+')'));
assert.equal(cssProperties['--mobile-header-height'],'68px','Initial render measures the mobile header');
if(context.ResizeObserver)assert.equal(resizeTarget,elements['.topbar']);
assert.equal(run('Object.keys(speakers).length'),4);
// Speaker records remain byte-identical. The resource hash also includes the six approved, document-specific Dropbox folder links.
const preserved={
 'speakers.js':'222eb4f923658b098e7be0b5d8e952447da743fc1a0c6c0c0122612ff7484268',
 'other-speakers.js':'9dc05b4bf8aee88ae57ba47450ec66b6c03625dcab0fd347b7e3b1dc2d8f544e',
 'resources.js':'28f0e749eea86846e74eb586186532c2833ac19e011108b5fabd974d5402bba5'
};
for(const [name,sha] of Object.entries(preserved))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex'),sha,name+': reviewed data changed');
const folderCases=[
 ['2017-07-19','minutes20170719','1pfx649hnjvsw98o1d7ku','Minutes'],
 ['2018-04-18','minutes20180418','n378hzunr3hgwem4sawh7','Minutes'],
 ['2019-04-17','minutes20190417','xtk47234b4f653ggryw1t','Minutes'],
 ['2019-05-15','minutes20190515','7zyzzn8io53bx9hd8ok11','Minutes'],
 ['2020-02-03','minutes20200203','p9xxlexn4wn26xl5102jl','Minutes'],
 ['2020-02-03','agenda20200203','y52soljq7chasxsg0z3cw','Agenda_Packet']
];
const folderTargets=new Set();
for(const [date,source,folderId,kind] of folderCases){
 const record=json(`meetingRecords.find(m=>m.id===${JSON.stringify('meeting-'+date)})`);
 const item=record.links.find(l=>l.source===source);
 assert(item,source+': missing document link');
 assert.equal(item.label,kind==='Minutes'?'Preserved minutes · Dropbox folder':'Preserved agenda packet · Dropbox folder');
 const target=run(`urls[${JSON.stringify(source)}]`),url=new URL(target);
 assert.equal(url.origin,'https://www.dropbox.com');
 assert(url.pathname.startsWith('/scl/fo/'+folderId+'/'),source+': wrong folder');
 assert(url.searchParams.get('rlkey'));assert.equal(url.searchParams.get('dl'),'0');assert(!url.searchParams.has('st'));
 folderTargets.add(target);
 const markup=run(`directoryLinks([${JSON.stringify(item)}],${JSON.stringify(record.id)})`);
 assert(markup.includes('href="'+target.replaceAll('&','&amp;')+'"'),source+': wrong rendered target');
 assert(markup.includes(date+'_Public_Safety_Committee_'+kind+'.pdf'),source+': wrong filename');
 assert.equal((markup.match(/<code>/g)||[]).length,1,'Each link identifies only its own PDF');
 assert(!record.links.some(l=>l.source==='dropbox'),'Document entry must not fall back to the general archive');
}
assert.equal(folderTargets.size,6,'Minutes and agenda packet must have distinct destinations');
for(const [id,expected] of Object.entries({'kennedy-enclosure':['minutes20200203'],'tornek-urgency':['minutes20190417','minutes20190515'],'line-comparison':['minutes20200203']})){
 const remark=json('speakerEntries().find(x=>x.remark.id==='+JSON.stringify(id)+').remark');
 const links=json('remarkSourceLinks('+JSON.stringify(remark)+')');
 assert(!links.some(l=>l.source==='dropbox'),id+': general archive reference remains');
 assert.deepEqual(links.filter(l=>l.source.startsWith('minutes')).map(l=>l.source),expected);
 const markup=run('remarkLinks('+JSON.stringify(remark)+')');
 for(const source of expected){
  const target=run('urls['+JSON.stringify(source)+']');
  assert(markup.includes('href="'+target.replaceAll('&','&amp;')+'"'),id+': wrong document destination');
  assert(!markup.includes(target.replaceAll('&','&amp;')+'#page='),'Folder links must not have PDF page fragments');
 }
 assert.deepEqual(links.filter(l=>!expected.includes(l.source)),remark.links.filter(l=>l.source!=='dropbox'),'Other source links must remain unchanged');
}
const februaryLinks=json('timeline.find(t=>t.id==="2020-02-03").links');
assert.equal(februaryLinks.length,3);
for(const source of ['minutes20200203','agenda20200203'])assert(februaryLinks.some(l=>l[1]===run('urls['+JSON.stringify(source)+']')));
assert(!februaryLinks.some(l=>l[1]===run('urls.dropbox')));

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
const meetings=json('meetingRecords'),news=json('newsRecords');assert.equal(meetings.length,34);assert.equal(news.length,8);
const excludedPublisher=/star[\s\u2010-\u2015-]*news|pasadenastarnews|psn-2018-barriers|psn-2018-fence|psn-2020/i;
for(const name of ['resources.js','speakers.js','other-speakers.js','app.js','assets/guide.js'])assert(!excludedPublisher.test(fs.readFileSync(path.join(dir,name),'utf8')),name+': excluded publisher returned');
assert.deepEqual(meetings.map(m=>m.date),meetings.map(m=>m.date).sort());
for(const m of meetings)for(const l of m.links)assert(l.url||run(`Object.hasOwn(urls,${JSON.stringify(l.source)})`),m.id+':source');
for(const year of ['all',...new Set(meetings.map(m=>m.date.slice(0,4)))]){
 const html=run(`meetingsView('${year}')`);assert(!html.includes('undefined'));assert.equal((html.match(/class="directory-card"/g)||[]).length,meetings.filter(m=>year==='all'||m.date.startsWith(year)).length);
}
assert.equal((run('newsView()').match(/class="directory-card news-card"/g)||[]).length,8);
const index=json('searchIndex()');assert.equal(index.filter(x=>x.type==='Selected remark').length,71);
// Match actual DOM textContent: tags alone do not insert spaces.
const snippetText=html=>run(`SearchText.separateBlocks(${JSON.stringify(html)})`).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
assert.equal(snippetText('<p>One.</p><p>Two.</p>'),'One. Two.');
assert.equal(snippetText('<h3>Heading</h3><p>Body.</p><ul><li>First</li><li>Second</li></ul>'),'Heading Body. First Second');
assert.equal(snippetText('<p>2017<strong>–2021</strong>, $<em>1.48</em> million.</p>'),'2017–2021, $1.48 million.','Do not split inline punctuation or numbers');
assert.equal(snippetText('<p>First<br>Second<br />Third</p>'),'First Second Third');
assert.equal(snippetText('<P>One.</P><P>Two.</P>'),'One. Two.');
const sourceSnippet=index.find(x=>x.route==='evidence/7').text;
assert(sourceSnippet.includes('shown. Selected remarks'),'Adjacent paragraphs must stay separated in the actual index');
assert(!sourceSnippet.includes('shown.Selected'));
assert(run('searchView("How to use the sources")').replace(/<[^>]*>/g,'').includes('shown. Selected'),'Rendered search excerpt must preserve the paragraph boundary, including around search highlights');
assert.equal(index.length,140,'Add the decision-process explanation while keeping the three excluded news entries removed');
const processResult=index.find(item=>item.route==='timeline/who-decides');
assert(processResult&&processResult.title==='Who decides what?');
assert(run('searchView("who decides")').includes('data-route="timeline/who-decides"'),'A newcomer’s decision-process query must have a useful destination');
assert(run('overview()').includes('data-route="timeline/who-decides"'));
assert(run('timelineView()').includes('They do not establish a confirmed date for the next Bridge decision.'));
assert(run('evidence()').includes('curved-curved mesh (Option B, 44.5%)'));
assert(run('alternatives("landscaping")').includes('Design Commission Chair Julianna Delgado'));
assert(run('alternatives("staffing")').includes('Mayor Victor Gordo'));
assert(!run('alternatives("staffing")').includes('Host/Guide-style'));
for(const [date,source,folderId,kind] of folderCases){
 const filename=date+'_Public_Safety_Committee_'+kind+'.pdf';
 for(const query of [date,filename]){
  const matches=json('searchIndex().filter(item=>SearchText.score(item,SearchText.terms('+JSON.stringify(query)+'))>0)');
  assert(matches.some(item=>item.route==='meetings/meeting-'+date),query+': matching meeting missing');
  if(query===filename)assert.equal(matches.length,1,'Each displayed filename identifies its own meeting');
 }
}
for(const query of ['2/3/2020','02/03/2020','February 3, 2020'])assert(run('searchView('+JSON.stringify(query)+')').includes('meetings/meeting-2020-02-03'),query+': date format');
assert.deepEqual(json('searchDateAliases("Winter 2026")'),[],'Do not invent dates for partial dates');
assert(run('searchView("")').includes('<p class="search-empty">Try <button'));
assert(!run('searchView("")').includes('Use the search box to enter a word or phrase.'));
assert(!run('searchView("")').includes('phrase above'));

assert(!excludedPublisher.test(JSON.stringify(index)),'Excluded publisher must not appear in search');
assert(index.some(x=>x.route==='timeline/2020-02-03'));
assert.equal(run('timeline.find(t=>t.id==="4").date'),'Aug 2021','Existing numeric timeline links remain stable');
assert(run('steps(timeline,true)').includes('data-timeline-id="2020-02-03"'));
assert(run('steps(timeline,true)').includes('committee received and filed'));
assert(run('evidence()').includes('$130,000 on June 9 and $46,000 on July 21'));
assert(run('evidence()').includes('Staff said enough remained to finish design'));
assert(run('evidence()').includes('after costs the City had already agreed to pay'));
assert(!run('evidence()').includes('A complete appropriation history has not been reconciled'));
assert(index.some(x=>x.title==='Height depends on the measurement point'),'Height comparison must be searchable');
assert(index.some(x=>x.title==='Curved-curved mesh (Option B) led among respondents who ranked the mockups'));
assert(run('evidence()').includes('73324'));
assert(!run('evidence()').includes('Of 678 respondents'));
assert(run('overview()').includes('Page excerpt'));
assert(run('overview()').includes('What alternatives were studied?'));
assert(run('forecastComparison()').includes('August 2020, if the City approved the funding'));
assert(run('forecastComparison()').includes('does not promise when the barrier will be built'));
assert.equal((run('forecastComparison()').match(/scope="row"/g)||[]).length,3);
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
const delgadoRoutes=index.filter(i=>i.route.startsWith('speakers/delgado/')).map(i=>i.route).sort();
assert.equal(delgadoRoutes.length,4);
for(const query of ['Julianna Delgado','J. Delgado','J Delgado','Delgado']){
 const matches=json(`searchIndex().filter(i=>i.route.startsWith('speakers/delgado/')&&SearchText.score(i,SearchText.terms(${JSON.stringify(query)}))>0).map(i=>i.route)`);
 assert.deepEqual(matches.sort(),delgadoRoutes,'All Delgado name variants must find all four remarks: '+query);
}
assert(run('searchView("Julianna Delgado cacti")').includes('delgado-cacti'),'Full name and topic must combine');
assert(index.filter(i=>i.route.startsWith('speakers/delgado/')).every(i=>i.title.startsWith('J. Delgado · ')),'Search aliases must not rewrite preserved display names');
assert.equal(index.find(i=>i.route==='evidence/5').title,'What remains unresolved');
assert.equal(index.find(i=>i.route==='evidence/7').title,'How to use the sources');
assert(!run('evidence()').includes('<h3>What the record leaves open</h3>'));
assert(!run('evidence()').includes('<h3>How to use the source links</h3>'));
assert(run('evidence()').includes('The records also show an unexplained disagreement between two 2017 counts.'));
assert(!run('evidence()').includes('These statements use different wording and dates. These statements'));
assert(run('meetingsView()').includes('34 meeting and related records'));
assert(run('meetingsView("2022")').includes('1 meeting or related record'));
assert(run('alternatives()').includes('href="/alternatives-studied/#other-approaches"'));
assert(run('alternatives()').indexOf('Skip to netting')<run('alternatives()').indexOf('class="design-gallery"'));
assert(!run('alternatives("netting")').includes('Skip to netting'),'Subpages must not contain the gallery shortcut');
for(const entry of index){context.location.hash='#'+entry.route;run('render()');assert(!elements.content.innerHTML.includes('href="undefined"'),entry.route);}
for(const hash of ['#speakers/other','#speakers/delgado?topic=netting','#meetings?year=2019','#meetings?year=unknown','#speakers/unknown','#news']){context.location.hash=hash;run('render()');}
context.location.hash='#speakers/delgado?topic=design';listeners['document:change']({target:{id:'other-speaker',value:'kennedy'}});assert.equal(context.location.hash,'#speakers/kennedy?topic=design');
listeners['document:change']({target:{id:'speaker-topic',value:'staffing'}});assert.equal(context.location.hash,'#speakers/kennedy?topic=staffing');
listeners['document:change']({target:{id:'meeting-year',value:'2024'}});assert.equal(context.location.hash,'#meetings?year=2024');
for(const query of ['<script>', '"><img src=x onerror=alert(1)>', "'><svg onload=alert(1)>", '.*+?^${}()|[]\\']){
  context.location.hash='#search?q='+encodeURIComponent(query);run('render()');
  assert(!/<script\b|<img\b|<svg\b/i.test(elements.content.innerHTML),'Search markup remains escaped');
  assert(elements.content.innerHTML.includes(run('esc('+JSON.stringify(query)+')')),'Search terms remain literal text');
}
const html=run('speakerView()+meetingsView()+newsView()');
assert(html.includes('class="source-label"'));
for(const m of html.matchAll(/href="([^"]+)"/g)){const href=m[1].replaceAll('&amp;','&');assert(href.startsWith('/')||href.startsWith('#')||href.startsWith('https://'),href);if(href.startsWith('https'))new URL(href);}
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
assert(page.includes('src="./bridge-preview.webp"'));
assert(!page.includes('src="bridge.jpeg"'));
assert(page.includes('class="figure-links"'));
assert(page.includes('class="footer-link"'));
assert(page.includes('class="source-link"'));
assert(!page.includes('return-tools'),'Floating control must not cover reading content');
assert(page.includes('aria-controls="site-sidebar"'));
assert(page.includes('name="color-scheme" content="dark light"'));
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
assert.equal(context.location.pathname,'/timeline/');assert.equal(context.location.hash,'');assert(classes.has('menu-open'));assert(elements['tab-timeline'].focused);
listeners['document:keydown']({key:'Escape'});assert(!classes.has('menu-open'));assert.equal(elements['menu-toggle'].attributes['aria-expanded'],'false');assert(elements['menu-toggle'].focused);
listeners['menu-toggle:click']();headerHeight=165;run('navigate("meetings")');assert(!classes.has('menu-open'));assert.equal(elements['menu-toggle'].attributes['aria-expanded'],'false');assert(elements.content.focused);
assert.equal(elements['mobile-view'].textContent,'Meetings & documents');
assert.equal(heightReadLabels.at(-1),'Meetings & documents','Measure after updating the section label');
assert.equal(elements.content.headerAtScroll,'165px','Section scrolling uses the new header height without waiting for ResizeObserver');
headerHeight=166;run('navigate("meetings/meeting-2024-01-09")');
assert.equal(elements['meeting-2024-01-09'].headerAtScroll,'166px','Deep links use the measured header offset');
headerHeight=68;
elements.content.scrolled=false;
listeners['document:click']({preventDefault(){},target:{closest:selector=>selector==='[data-view]'?({dataset:{view:'news'},focus(){}}):null}});
assert.equal(context.location.pathname,'/news-and-commentary/');assert.equal(context.location.hash,'');assert(elements.content.scrolled,'Persistent navigation must reveal the new section heading');
assert(!listeners['return-tools:click']);
assert.equal((page.match(/<script src=/g)||[]).length,2);
assert(page.includes(run('overview()').replace('<h2>','<h2 id="view-heading">').replace(/href="\/(?!\/)/g,'href="./')),'Static overview diverges from the interactive overview');
for(const html of [page,run('overview()')]){
 assert(!html.includes('Three different decisions'),'Removed card must not appear in either overview');
 assert(!html.includes('class="status-list"'),'Removed policy/design/construction list must not remain');
 assert(html.includes('THE SHORT VERSION'),'Keep the opening explanation');
 assert(html.includes('In 2018, Pasadena decided to pursue a permanent suicide prevention barrier on the Colorado Street Bridge. More than eight years later, the temporary fence remains.'),'Use the approved opening paragraph');
 assert(html.includes('The City has studied designs and alternatives, built full-size examples, and gathered public feedback. But as of September 2026, the records reviewed for this guide do not show an approved permanent design or secured construction funding.'),'Use the approved project summary');
 assert(!html.includes('In April 2018, the City Council chose to pursue a permanent barrier.'),'Do not repeat the introduction above the summary');
 assert(!html.includes('The temporary fence stayed while'),'Remove the superseded process summary');
 assert(!html.includes('<p></p>'),'Omitting the introduction must not leave an empty paragraph');
 assert(!html.includes('class="project-status"'),'Remove status cards that repeat the approved summary');
 assert(!html.includes('The records reviewed for this guide do not show that a final design has been approved.'),'Do not repeat the design status');
 assert(!html.includes('funding to build the barrier still had to be found'),'Do not repeat the funding status');
 assert.equal((html.match(/class="overview-schedule"/g)||[]).length,1,'Keep one compact schedule note');
 assert(html.includes('The City’s target for finishing the design is June 30, 2028. That is not a date for completing the barrier.'),'Keep the design-versus-construction distinction');
 assert.equal((html.match(/City project page checked September 13, 2026/g)||[]).length,1,'State the source-check date only once');
 const sourceArea=html.match(/<div class="overview-sources">([\s\S]*?)<\/details><\/div>/)[1];
 assert(sourceArea.includes('<summary>Source dates and funding note</summary>'),'Keep verification details beside the source links');
 assert(sourceArea.includes('covers activity through June 30, 2026'),'Retain the report period');
 assert(sourceArea.includes('A funding request does not mean the money has been awarded.'),'Retain the funding qualification');
 assert(!html.includes('A useful distinction'),'Removed note must not appear in either overview');
 assert(!html.includes('Repeated questions are documented.'),'Removed note body must not remain');
}
const overviewColumns=styleBlocks.filter(block=>block.selectors.includes('.overview-grid')&&block.body.includes('grid-template-columns')).map(block=>block.body.match(/grid-template-columns:\s*([^;]+)/)[1].trim());
assert(overviewColumns.length>0&&overviewColumns.every(value=>value==='minmax(0,1fr)'),'Overview must use one column at every breakpoint');
for(const [name,file] of [['SCRIPT','assets/guide.js'],['STYLE','styles.css'],['THEME','theme.js']]){
 const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex').slice(0,12);
 assert(page.includes(file+'?v='+version),name+': cache version mismatch');
}
const base='https://example.org/ColoradoStreetBridge/';
for(const match of page.matchAll(/(?:src|href)="([^"]+)"/g)){
 const value=match[1];
 if(value.startsWith('#')||/^(https:|data:|tel:|mailto:)/.test(value))continue;
 assert(!value.startsWith('/'),'Asset must work under the project path: '+value);
 assert(new URL(value,base).pathname.startsWith('/ColoradoStreetBridge/'));
 assert(fs.existsSync(path.join(dir,value.split(/[?#]/)[0])),value);
}
const rootEntries=fs.readdirSync(dir,{withFileTypes:true});
assert(page.includes('href="mailto:contact@coloradostreetbridgeproject.com"'),'Footer email must use the confirmed project address');
const allowedVisibleEntries=new Set(['index.html','index.template.html','theme.js','styles.css','noscript.css','search.js','speakers.js','other-speakers.js','resources.js','app.js','bridge-preview.webp','bridge.jpeg','README.md','CNAME','tests','scripts','assets','preserved-records','timeline','alternatives-studied','evidence-and-limits','who-said-what','meetings-and-documents','news-and-commentary','search','sitemap.xml','robots.txt','about']);
const allowedHiddenEntries=new Set(['.nojekyll','.github']);
const ignoredHiddenEntries=new Set(['.DS_Store','.git']);
const visibleEntries=rootEntries.filter(entry=>!entry.name.startsWith('.')).map(entry=>entry.name);
const hiddenEntries=rootEntries.filter(entry=>entry.name.startsWith('.')).map(entry=>entry.name).filter(name=>!ignoredHiddenEntries.has(name));
assert.deepEqual(visibleEntries.filter(name=>!allowedVisibleEntries.has(name)),[],'Unexpected public files');
assert.deepEqual(hiddenEntries.filter(name=>!allowedHiddenEntries.has(name)),[],'Unexpected hidden public files');
for(const name of ['index.html','app.js','search.js','speakers.js','other-speakers.js','resources.js','README.md']){
 const text=fs.readFileSync(path.join(dir,name),'utf8');
 assert(!/sandbox:|\/workspace\/|libfile_|file_000000|chatgpt\.site/.test(text),name+': internal reference');
}
// Remove optional entry-sharing controls without breaking existing entry routes.
assert(!/data-copy-entry|class="entry-actions"|class="entry-link"|id="copy-status"|>Entry link<|>Copy entry link</.test(html),'Entry-sharing controls must not return');
assert(!/data-copy-entry|class="entry-actions"|class="entry-link"|id="copy-status"|>Entry link<|>Copy entry link</.test(fs.readFileSync(path.join(dir,'who-said-what/index.html'),'utf8')),'Static entries must omit sharing controls too');
assert.equal(run('typeof copyEntryLink'),'undefined');
assert.equal(run('typeof entryShare'),'undefined');
assert.equal((html.match(/class="remark-card"/g)||[]).length,71);
assert.equal((html.match(/class="directory-card(?: news-card)?"/g)||[]).length,42);
assert(!excludedPublisher.test(html),'Excluded publisher must not appear in rendered views');
for(const [route,id] of [['news/lat-1989','lat-1989'],['meetings/meeting-2024-01-09','meeting-2024-01-09'],['speakers/delgado/delgado-cacti','delgado-cacti']]){
 run('navigate('+JSON.stringify(route)+')');
 assert(elements[id].focused&&elements[id].scrolled,'Existing entry route must still work: '+route);
}
// Editorial cleanup: retain the evidence while changing its presentation.
for(const view of ['overview','timeline','alternatives','evidence','speakers','meetings','news','search','about']){
 run('navigate('+JSON.stringify(view)+')');
 assert.equal(elements['.intro'].hidden,view!=='overview',view+': hero visibility');
 assert(elements.content.innerHTML.includes(view==='overview'?'<h2>':'<h1>'),view+': section heading');
}
assert(styleBlock('[hidden]').includes('display: none !important'),'Responsive display rules must not unhide the hero');
assert(run('speakerView()').includes('All 19 speakers'));
assert(run('speakerView("other")').includes('35 entries from 15 people'));
assert(!run('speakerView("madison")').includes('class="chronology-note"'));
assert(!run('speakerView("other")').includes('Remarks are included when'));
assert(run('speakerView()').includes('Remarks are included when'));
assert(!run('speakerView()').includes('A recurring question does not establish'));
assert(!run('overview()').includes('The record contains both practical delays'));
assert(run('overview()').includes('do not show an approved permanent design or secured construction funding.'));
assert(!run('viewMarkup({view:"timeline"})').includes('This describes the reviewed records.'));
assert(!run('newsView()').includes('Reports and columns reflect their publication dates.'));
assert(!run('newsView()').includes('A specific Tribune article link has not been established'));
assert(run('newsView()').includes('Links open the original publisher sites. Some require a subscription.'));
assert(!run('newsView()').includes('San Gabriel Valley Tribune · publisher homepage'));
for(const view of ['timeline','alternatives','speakers']){
 assert(!run('viewMarkup('+JSON.stringify({view})+')').includes('Record note'),view+': record-note blocks removed');
}
assert(run('speakerView()').includes('<dt>What followed</dt>'));
assert(run('speakerView()').includes('Sources for this entry'));
assert(!run('searchIndex().map(r=>r.text).join(" ")').includes('This exchange records the intended distinction'));
assert(!run('steps([{date:"2026",title:"Test",text:"Visible",result:"Hidden record note"}])').includes('Hidden record note'));
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
assert(run('remarkExcerpt(speakers.jones.remarks.find(r=>r.id==="jones-continue"))').includes('author checked who was speaking and where the passage appears'));
const aprilLinks=run('citations(7,"5–7",[["Council minutes",urls.m2018],["Task-force report",urls.r2018]])');
assert(!aprilLinks.includes('href="'+run('urls.m2018')+'"'));
assert(aprilLinks.includes('href="'+run('urls.m2018')+'#page=4"'));
const distinctPages=run('citations(1,"",[["Survey",urls.p2024+"#page=18"],["Commission feedback",urls.p2024+"#page=16"]])');
assert(distinctPages.includes('#page=18')&&distinctPages.includes('#page=16'),'Keep distinct cited page locators');
for(const url of ['#overview','bridge.jpeg','https://coloradostreetbridgeproject.com/preserved-records/tables.html'])assert(!run(`link("Test",${JSON.stringify(url)})`).includes('↗'));
assert(run('link("Test",urls.project)').includes('↗'));
assert(!run('overview()').includes('More supporting records'),'A single extra source stays visible');
assert(!run('overview()').includes('stands in the record'));
assert(run('overview()').includes('In 2018, Pasadena decided to pursue'));
assert(run('overview()').includes('records reviewed for this guide'));
console.log(JSON.stringify({mode:bundled?'production bundle':'source files',resizeObserver:!!context.ResizeObserver,speakers:19,entries:71,newEntries:35,quotes:metadata.filter(x=>x.quote).length,writtenEntries:written.length,meetings:34,articles:news.length,filters,indexRecords:index.length,shareControls:(html.match(/data-copy-entry=/g)||[]).length,checks:'preserved data, publisher exclusion, chronology, filters, source-note search, routes, static overview, hero visibility, count units, excerpt verification labels, dated follow-ups, link locators, cache versions, and enlarged-header offsets passed'}));

const personOptions=run('speakerView()').match(/<select id="speaker-person">([\s\S]*?)<\/select>/)[1];
assert.equal((personOptions.match(/<option /g)||[]).length,20);
assert(run('speakerView("kramer")').includes('1 entry'));
assert(!run('speakerView("kramer")').includes('1 entries'));
for(const y of ['2018','2021','2024','2026']){
 const selected=json('speakerEntries("all","all",'+JSON.stringify(y)+')');
 assert(selected.every(x=>x.remark.sortDate.startsWith(y)));
 assert.equal((run('speakerView("all","all",'+JSON.stringify(y)+')').match(/class="remark-card"/g)||[]).length,selected.length);
}
assert(run('meetingsView("all","newest")').indexOf('id="meeting-2026-09-16"')<run('meetingsView("all","newest")').indexOf('id="meeting-2024-01-09"'));
assert(run('viewMarkup({view:"timeline"})').includes('construction in August 2020, if the City approved the funding'));
assert(run('evidence()').indexOf('2021 survey')<run('evidence()').indexOf('2024 survey'));
assert(run('evidence()').indexOf('id="research"')<run('evidence()').indexOf('id="design-criteria"'));
assert.equal(json('searchIndex().filter(x=>x.title==="Height depends on the measurement point")')[0].route,'evidence/0');
assert(!run('speakerView()').match(/\bSource \d+/));
assert(!run('speakerView()').includes('from the paper'));
assert.equal((run('designGallery()').match(/<img /g)||[]).length,4);
assert(run('designGallery()').includes('does not say when the photograph was taken'));
assert(run('designGallery()').includes('says this option was eliminated'));
assert(!run('meetingsView()').includes('This is a future meeting'));
assert(!run('alternatives()').includes('Keep this qualification'));
assert(!run('alternatives("technology")').includes('This companion'));
assert(run('aboutView()').includes('maintained as a personal research project'));
run('navigate("search?q=netting")');run('navigate("speakers/delgado/delgado-cacti")');
assert(elements.content.innerHTML.includes('Return to search results'));
assert(elements.content.innerHTML.indexOf('Return to search results')<elements.content.innerHTML.indexOf('class="remark-card"'));
console.log('September 17 audit regression checks passed');

// The approved plain-language pass changes explanations, not evidence or quotations.
const plainTimeline=run('viewMarkup({view:"timeline"})');
for(const phrase of ['Agreeing to a barrier was only the first step','Planned dates and what happened next','Finishing the design is one step. Building the barrier is another.','if the City approved the funding'])assert(plainTimeline.includes(phrase),phrase);
for(const phrase of ['What does the evidence tell us?','Would deaths move elsewhere?','Research does not identify one best design for every bridge','People chose whether to take part.','using different totals','after costs the City had already agreed to pay','federal American Rescue Plan Act','approximately where each discussion begins'])assert(run('evidence()').includes(phrase),phrase);
assert(run('overview()').includes('What the 2028 date means'));
assert(run('alternatives("netting")').includes('does not mean a completed design proved a net could not be built'));
assert(run('speakerView()').includes('Not every quoted word was checked against the audio.'));
assert(!run('speakerView()').includes('official-player passage locator'));
assert.equal(run('speakerTopicLabel("effectiveness")'),'Effectiveness and whether deaths move elsewhere');
assert(index.some(x=>x.type==='Selected remark'&&x.text.includes('starting time in the official recording')),'Search uses the displayed source-note wording');
assert(run('meetingsView()').includes('Automatically recognized text may contain errors.'));
assert(tablePage.includes('Original documents, searchable copies, and how the copies were made'));
assert(tablePage.includes('after costs the City had already agreed to pay'));
console.log('Plain-language copy and preservation checks passed');

// Remove repeated editorial labels without losing the underlying explanations.
for(const key of json('Object.keys(topics)')){
 const topic=json('topics['+JSON.stringify(key)+']');
 const markup=run('alternatives('+JSON.stringify(key)+')');
 assert(!markup.includes('<span class="pill">'),'Alternative summaries must not repeat their answer in a status badge');
 for(const field of ['title','answer','limit']){
  const value=field==='title'?topic[field].replace(/\.$/,''):topic[field];
  assert(markup.includes(run('esc('+JSON.stringify(value)+')')),key+': preserve '+field);
 }
}
assert(run('evidence()').includes('Read the prevention studies, local surveys, and financial records, with the limits of each.'));
assert(!run('evidence()').includes('READING THE MONEY AND DATES'));
assert(run('speakerView()').includes('Read selected exchanges in date order, with their background, responses, and supporting records.'));
assert(!run('aboutView()').includes('Source notes explain whether the words are'));
assert(run('aboutView()').includes('Quotations, City-caption excerpts, working-transcript excerpts, and summaries are labeled separately.'));
assert(run('aboutView()').includes('Checking who was speaking and when does not mean every quoted word was checked against the audio.'));
assert(run('aboutView()').includes('whether they support or challenge the guide’s reading'));
assert(!/The guide and the paper|The fence everyone can see|the author’s/.test(run('aboutView()')),'About must stand on its own without paper references or a byline');
console.log('Focused repetition and qualification-preservation checks passed');

const fundingSearch=index.find(item=>item.route==='evidence/6');
assert(fundingSearch.text.includes('$1.48 million Total spending'));
assert(fundingSearch.text.includes('June 2028 The target'));
assert(index.find(item=>item.route==='overview/0').text.includes('date means The City'));
assert(index.find(item=>item.route==='meetings/meeting-2018-05-07').summary.includes('funding. Funding record.'));
assert.equal(run('SearchText.excerpt("One two three four five",[],12)'),'One two…');
assert(run('SearchText.snippet(searchIndex().find(i=>i.route==="evidence/6"),["funding"])').startsWith('The project has recorded'));
assert.equal(run('SearchText.snippet({title:"Title",text:"Title Body"},["body"])'),'Body');
assert.equal(run('SearchText.snippet({title:"Title",text:"Title Source filename.pdf",summary:"Overview"},["filename.pdf"])'),'Source filename.pdf');
assert(run('searchView("funding")').includes('id="results-search-input"'));
assert(run('searchView(\'a" onfocus="x\')').includes('value="a&quot; onfocus=&quot;x"'));
node('results-search-input').value=' netting & design ';
let submitPrevented=false;
listeners['document:submit']({target:{id:'results-search-form'},preventDefault(){submitPrevented=true;}});
assert(submitPrevented);assert.equal(run('readRoute().query'),'netting & design');
const visibleMeetings=run('speakerView()');
assert(visibleMeetings.includes('<section class="meeting-jumps scroll-focus"'));
assert(!visibleMeetings.includes('<details class="meeting-jumps"'));
assert.equal((visibleMeetings.match(/data-scroll-target="speaker-controls"/g)||[]).length,(visibleMeetings.match(/class="meeting-group"/g)||[]).length);
run('navigate("speakers/all?topic=netting&year=2024")');
const beforeScroll=context.location.href;
let scrollPrevented=false;
listeners['document:click']({button:0,target:{closest:selector=>selector==='[data-scroll-target]'?{dataset:{scrollTarget:'speaker-controls'}}:null},preventDefault(){scrollPrevented=true;}});
assert(scrollPrevented);assert.equal(context.location.href,beforeScroll);assert(node('speaker-controls').focused);assert(node('speaker-controls').scrolled);
assert(run('directoryLinks([{url:"https://example.org/report.pdf#page=2",label:"Staff report"}])').includes('Staff report · PDF'));
assert(!run('directoryLinks([{url:"https://example.org/folder",label:"Minutes folder"}])').includes(' · PDF'));
assert.equal((run('forecastComparison()').match(/class="forecast-cell-label"/g)||[]).length,6);
assert(run('forecastComparison()').includes('role="table"'));
assert(fs.readFileSync(path.join(dir,'index.template.html'),'utf8').includes('class="utility-nav"'));
console.log('Search refinement, visible meeting navigation, PDF labels, and narrow comparison checks passed');
