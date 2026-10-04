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
for(const name of bundled?['assets/guide.js']:['search.js','paper/search-data.js','speakers.js','other-speakers.js','resources.js','app.js']) vm.runInContext(fs.readFileSync(dir+'/'+name,'utf8'),context,{filename:name});
const run=code=>vm.runInContext(code,context), json=code=>JSON.parse(run('JSON.stringify('+code+')'));
assert.equal(cssProperties['--mobile-header-height'],'68px','Initial render measures the mobile header');
if(context.ResizeObserver)assert.equal(resizeTarget,elements['.topbar']);
assert.equal(run('Object.keys(speakers).length'),8);
// October 2 bounded update: two cushion summaries identify Fire consistently,
// and the September 2022 directory now includes its existing official recording.
// Quotations and the September 22 author-audio-checked exchange remain unchanged.
// October 4: reviewed directory wording and the full September agenda-packet review.
const preserved={
 'speakers.js':'c7fe204f77282ce0d92b6db28bc812815f1fb7909ff8412cb2c2c813c615ec49',
 'other-speakers.js':'964b30f9679e1a573bea6fc8c598b27475f6e618b888cbbaab7056c40b84a712',
 'resources.js':'b8aeeed999082b7e66788c12886ecbaaa4bf227ca42b4e970304dda2e680e10f'
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
 assert.equal(item.label,kind==='Minutes'?'Preserved minutes · PDF':'Preserved agenda packet · PDF');
 const target=run(`urls[${JSON.stringify(source)}]`),url=new URL(target);
 assert.equal(url.origin,'https://coloradostreetbridgeproject.com');
 assert.equal(url.pathname,'/preserved-records/'+date+'_Public_Safety_Committee_'+kind+'.pdf');
 assert.equal(url.search,'');
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'preserved-records/city-records-manifest.json'),'utf8'));
 const original=manifest.find(r=>r.key===source);
 assert(original,source+': missing preservation record');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'preserved-records',original.file))).digest('hex'),original.sha256);
 folderTargets.add(target);
 const markup=run(`directoryLinks([${JSON.stringify(item)}],${JSON.stringify(record.id)})`);
 assert(markup.includes('href="'+target.replaceAll('&','&amp;')+'"'),source+': wrong rendered target');
 assert(markup.includes(date+'_Public_Safety_Committee_'+kind+'.pdf'),source+': wrong filename');
 assert(markup.includes(kind==='Minutes'?'Open minutes (PDF)':'Open agenda packet (PDF)'),source+': clear document action');
 assert(!markup.includes('file-locator'),'Remove redundant non-clickable filename labels');
 assert(!markup.includes('<code>'),'Do not present the filename as a second, inactive document label');
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
  assert(!markup.includes(target.replaceAll('&','&amp;')+'#page='),'Unspecified page locators must not be invented');
 }
 assert.deepEqual(links.filter(l=>!expected.includes(l.source)),remark.links.filter(l=>l.source!=='dropbox'),'Other source links must remain unchanged');
}
const februaryLinks=json('timeline.find(t=>t.id==="2020-02-03").links');
assert.equal(februaryLinks.length,3);
for(const source of ['minutes20200203','agenda20200203'])assert(februaryLinks.some(l=>l[1]===run('urls['+JSON.stringify(source)+']')));
assert(!februaryLinks.some(l=>l[1]===run('urls.dropbox')));

assert.equal(run('Object.keys(otherSpeakers).length'),15);
assert.equal(run('speakerEntries().length'),75);
assert.equal(run('speakerEntries("other").length'),35);
const metadata=json('speakerEntries().map(x=>x.remark)'), ids=metadata.map(x=>x.id);
assert.equal(new Set(ids).size,75);
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
assert(!run('speakerView()').includes('class="active-filter-summary"'),'Unfiltered entries must not show an active-filter summary');
assert(run('speakerView("gordo","effectiveness","2018")').includes('<span class="active-filter-summary">Showing: Victor Gordo · Councilmember / mayor · Effectiveness and whether deaths move elsewhere · 2018</span>'),'Active filters must expose their complete labels and selected year');
assert(run('speakerView("all","all","2024")').includes('<span class="active-filter-summary">Showing: 2024</span>'),'A year-only selection must be visible in the active-filter summary');
const meetings=json('meetingRecords'),news=json('newsRecords');assert.equal(meetings.length,34);assert.equal(news.length,28);
const excludedPublisher=/psn-2018-barriers|psn-2018-fence|psn-2020/i;
const reviewedStarNews="https://www.pasadenastarnews.com/2019/11/26/unsightly-but-necessary-pasadena-reacts-to-colorado-street-bridge-suicide-barriers/";
assert.deepEqual(news.filter(n=>/pasadenastarnews\.com/i.test(n.url)).map(n=>n.url),[reviewedStarNews]);
for(const name of ['resources.js','speakers.js','other-speakers.js','app.js','assets/guide.js'])assert(!excludedPublisher.test(fs.readFileSync(path.join(dir,name),'utf8')),name+': unreviewed news entry returned');
assert.deepEqual(meetings.map(m=>m.date),meetings.map(m=>m.date).sort());
for(const m of meetings)for(const l of m.links)assert(l.url||run(`Object.hasOwn(urls,${JSON.stringify(l.source)})`),m.id+':source');
for(const year of ['all',...new Set(meetings.map(m=>m.date.slice(0,4)))]){
 const html=run(`meetingsView('${year}')`);assert(!html.includes('undefined'));assert.equal((html.match(/class="directory-card"/g)||[]).length,meetings.filter(m=>year==='all'||m.date.startsWith(year)).length);
}
assert.equal((run('newsView()').match(/class="directory-card news-card"/g)||[]).length,28);
// News filters must retain the correct records and survive a route reload,
// including historical years outside the meeting directory's date range.
const newsIds=markup=>[...markup.matchAll(/class="directory-card news-card" id="([^"]+)"/g)].map(m=>m[1]);
for(const year of [...new Set(news.map(n=>n.date.slice(0,4)))]){
  const expected=news.filter(n=>n.date.slice(0,4)===year).map(n=>n.id);
  assert.deepEqual(newsIds(run(`newsView(${JSON.stringify(year)})`)),expected);
  assert.deepEqual(newsIds(run(`newsView(${JSON.stringify(year)},"newest")`)),expected.slice().reverse());
  context.location.hash='#news?year='+year+'&order=newest';
  assert.equal(run('readRoute().year'),year);
  run('render()');assert.deepEqual(newsIds(elements.content.innerHTML),expected.slice().reverse());
}
context.location.hash='#news?year=2021';
listeners['document:change']({target:{id:'news-order',value:'newest'}});
assert.equal(context.location.hash,'#news?year=2021&order=newest');
listeners['document:change']({target:{id:'news-year',value:'1989'}});
assert.equal(context.location.hash,'#news?year=1989&order=newest');
assert.deepEqual(newsIds(elements.content.innerHTML),['lat-1989']);
context.location.hash='#news?year=invalid';assert.equal(run('readRoute().year'),'all');
assert(run('newsView()').includes('data-scroll-target="news-history"'));
assert(!run('newsView("2024")').includes('data-scroll-target="news-history"'));
assert(run('newsView()').includes('paper/sources/#csb-source-47'));
context.location.hash='';
const index=json('searchIndex()');assert.equal(index.filter(x=>x.type==='Selected remark').length,75);
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
assert.equal(index.length,179,'Retain earlier search entries and index the Timeline historical introduction');
assert.equal(index.filter(x=>x.type==='Paper').length,13);
const historyResult=index.find(item=>item.route==='timeline/history');
assert(historyResult&&historyResult.text.includes('Scoville'));
assert.equal(historyResult.text,run('bridgeHistory.paragraphs.join(" ")'),'Search and Timeline share the same historical introduction');
assert(run('searchView("Scoville")').includes('href="/timeline/#bridge-history-heading"'));
const fundingResults=json('rankedSearchResults("funding")');
assert.equal(fundingResults[0].item.route,'evidence/6','The funding explanation wins the demonstrated relevance tie');
assert.equal(fundingResults[0].score,fundingResults.find(x=>x.item.type==='Selected remark').score);
for(const query of ['funding','netting','landscaping','staffing','technology']){
 const ranked=json('rankedSearchResults('+JSON.stringify(query)+')');
 assert(ranked.every((r,i)=>!i||ranked[i-1].score>=r.score),'Summary preference cannot overtake a higher relevance score');
}
for(const query of ['Greg de Vinck','funding application','truly exhausted','July 17, 2024','2020-02-03']){
 const scoreOrder=json('searchIndex().map(item=>({item,score:SearchText.score(item,SearchText.terms('+JSON.stringify(query)+'),'+JSON.stringify(query)+')})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.item.route||x.item.path)');
 const ranked=json('rankedSearchResults('+JSON.stringify(query)+').map(x=>x.item.route||x.item.path)');
 assert.deepEqual(ranked,scoreOrder,query+': names, phrases, and dates retain their relevance order');
}
const filmSearch=run('searchView("La La Land")');
assert.equal(filmSearch.match(/<h3><a [^>]*href="([^"]+)"/)[1],'/paper/#passage-7','Exact film phrase ranks above landscaping fragments');
for(const query of ['The fence everyone can see','  THE fence  everyone can SEE  ']){
 const result=run(`searchView(${JSON.stringify(query)})`).match(/<ol class="search-results"><li>([\s\S]*?)<\/li>/)[1];
 assert(result.includes('href="/paper/#paper-top"'),'Exact title opens the beginning');
 assert(result.includes('By Christopher Clark'));
 assert(result.replace(/<[^>]*>/g,'').includes('The fence everyone can see'));
 assert(result.includes('<p class="result-excerpt">An analytical history of Pasadena’s Colorado Street Bridge barrier project, with linked sources.</p>'),'Title match shows an unhighlighted introduction, not incidental prose words');
}
const graftonSearch=run('searchView("Grafton")');
assert(/href="\/paper\/where-that-leaves-pasadena\/#passage-\d+"/.test(graftonSearch),'A prose search still links to its matching passage');
assert(graftonSearch.includes('<mark>Grafton</mark>'));
for(const [query,target] of [['Christopher Clark','paper/'],['The fence everyone can see','paper/'],['La La Land','paper/'],['higher-capacity cushion','paper/2024/'],['not a rush','paper/2018-2019/']]){
 const matches=index.filter(x=>x.type==='Paper'&&run(`SearchText.score(${JSON.stringify(x)},SearchText.terms(${JSON.stringify(query)}))`)>0);
 assert(matches.some(x=>x.path===target),query+': paper search match');
 assert.equal(new Set(matches.map(x=>x.path)).size,matches.length,'Group paper results by chapter');
 const output=run(`searchView(${JSON.stringify(query)})`);
 assert(output.includes('class="result-type">Paper</p>'));
 assert(output.includes('href="/'+target+'#'),'Paper result links directly to its passage');
 assert(!output.includes('data-route="paper/'),'Paper links use ordinary navigation');
}
for(const chapter of index.filter(x=>x.type==='Paper')){
 const chapterHtml=fs.readFileSync(path.join(dir,chapter.path,'index.html'),'utf8');
 for(const passage of chapter.passages)assert(chapterHtml.includes('id="'+passage.id+'"'),chapter.path+': stable passage target');
}
const processResult=index.find(item=>item.route==='timeline/who-decides');
assert(processResult&&processResult.title==='Who decides what?');
assert(run('searchView("who decides")').includes('data-route="timeline/who-decides"'),'A newcomer’s decision-process query must have a useful destination');
assert(run('overview()').includes('data-route="timeline/who-decides"'));
assert(run('timelineView()').includes('with no confirmed date for the next Bridge decision.'));
assert(run('evidence()').includes('Curved-curved mesh (Option B)</th><td>462</td><td>44.5%'));
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
assert(run('evidence()').includes('The amount remaining after outstanding commitments is unresolved, as is the project’s federal ARPA accounting.'));
assert(!run('evidence()').includes('A complete appropriation history has not been reconciled'));
assert(index.some(x=>x.title==='Height depends on the measurement point'),'Height comparison must be searchable');
assert(index.some(x=>x.title==='Curved-curved mesh (Option B) led among respondents who ranked the mockups'));
assert(run('evidence()').includes('73324'));
assert(!run('evidence()').includes('Of 678 respondents'));
assert(run('overview()').includes('Page excerpt'));
assert(run('overview()').includes('What alternatives were studied?'));
assert(run('forecastComparison()').includes('August 2020, if the City approved the funding'));
assert(run('forecastComparison()').includes('Construction funding remained unidentified.'));
assert.equal((run('forecastComparison()').match(/scope="row"/g)||[]).length,3);
assert(run('speakerView()').includes('whether they support or challenge'));
assert(!run('timeline.find(t=>t.date==="Nov 2023").result').includes('meeting that timing milestone'));
assert.notEqual(run('reviewDates.baseline'),run('reviewDates.siteUpdated'));
assert.equal(run('reviewDates.baseline'),'2026-09-01','A scoped agenda review must not advance the main research cutoff');
assert.equal(run('reviewDates.projectPage'),'2026-10-04','Record the fresh City project-page check');
for(const key of ['heightFAQ','scannedReports','financeRow'])assert.equal(run('reviewDates.'+key),'2026-09-13','Keep unrelated source-check dates: '+key);
const septemberAgenda=json('meetingRecords.find(m=>m.id==="meeting-2026-09-16")');
assert.equal(septemberAgenda.title,'No Bridge project item on the agenda');
assert.equal(septemberAgenda.kind,'Agenda review','Do not present a packet review as a meeting outcome');
assert.equal(septemberAgenda.note,'Full agenda packet reviewed October 4, 2026.');
assert.equal(septemberAgenda.links[0].label,'Agenda packet · 160 pages');
const meetingHtml=run('meetingsView()');
assert(meetingHtml.includes(septemberAgenda.note));
assert(!/pages 1–6|full 160-page packet was not read|in this update|recording was not recovered/i.test(meetingHtml),'Remove obsolete working-log wording from the directory');
for(const id of ['meeting-2017-07-19','meeting-2018-04-18','meeting-2019-04-17','meeting-2019-05-15']){
 assert(run('meetingRecords.find(m=>m.id==='+JSON.stringify(id)+').note').includes('No recording was available for review.'),'Retain written-record limitations: '+id);
}
assert(run('meetingRecords.find(m=>m.id==="meeting-2020-02-03").note').includes('The Clerk reported having no recording.'),'Retain the Clerk’s specific recording response');
const projectGatewayLinks=json('meetingRecords.flatMap(m=>m.links).filter(l=>l.url===urls.project&&l.note)');
assert.equal(projectGatewayLinks.length,8);
assert(projectGatewayLinks.every(l=>l.note==='This link opens the City project page, where the document is listed.'),'Store the plain-language destination note directly');
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
for(const [q,want] of [['Delgado cacti','delgado-cacti'],['Kennedy','kennedy-review'],['Mermell three months','mermell-return'],['2019 minutes','meeting-2019-05-15'],['Preserved City records','source-folder'],['Los Angeles Times','lat-2017'],['Kris','markarian-exhausted']]){
 const routes=json(`searchIndex().filter(i=>SearchText.score(i,SearchText.terms(${JSON.stringify(q)}))>0).map(i=>i.route)`);assert(routes.some(r=>r.endsWith('/'+want)),q);
}
const delgadoRoutes=index.filter(i=>i.route.startsWith('speakers/delgado/')).map(i=>i.route).sort();
assert.equal(delgadoRoutes.length,4);
for(const query of ['Julianna Delgado','J. Delgado','J Delgado','Delgado']){
 const matches=json(`searchIndex().filter(i=>i.route.startsWith('speakers/delgado/')&&SearchText.score(i,SearchText.terms(${JSON.stringify(query)}))>0).map(i=>i.route)`);
 assert.deepEqual(matches.sort(),delgadoRoutes,'All Delgado name variants must find all four remarks: '+query);
}
assert(run('searchView("Julianna Delgado cacti")').includes('delgado-cacti'),'Full name and topic must combine');
assert(index.filter(i=>i.route.startsWith('speakers/delgado/')).every(i=>i.title.startsWith('Julianna Delgado · ')),'Display the full name while retaining the initial-based search aliases');
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
 assert(html.includes('The project has gone through successive design rounds without reaching agreement on a permanent concept.'),'Use the approved project summary');
 assert(!html.includes('In April 2018, the City Council chose to pursue a permanent barrier.'),'Do not repeat the introduction above the summary');
 assert(!html.includes('The temporary fence stayed while'),'Remove the superseded process summary');
 assert(!html.includes('<p></p>'),'Omitting the introduction must not leave an empty paragraph');
 assert(!html.includes('class="project-status"'),'Remove status cards that repeat the approved summary');
 assert(!html.includes('The records reviewed for this guide do not show that a final design has been approved.'),'Do not repeat the design status');
 assert(!html.includes('funding to build the barrier still had to be found'),'Do not repeat the funding status');
 assert.equal((html.match(/class="overview-schedule"/g)||[]).length,1,'Keep one compact schedule note');
 assert(html.includes('The City’s target for finishing the design is June 30, 2028. Building the barrier still requires construction funding and contract authorization.'),'Keep the design-versus-construction distinction');
 assert.equal((html.match(/City project page checked: October 4, 2026/g)||[]).length,1,'State the source-check date only once');
 const sourceArea=html.match(/<div class="overview-sources">([\s\S]*?)<\/details><\/div>/)[1];
 assert(sourceArea.includes('<summary>Financial reporting period</summary>'),'Keep the report period beside the source links');
 assert(html.includes('<p class="status-dates">Main research cutoff: September 1, 2026. Later checks are dated with their sources.</p>'),'Show the research cutoff and scoped project-page check beside the summary');
 assert(sourceArea.includes('covers activity through June 30, 2026'),'Retain the report period');
 assert(html.includes('construction funding as unidentified'),'Keep construction funding status in the main summary');
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
const allowedVisibleEntries=new Set(['404.html','404.template.html','print.js','index.html','index.template.html','theme.js','styles.css','noscript.css','search.js','speakers.js','other-speakers.js','resources.js','app.js','bridge-preview.webp','bridge.jpeg','README.md','CNAME','tests','scripts','assets','preserved-records','timeline','alternatives-studied','evidence-and-limits','who-said-what','meetings-and-documents','news-and-commentary','search','sitemap.xml','robots.txt','about','paper']);
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
assert.equal((html.match(/class="remark-card"/g)||[]).length,75);
assert.equal((html.match(/class="directory-card(?: news-card)?"/g)||[]).length,62);
assert(!excludedPublisher.test(html),'Removed unreviewed entries must not appear in rendered views');
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
assert(run('speakerView()').includes('All 23 speakers'));
assert(run('speakerView("other")').includes('35 entries from 15 people'));
assert(!run('speakerView("madison")').includes('class="chronology-note"'));
assert(!run('speakerView("other")').includes('I selected exchanges that bear on'));
assert(run('speakerView()').includes('I selected exchanges that bear on'));
assert(!run('speakerView()').includes('A recurring question does not establish'));
assert(!run('overview()').includes('The record contains both practical delays'));
assert(run('overview()').includes('continuing design work, with no approved permanent design.'));
assert(run('overview()').includes('design funding as secured and construction funding as unidentified.'));
assert(!run('viewMarkup({view:"timeline"})').includes('This describes the reviewed records.'));
assert(!run('newsView()').includes('Reports and columns reflect their publication dates.'));
assert(!run('newsView()').includes('A specific Tribune article link has not been established'));
assert(run('newsView()').includes('Links open the original publisher sites. Some require a subscription.'));
assert(!run('newsView()').includes('San Gabriel Valley Tribune · publisher homepage'));
for(const view of ['timeline','alternatives','speakers']){
 assert(!run('viewMarkup('+JSON.stringify({view})+')').includes('Record note'),view+': record-note blocks removed');
}
assert(run('speakerView()').includes('<strong>Later</strong>'));
assert(run('speakerView()').includes('<summary>Sources</summary>'));
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
  assert.equal(excerpt.includes('excerpt-verification'),['Author-confirmed excerpt','Author-checked quotation'].includes(r.kind)||['jones-continue','madison-response','gordo-staffing'].includes(r.id),'Only specific verification information repeats beside an excerpt');
 }
}
assert(run('remarkExcerpt(speakers.jones.remarks.find(r=>r.id==="jones-continue"))').includes('Speaker and passage checked against the recording.'));
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
console.log(JSON.stringify({mode:bundled?'production bundle':'source files',resizeObserver:!!context.ResizeObserver,speakers:23,entries:75,newEntries:35,quotes:metadata.filter(x=>x.quote).length,writtenEntries:written.length,meetings:34,articles:news.length,filters,indexRecords:index.length,shareControls:(html.match(/data-copy-entry=/g)||[]).length,checks:'preserved data, publisher exclusion, chronology, filters, source-note search, routes, static overview, hero visibility, count units, excerpt verification labels, dated follow-ups, link locators, cache versions, and enlarged-header offsets passed'}));

const personOptions=run('speakerView()').match(/<select id="speaker-person">([\s\S]*?)<\/select>/)[1];
assert.equal((personOptions.match(/<option /g)||[]).length,24);
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
assert(run('aboutView()').includes('I’m Christopher Clark, a longtime Pasadena resident and registered nurse'));
assert(!run('aboutView()').includes('Certified Crisis Specialist'));
assert(!run('aboutView()').includes('suicidology.org'));
assert(run('aboutView()').includes('I research and maintain this independent guide'));
run('navigate("search?q=netting")');run('navigate("speakers/delgado/delgado-cacti")');
assert(elements.content.innerHTML.includes('Return to search results'));
assert(elements.content.innerHTML.indexOf('Return to search results')<elements.content.innerHTML.indexOf('class="remark-card"'));
console.log('September 17 audit regression checks passed');

// The approved plain-language pass changes explanations, not evidence or quotations.
const plainTimeline=run('viewMarkup({view:"timeline"})');
for(const phrase of ['Agreeing to a barrier was only the first step','Planned dates and what happened next','Finishing the design is one step. Building the barrier is another.','if the City approved the funding'])assert(plainTimeline.includes(phrase),phrase);
for(const phrase of ['What does the evidence tell us?','Would deaths move elsewhere?','Research does not identify one best design for every bridge','People chose whether to take part.','using different totals','after outstanding commitments is unresolved','federal American Rescue Plan Act','approximately where each discussion begins'])assert(run('evidence()').includes(phrase),phrase);
assert(run('overview()').includes('What the 2028 date means'));
assert(run('alternatives("netting")').includes('Engineers had not designed the connections'));
assert(run('aboutView()').includes('A word-for-word audio check is identified separately.'));
assert(!run('speakerView()').includes('official-player passage locator'));
assert.equal(run('speakerTopicLabel("effectiveness")'),'Effectiveness and whether deaths move elsewhere');
assert(index.some(x=>x.type==='Selected remark'&&x.text.includes('Speaker and passage at 01:02:09 checked against the recording.')),'Search uses the displayed source-note wording');
assert(run('meetingsView()').includes('Automatically recognized text may contain errors.'));
assert(tablePage.includes('Original documents, searchable copies, and how the copies were made'));
assert(tablePage.includes('after outstanding commitments is unresolved'));
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
assert(run('aboutView()').includes('Its label tells you where the wording comes from.'));
assert(run('aboutView()').includes('A word-for-word audio check is identified separately.'));
assert(run('aboutView()').includes('whether they support or challenge my reading of the record'));
assert(!/The guide and the paper|The fence everyone can see|the author’s/.test(run('aboutView()')),'About identifies ownership in the first person and explains the guide on its own');
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
assert(!fs.readFileSync(path.join(dir,'index.template.html'),'utf8').includes('class="utility-nav"'));
assert(fs.readFileSync(path.join(dir,'index.template.html'),'utf8').includes('href="__ROOT__about/" data-route="about">About</a>'));
assert(run('viewMarkup({view:"overview"})').includes('Read from the beginning →'));
console.log('Search refinement, visible meeting navigation, PDF labels, and narrow comparison checks passed');

// Search keeps metadata and readable source-labeled prose separate.
const remarkItems=index.filter(item=>item.type==='Selected remark');
assert.equal(remarkItems.length,75);
for(const item of remarkItems){
 assert.equal(item.metadata.length,3);
 const preview=json('SearchText.preview('+JSON.stringify(item)+',SearchText.terms('+JSON.stringify(item.title)+'))');
 assert.equal(preview.label,'Summary');
 assert(preview.text.length>0);
 assert(!preview.text.startsWith(item.metadata.join(' ')));
}
const previewSample={title:'Jane Example — Netting',metadata:['July 17, 2024','Public Safety Committee','Netting'],text:'July 17, 2024 Netting. Background sentence. Helicopter rescue needs clearance. Checked against Minutes_2024.pdf.',previewFields:[{label:'Summary',text:'Background sentence. Helicopter rescue needs clearance.'},{label:'Source and verification',text:'Checked against Minutes_2024.pdf.'}]};
assert.equal(json('SearchText.preview('+JSON.stringify(previewSample)+',["helicopter"])').text,'Helicopter rescue needs clearance.');
assert.equal(json('SearchText.preview('+JSON.stringify(previewSample)+',["minutes_2024.pdf"])').label,'Source and verification');
assert(json('SearchText.preview('+JSON.stringify(previewSample)+',["minutes_2024.pdf"])').text.includes('Minutes_2024.pdf'));
assert.equal(json('SearchText.preview('+JSON.stringify(previewSample)+',["2024"])').text,'Background sentence.');
const previews=run('searchView("netting")');
assert(previews.includes('class="result-meta"'));
assert(previews.includes('class="result-excerpt-label"'));
assert.equal(index.filter(item=>item.type!=='Paper'&&run('SearchText.score('+JSON.stringify(item)+',["netting"])')>0).length,30,'Guide matching includes the three additional reviewed netting sources');
assert.equal(index.filter(item=>item.type==='Paper'&&run('SearchText.score('+JSON.stringify(item)+',["netting"])')>0).length,7,'Paper matches include the added 2021 community position on netting');

// All gallery links retain a no-JavaScript image destination; native dialogs
// retain full source captions and restore focus on close.
const gallery=run('designGallery()');
assert.equal((gallery.match(/data-enlarge-image=/g)||[]).length,8);
let dialog,appended=false;
const originalCreateElement=doc.createElement;
doc.createElement=tag=>{
 assert.equal(tag,'dialog');
 dialog={attributes:{},events:{},setAttribute(name,value){this.attributes[name]=value;},addEventListener(type,fn){this.events[type]=fn;},showModal(){this.open=true;},remove(){this.removed=true;}};
 return dialog;
};
doc.body={append(element){assert.equal(element,dialog);appended=true;}};
context.imageTrigger={isConnected:true,focus(){this.focused=true;}};
for(const item of json('designIllustrations')){
 assert(gallery.includes('href="/assets/illustrations/'+item[0]+'.jpeg"'));
 assert(run('openIllustration('+JSON.stringify(item[0])+',imageTrigger)'));
 assert(appended&&dialog.open);
 assert.equal(dialog.attributes['aria-labelledby'],'image-view-title');
 assert(dialog.innerHTML.includes(run('esc('+JSON.stringify(item[6])+')')));
 assert(dialog.innerHTML.includes('#page='+item[2]+'"'));
 assert(dialog.innerHTML.includes('method="dialog"'));
 assert(dialog.innerHTML.includes('autofocus'));
 dialog.events.close();assert(dialog.removed&&context.imageTrigger.focused);
}
assert.equal(run('openIllustration("invalid",imageTrigger)'),false);
doc.createElement=()=>({});
assert.equal(run('openIllustration("canted-webmesh",imageTrigger)'),false,'Unsupported dialog keeps the ordinary link');
doc.createElement=originalCreateElement;
console.log('Readable search previews and progressive image-viewer checks passed');

// September 22: expose already reviewed evidence without upgrading its verification scope.
const aprilEntries=json('speakerEntries("all","all","2026")');
assert.deepEqual(aprilEntries.map(x=>[x.id,x.remark.time]),[
 ['hawkesworth','00:08:10'],['devinck','00:09:15'],['cole','01:59:13'],['maue','02:00:24']
]);
for(const {remark} of aprilEntries){
 assert.equal(remark.sortDate,'2026-04-20');
 assert.equal(remark.body,'Finance Committee / City Council');
 assert.equal(remark.quote,null);
 assert.equal(remark.kind,'Discussion summary');
 assert.equal(remark.topic,'funding');
}
const publicSpeakerPage=run('speakerView()');
assert.equal((publicSpeakerPage.match(/class="source-legend"/g)||[]).length,1);
assert.equal((publicSpeakerPage.match(/<details class="exchange-records">/g)||[]).length,75);
assert(!publicSpeakerPage.includes('<details class="source-detail">'),'Source links and unique notes share one disclosure');
assert(!publicSpeakerPage.includes('The author'),'Reader copy uses direct attribution');
assert(!publicSpeakerPage.includes('does not establish that the requested consideration was redundant'));
assert(!publicSpeakerPage.includes('<option value="2025"'),'Do not offer an empty year');
assert(publicSpeakerPage.includes('Julianna Delgado'));
for(const phrase of ['retained in','sent account','reviewed source note']){
 assert(!publicSpeakerPage.includes(phrase),phrase+': internal language exposed');
 assert(!index.filter(x=>x.type==='Selected remark').some(x=>x.text.includes(phrase)),phrase+': internal search text exposed');
}
const localCountMarkup=run('localCounts()');
assert.equal((localCountMarkup.match(/<table /g)||[]).length,2);
for(const [period,value] of [['2015',4],['2016',2],['2017',10],['2018',4],['2019',1],['2020',0],['2021 through June 13 only',1],['2022',4],['2023 as of the November 15 meeting',2]])assert(localCountMarkup.includes('<th scope="row">'+period+'</th><td>'+value+'</td>'));
for(const phrase of ['Pasadena Now quoted then-City Manager Steve Mermell in September 2018','nine people had died at the bridge in 2017','That difference remains unexplained','not a full-year 2021 count','missing years as zero','separate incident categories','00:25:22','00:56:12'])assert(localCountMarkup.includes(phrase));
assert(run('evidence()').indexOf('id="local-counts"')<run('evidence()').indexOf('id="research"'));
assert(index.some(x=>x.route==='evidence/9'));
assert(!run('meetingsView()').includes('exact row association still needs visual verification'));
console.log('September 22 reader-facing evidence and scope checks passed');

// October 3 consolidation retains the October 1 finding and original destination.
const zoom2023=json('meetingRecords.find(m=>m.id==="meeting-2023-02-22")');
assert.equal(zoom2023.note,"");
assert.equal(zoom2023.links[0].url,"https://us02web.zoom.us/rec/share/gzTld8ZUtAQsW4Whr_091UtnK_6ItwVHh6qOdW7gA-QdFQkWYrd5rTkZAvp1u2-7.uj6ZtRON1D2DrjYW?startTime=1677119497000");
assert.equal(zoom2023.links[0].note,"Availability checked October 1, 2026. Zoom displayed “This recording does not exist.” No replacement recording was verified. The original City-listed URL is retained as a source for the historical account.");
const april2018=json('meetingRecords.find(m=>m.id==="meeting-2018-04-18")');
assert.equal(april2018.links[0].label,"April 23 Council report (through April 18 Public Safety Committee)");
assert.equal(april2018.links[0].url,"https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2018-04-18-Colorado-Street-Bridge-Agenda.pdf");
