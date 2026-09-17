'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const noop=()=>{},nodes={},events={};
const node=id=>nodes[id]??={innerHTML:'',value:'',dataset:{},setAttribute:noop,addEventListener:noop,querySelector:()=>node('heading'),querySelectorAll:()=>[],focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}};
const context={document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener:(type,fn)=>events[type]=fn,documentElement:{dataset:{siteRoot:'./'},style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop}}},location:new URL('https://coloradostreetbridgeproject.com/'),URL,URLSearchParams,addEventListener:noop,history:{pushState(_,__,href){context.location=new URL(href,context.location);}}};
vm.createContext(context);
for(const file of process.argv.includes('--bundle')?['assets/guide.js']:['search.js','speakers.js','other-speakers.js','resources.js','app.js'])vm.runInContext(read(file),context,{filename:file});
const run=code=>vm.runInContext(code,context),json=code=>JSON.parse(run('JSON.stringify('+code+')'));
for(const topic of ['netting','landscaping','staffing','technology']){
  const html=run('alternatives('+JSON.stringify(topic)+')');
  assert(html.includes('data-route="speakers/all?topic='+topic+'"'));
  assert(html.indexOf('class="related-reading"')>html.indexOf('Findings and limits'),'Keep the qualification before the onward link');
  const filtered=run('speakerView("all",'+JSON.stringify(topic)+')');
  assert(filtered.includes('data-route="alternatives/'+topic+'"'));
  assert(run('speakerEntries("all",'+JSON.stringify(topic)+').length')>0);
  events.click({button:0,target:{closest:selector=>selector==='[data-route]'?{dataset:{route:'speakers/all?topic='+topic}}:null},preventDefault:noop});
  assert.equal(run('readRoute().filter'),topic);
  assert.equal(run('readRoute().view'),'speakers');
}
assert(!run('speakerView("all","effectiveness")').includes('data-route="alternatives/effectiveness"'),'Do not invent a topic page');
const entries=json('speakerEntries()'),records=json('meetingRecords');
const matches=records.filter(record=>entries.some(({remark})=>remark.sortDate===record.date&&remark.body===record.body));
assert.equal(matches.length,8);
let matchedEntries=0;
for(const record of records){
  const expected=entries.filter(({remark})=>remark.sortDate===record.date&&remark.body===record.body);
  const html=run('meetingExchangesLink('+JSON.stringify(record)+')');
  if(!expected.length){assert.equal(html,'');continue;}
  matchedEntries+=expected.length;
  assert(html.includes('Jump to '+expected.length+' selected exchange'));
  assert(html.includes('data-route="speakers/all/'+expected[0].remark.id+'"'));
  for(const {remark} of expected){
    assert.equal(json('meetingRecordFor('+JSON.stringify(remark)+')').id,record.id);
    assert(run('meetingDocumentsLink('+JSON.stringify(remark)+')').includes('data-route="meetings/'+record.id+'"'));
  }
}
assert.equal(matchedEntries,70);
const interview=entries.find(({remark})=>remark.body==='Published interview').remark;
assert.equal(run('meetingDocumentsLink('+JSON.stringify(interview)+')'),'','An interview is not a City meeting');
assert.equal(run('meetingRecordFor({sortDate:"2024-07-17",body:"City Council"})'),null,'Date alone must not match');
run('meetingRecords.push({...meetingRecords.find(m=>m.id==="meeting-2024-07-17"),id:"duplicate-for-test"})');
assert.equal(run('meetingRecordFor({sortDate:"2024-07-17",body:"Public Safety Committee"})'),null,'An ambiguous match must not generate a link');
run('meetingRecords.pop()');
const who=read('who-said-what/index.html');
assert(who.includes('Jump to a date (9)'));
assert(who.includes('aria-label="Selected dates"'));
assert(who.includes('Published interview (1)'));
assert(!who.includes('Jump to a meeting'));
assert(!who.includes('Choose another meeting'));
assert.equal((who.match(/class="meeting-record-link"/g)||[]).length,8);
assert.equal((read('meetings-and-documents/index.html').match(/class="record-related"/g)||[]).length,8);
for(const topic of ['netting','landscaping','staffing','technology'])assert(read('alternatives-studied/'+topic+'/index.html').includes('data-route="speakers/all?topic='+topic+'"'));
const css=read('styles.css');
assert(/\.related-reading a, \.meeting-record-link, \.record-related a\s*\{[^}]*min-height:\s*44px/.test(css));
assert(/\.filter-actions\s*\{[^}]*flex-wrap:\s*wrap/.test(css));
console.log(JSON.stringify({mode:process.argv.includes('--bundle')?'bundle':'source',topicPaths:4,matchedMeetings:8,matchedEntries,publishedInterviewsUnmatched:1,checks:'topic round trips, exact date/body matching, ambiguity guard, selected-exchange counts, valid destinations, accurate date index, and touch-size guards passed'}));
