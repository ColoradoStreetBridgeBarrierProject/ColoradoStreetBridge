const fs=require('fs'), vm=require('vm'), assert=require('assert'), path=require('path'), crypto=require('crypto');
const dir=path.resolve(__dirname,'..');
const listeners={}, elements={};
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
function node(id='') {return elements[id]??= {innerHTML:'',value:'',dataset:{view:'overview'},setAttribute(){},addEventListener(type,fn){listeners[id+':'+type]=fn;},querySelector(){return node('heading');},querySelectorAll(){return [];},focus(){},scrollIntoView(){}};}
const doc={getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(type,fn){listeners['document:'+type]=fn;},createElement:()=>({innerHTML:'',querySelectorAll(){return [...this.innerHTML.matchAll(/<(article|aside)\b[^>]*class="[^"]*feature-card[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>({textContent:strip(m[2]),querySelector:()=>({textContent:strip((m[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)||[])[1]||'Project overview')})}));}})};
const context={document:doc,location:{hash:''},URLSearchParams,console,addEventListener(){},history:{pushState(_,__,hash){context.location.hash=hash;}}};
vm.createContext(context);
for(const name of ['search.js','speakers.js','other-speakers.js','resources.js','app.js']) vm.runInContext(fs.readFileSync(dir+'/'+name,'utf8'),context,{filename:name});
const run=code=>vm.runInContext(code,context), json=code=>JSON.parse(run('JSON.stringify('+code+')'));
assert.equal(run('Object.keys(speakers).length'),4);
// Preserve the reviewed speaker and resource data during the hosting migration.
const preserved={
 'speakers.js':'222eb4f923658b098e7be0b5d8e952447da743fc1a0c6c0c0122612ff7484268',
 'other-speakers.js':'9dc05b4bf8aee88ae57ba47450ec66b6c03625dcab0fd347b7e3b1dc2d8f544e',
 'resources.js':'d3f923b5018dd95dc46e0f7c4c0a19ad5f273eef9680da302a72ac8c635582a3'
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
for(const m of html.matchAll(/href="([^"]+)"/g)){const href=m[1].replaceAll('&amp;','&');assert(href.startsWith('#')||href.startsWith('https://'),href);if(href.startsWith('https'))new URL(href);}
const page=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert(page.includes('Independent guide'));
assert(!page.includes('Private preview'));
assert(!page.includes('noindex'));
assert(!page.includes('<iframe'));
assert.equal((page.match(/<img /g)||[]).length,1);
assert(page.includes('src="bridge-preview.webp"'));
assert(!page.includes('src="bridge.jpeg"'));
const base='https://example.org/ColoradoStreetBridge/';
for(const match of page.matchAll(/(?:src|href)="([^"]+)"/g)){
 const value=match[1];
 if(value.startsWith('#')||/^(https:|data:|tel:)/.test(value))continue;
 assert(!value.startsWith('/'),'Asset must work under the project path: '+value);
 assert(new URL(value,base).pathname.startsWith('/ColoradoStreetBridge/'));
 assert(fs.existsSync(path.join(dir,value)),value);
}
const allowed=new Set(['index.html','styles.css','search.js','speakers.js','other-speakers.js','resources.js','app.js','bridge-preview.webp','bridge.jpeg','README.md','.nojekyll','tests']);
assert.deepEqual(fs.readdirSync(dir).filter(name=>!allowed.has(name)),[],'Unexpected public files');
for(const name of ['index.html','app.js','search.js','speakers.js','other-speakers.js','resources.js','README.md']){
 const text=fs.readFileSync(path.join(dir,name),'utf8');
 assert(!/sandbox:|\/workspace\/|libfile_|file_000000|chatgpt\.site/.test(text),name+': internal reference');
}
console.log(JSON.stringify({speakers:19,entries:71,newEntries:35,quotes:metadata.filter(x=>x.quote).length,writtenEntries:written.length,meetings:34,articles:11,filters,indexRecords:index.length,checks:'existing selections unchanged, data, source keys, chronological order, filters, search, all routes, selection events, escaping, and URLs passed'}));
