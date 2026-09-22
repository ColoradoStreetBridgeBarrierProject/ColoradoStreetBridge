'use strict';

// An editorial update does not advance the verification date of older evidence.
const reviewDates = Object.freeze({baseline:'2026-09-01',siteUpdated:'2026-09-22',projectPage:'2026-09-13',heightFAQ:'2026-09-13',scannedReports:'2026-09-13',financeRow:'2026-09-13'});
const financePeriod = '2026-06-30';

// Summaries and locators follow the authenticated sent baseline and preserved City records.
const urls = {
  ...resourceUrls,
  p2020: "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2020-02-03-Public-Safety-Committee-Presentation.pdf",
  fundingRecords: 'https://coloradostreetbridgeproject.com/preserved-records/tables.html#appropriations',
  p2017: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2017-07-19-Public-Safety-Committee-Suicide-Mitigation-Proposals.pdf',
  p2018: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2018-04-18-Colorado-Bridge-Safety-Comm.pdf',
  r2018: 'https://ww2.cityofpasadena.net/2018%20Agendas/Apr_23_18/AR%208.pdf',
  m2018: 'https://ww2.cityofpasadena.net/2018%20Agendas/May_07_18/2018%2004%2023%20CC%20MIN.pdf',
  v2018: 'https://pasadena.granicus.com/MediaPlayer.php?view_id=25&clip_id=4287',
  r2019: 'https://ww2.cityofpasadena.net/2019%20Agendas/May_20_19/AR%207.pdf',
  r2021: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-08-18-Public-Safety-Committee-Agenda.pdf',
  v2021: 'https://pasadena.granicus.com/MediaPlayer.php?view_id=35&clip_id=5742',
  r2022: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2022-09-21-Public-Safety-Committee-Agenda.pdf',
  p2023: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2023-11-15-Public-Safety-Committee-Presentation.pdf',
  v2023: 'https://pasadena.granicus.com/MediaPlayer.php?view_id=35&clip_id=7033',
  vjan24: 'https://pasadena.granicus.com/MediaPlayer.php?view_id=35&clip_id=7088',
  mjan24: 'https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2024-01-09-Design-Commission-Minutes.pdf',
  p2024: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2024-07-17-Public-Safety-Committee-Presentation.pdf',
  v2024: 'https://pasadena.granicus.com/MediaPlayer.php?view_id=35&clip_id=7415',
  m2024: 'https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2024-07-17-PSC-MIN.pdf',
  q426: 'https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-08-24-Finance-Audit-Committee-Agenda.pdf#page=184',
  financeExcerpt: 'https://coloradostreetbridgeproject.com/preserved-records/2026-08-24-finance-p184.pdf',
  transcriptions: 'https://coloradostreetbridgeproject.com/preserved-records/tables.html',
  ocr2021: 'https://coloradostreetbridgeproject.com/preserved-records/2021-08-18-searchable.pdf',
  ocr2022: 'https://coloradostreetbridgeproject.com/preserved-records/2022-09-21-searchable.pdf',
  hpc2021: 'https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-04-20-Historic-Preservation-Commission-Minutes.pdf#page=2',
  v2026: 'https://pasadena.granicus.com/MediaPlayer.php?clip_id=8492&view_id=35',
  balance2026: 'https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-04-20-Finance-Committee-and-or-City-Council-Agenda-Supplemental-Correspondence-Item-1-FY26-CIP-Available-Balance.pdf',
  project: 'https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/',
  rfp: 'https://www.cityofpasadena.net/city-manager/wp-content/uploads/sites/2/2023-02-09-CM-Weekly-Newsletter.pdf#page=2',
  hemmer: 'https://doi.org/10.1371/journal.pone.0169625',
  review: 'https://www.cochrane.org/evidence/CD013543_means-restriction-prevent-suicide-jumping',
  too: 'https://doi.org/10.1017/S0033291725100792',
  clifton: 'https://academic.oup.com/eurpub/article/21/2/204/498489',
  grafton: 'https://pubmed.ncbi.nlm.nih.gov/19440879/',
  house: 'https://www.govinfo.gov/content/pkg/CRPT-119hrpt686/pdf/CRPT-119hrpt686.pdf#page=207'
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const externalLink = url => /^https?:\/\//i.test(url) && new URL(url).hostname !== 'coloradostreetbridgeproject.com';
const linkArrow = url => externalLink(url) ? ' <span aria-hidden="true">↗</span>' : '';
const locatorLabel = label => label.replace(/^Council ·/,'City Council ·').replace(/^Public Safety ·/,'Public Safety Committee ·').replace(/^Finance & Audit ·/,'Finance/Audit Committee ·');
const link = (label, url) => `<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(locatorLabel(label))}${linkArrow(url)}</a>`;

const sourceRecords = {
  2:['Public Safety · July 19, 2017 · Presentation', urls.p2017], 3:['Public Safety · August 18, 2021 · Staff report · PDF p. 2', urls.r2021+'#page=2'],
  4:['Public Safety · September 21, 2022 · Staff report · Scanned PDF', urls.r2022], 5:['Council · April 23, 2018 · Task-force recommendation', urls.r2018],
  6:['Council · April 23, 2018 · Minutes · PDF pp. 4–5', urls.m2018+'#page=4'], 7:['Council · April 23, 2018 · Recording', urls.v2018],
  8:['Council · May 20, 2019 · Staff report', urls.r2019], 9:['Public Safety · August 18, 2021 · Report and attachments · Scanned PDF', urls.r2021],
  10:['Public Safety · February 3, 2020 · Presentation', urls.p2020],
  41:['Capital budgets and approved 2025 transfers', urls.fundingRecords],
  11:['August 2021 recording', urls.v2021], 13:['November 2023 design presentation', urls.p2023],
  14:['November 2023 recording', urls.v2023], 15:['November 2023 recording', urls.v2023],
  16:['July 2024 staff presentation', urls.p2024], 17:['2018 comparison · p. 29', urls.p2018+'#page=29'],
  18:['July 2024 recording', urls.v2024], 19:['July 2024 presentation', urls.p2024],
  20:['July 2024 minutes', urls.m2024], 21:['July 2024 recording', urls.v2024], 22:['July 2024 recording', urls.v2024],
  24:['City Manager · February 9, 2023 · Newsletter · PDF p. 2', urls.rfp], 26:['Finance & Audit · August 24, 2026 · Full packet · PDF p. 184', urls.q426],
  28:['City project page', urls.project], 29:['Bennewith, Nowers & Gunnell · 2011 · European Journal of Public Health', urls.clifton], 30:['2025 systematic review', urls.too],
  31:['April 2026 Finance recording', urls.v2026], 33:['January 2024 Design Commission recording', urls.vjan24],
  34:['House committee report · p. 203', urls.house]
};
function sourceNumbers(value) {
  return String(value).split(',').flatMap(part => {
    const [a,b] = part.trim().split(/[–-]/).map(Number);
    if (!a) return [];
    return b ? Array.from({length:b-a+1},(_,i)=>a+i) : [a];
  });
}
function citations(page, numbers, supplied=[]) {
  const entries = [...supplied, ...sourceNumbers(numbers).map(n=>sourceRecords[n]).filter(Boolean)];
  const byUrl = new Map();
  // Prefer a document locator to its generic label; retain distinct page locators.
  for (const item of entries) {
    const previous=byUrl.get(item[1]);
    if(!previous || item[0].split(' · ').length>previous[0].split(' · ').length)byUrl.set(item[1],item);
  }
  const unique=[...byUrl.values()].filter(([,url])=>url.includes('#') || !entries.some(([,other])=>other.startsWith(url+'#')));
  if (!unique.length) return '';
  const inlineCount=unique.length===4?4:3;
  const primary=unique.slice(0,inlineCount).map(item=>link(...item)).join('');
  const rest=unique.slice(inlineCount).map(item=>link(...item)).join('');
  return `<div class="evidence-links">${primary}</div>${rest?`<details class="more-records"><summary>More supporting records</summary><div class="evidence-links">${rest}</div></details>`:''}`;
}
const head = (_n,title,description) => `<div class="section-head"><div><h2>${title}</h2>${description?'<p>'+description+'</p>':''}</div></div>`;

const topics = {
  netting: {
    name:'Horizontal netting',sub:'Engineering & rescue',tag:'Studied, but not recommended for this bridge',
    title:'Netting was considered more than once.',
    answer:'The record does not say that nets never work. It describes why Pasadena’s reviewers recommended against a net at this particular bridge, while some engineering work remained preliminary.',
    steps:[
      {date:'2017–2018',title:'Netting was part of the original comparison',text:'The City presented a safety-netting concept in 2017. The 2018 task-force comparison rated horizontal netting relatively highly for effectiveness, but poorly for appearance and its effect on emergency services.',result:'The Council’s adopted direction centered on a physical barrier that kept people from reaching the edge.',page:16,refs:'2, 5–7, 17',links:[['2018 comparison · p. 29',urls.p2018+'#page=29']]},
      {date:'Nov 2023',title:'The question returned with new vertical designs',text:'Councilmember Steve Madison asked about horizontal netting and landscaping. Staff said both had been studied and described difficulties involving the bridge’s geometry, structural demands, remaining fall distance, and the appearance of a net beneath its arches.',result:'No permanent design was selected. Further reviews and a survey continued.',page:13,refs:'14–15',links:[['November 2023 recording',urls.v2023]]},
      {date:'Jan 2024',title:'The Design Commission revisited the alternative',text:'Chair Julianna Delgado asked whether a horizontal net or another measure could be used. An off-camera respondent described the earlier review and the Council’s vertical-barrier direction. The records reviewed do not identify that speaker by name or role.',result:'The commission did not reach consensus on a design.',page:15,refs:'33',links:[['January 2024 minutes',urls.mjan24],['Recording · go to ~00:41:27',urls.vjan24]]},
      {date:'Jul 2024',title:'Staff presented a more detailed review',text:'Staff presented preliminary engineering work, Golden Gate consultation, and rescue concerns. Fire Chief Chad Augustin could not recommend netting from a public-safety standpoint. Staff reported that the expert-review recommendation against it was unanimous.',result:'Staff recommended against netting, but it remained in the committee’s discussion. No permanent design was sent to the full Council.',page:16,refs:'16, 18, 20–22',links:[['2024 presentation · p. 48',urls.p2024+'#page=48'],['Recording · Fire at ~00:34:00',urls.v2024]]}
    ],
    limit:'The 2024 engineering work was unfinished. Engineers had not designed the connections, and more study was needed to determine whether the bridge itself would need changes. City reviewers recommended against netting at this bridge. But that recommendation does not mean a completed design proved a net could not be built.',limitPage:29,limitRefs:'16–17'
  },
  landscaping: {
    name:'Trees & landscaping',sub:'Alongside a barrier or instead of one?',tag:'Considered as an addition to a barrier',
    title:'The task force examined planting below the bridge.',
    answer:'The 2018 report found no verifying scientific data for using trees below the bridge to cushion a landing or discourage an attempt. It treated trees as a possible addition to a vertical barrier, not a replacement.',
    steps:[
      {date:'2017–2018',title:'Trees were proposed and assessed',text:'Public speakers and Councilmember Tyron Hampton supported planting below the bridge. The task force reviewed the idea alongside fencing, netting, patrols, and technology.',result:'The 2018 report identified both an evidence gap and areas where planting could not occur.',page:5,refs:'2, 5, 7',links:[['Task-force report · p. 3',urls.r2018+'#page=3']]},
      {date:'Nov 2023',title:'Landscaping returned to the discussion',text:'During review of three new barrier concepts, Councilmember Steve Madison asked about horizontal netting and landscaping below the bridge. Staff said both approaches had already been studied.',result:'The new design process continued without selection of a permanent design.',page:13,refs:'5, 14',links:[['Recording · trees at ~00:33:24',urls.v2023]]},
      {date:'Jan 2024',title:'Below-bridge suggestions returned at design review',text:'Design Commission Chair Julianna Delgado asked about landscaping, suggested cacti, and relayed a public suggestion for apartment buildings below the bridge. The responding speakers discussed existing buildings and the safety rationale for keeping people on the bridge deck.',result:'The commission reached no consensus on the presented designs. These suggestions were discussion, not adopted safety measures.',page:15,refs:'33',links:[['Recording · cacti at ~00:47:03',urls.vjan24],['Design Commission minutes',urls.mjan24]]},
      {date:'Jul 2024',title:'Ground cover and layered netting came back',text:'Madison asked about ground cover, physical impediments, and layered netting. Staff and consultants again discussed limits involving fall distance, structure, cost, and appearance.',result:'The below-bridge alternatives remained part of the discussion while the permanent design was unresolved.',page:19,refs:'18, 22',links:[['Recording · ground cover at ~01:06:01',urls.v2024]]}
    ],
    limit:'The report did not find scientific evidence supporting the proposed use of trees instead of a barrier. That does not mean every possible use of landscaping had been tested.',limitPage:26,limitRefs:'5'
  },
  staffing: {
    name:'Staffing & patrols',sub:'Coverage, cost & response',tag:'Staff advised against replacing a barrier with patrols',
    title:'Staffing was discussed at several meetings.',
    answer:'City staff examined cost and practical coverage. They treated human presence as something that could accompany a physical barrier, while repeatedly advising against relying on staffing to replace it.',
    steps:[
      {date:'2017–2018',title:'Patrol was among the alternatives',text:'The task force’s review included police presence, patrols, technology, and physical barriers. It distinguished measures that restrict access from measures that make intervention more likely.',result:'The Council adopted a direction centered on a physical barrier.',page:5,refs:'2, 5–7',links:[['2018 task-force report',urls.r2018]]},
      {date:'Aug 2021',title:'Around-the-clock staffing was proposed',text:'Councilmember Tyron Hampton proposed staffing the bridge 24 hours a day. City Manager Steve Mermell said it had been suggested before, would likely cost several hundred thousand dollars annually, and was not feasible as a replacement. Mayor Victor Gordo proposed a model based on Old Pasadena’s hosts and guides: personnel who could observe, report concerns, and offer historical information.',result:'Further examination of staffing alongside a barrier remained in the discussion.',page:10,refs:'11, 15',links:[['Recording · staffing at ~01:26:44',urls.v2021]]},
      {date:'Nov 2023',title:'Staff explained the coverage problem',text:'Public Works staff member Kris Markarian described continuous coverage, multiple personnel, liability concerns, and incidents outside ordinary working hours. Gordo asked for more work on trained security and a daytime human presence. Councilmember Steve Madison questioned response speed.',result:'The committee requested additional staffing analysis.',page:14,refs:'15',links:[['Recording · response at ~00:47:01',urls.v2023]]},
      {date:'Jul 2024',title:'Annual cost estimates were presented',text:'The requested estimates were roughly $600,000 a year for private security and $1.16 million a year for law-enforcement coverage. Councilmember Justin Jones asked whether staffing was being ruled out because of cost, effectiveness, or both. Staff answered both.',result:'Staff continued to recommend a physical barrier as the primary measure.',page:17,refs:'16, 18',links:[['July 2024 presentation',urls.p2024],['Recording · Jones at ~01:16:54',urls.v2024]]}
    ],
    limit:'These are the City’s staffing estimates and staff assessments, not a study proving that every staffing arrangement would fail. Staff might provide another chance to help someone, but that is different from replacing a barrier.',limitPage:29,limitRefs:'15–18'
  },
  technology: {
    name:'Cameras & technology',sub:'Recognizing a crisis and responding',tag:'Discussed as ways to add protection alongside a barrier',
    title:'Technology was part of the review from the beginning.',
    answer:'Cameras, sensors, phones, and later remote intervention were considered as ways to detect a crisis or help someone respond. The City’s reviewed approach continued to treat these tools as additions to physical protection.',
    steps:[
      {date:'2017–2018',title:'The task force reviewed detection and communication',text:'The reviewed options included cameras, motion sensors, crisis phones, signs, and lighting, alongside physical barriers and patrols.',result:'The adopted direction centered on a physical barrier, with other measures potentially playing a supporting role.',page:5,refs:'2, 5–7',links:[['2018 safety presentation',urls.p2018]]},
      {date:'Jul 2024',title:'Staff returned with technology analysis',text:'The July presentation included technology analysis in the requested work. Councilmember Tyron Hampton raised cameras and motion detection as possible supplements to a barrier.',result:'The technology discussion continued alongside the two remaining staff design options.',page:18,refs:'16, 20–21',links:[['July 2024 presentation',urls.p2024],['July 2024 minutes',urls.m2024]]},
      {date:'Jul 2024',title:'Remote intervention was proposed',text:'Mayor Victor Gordo asked about cameras and a way to communicate remotely with a person in crisis. Staff continued to treat those tools as possible supplements to a physical barrier.',result:'This was a proposal under discussion. The passage does not document approval or installation of that system.',page:19,refs:'18',links:[['Recording · proposal at ~01:14:21',urls.v2024]]}
    ],
    limit:'Discussing a system or asking for more study does not mean it was funded, installed, staffed, or tested. This guide does not establish that a camera-and-communication system is currently operating.',limitPage:19,limitRefs:'16, 18, 20–21'
  }
};

const timeline = [
  {date:'Jul 2017',title:'Emergency fencing around the seating areas',text:'Pasadena fenced the restored seating alcoves, the recessed areas with benches. A task force with members from several fields then studied longer-term protection.',result:'An emergency response began while a permanent approach was being developed.',page:4,refs:'2, 4–5',links:[['2017 City presentation',urls.p2017]]},
  {date:'Apr 2018',title:'The Council agreed on a physical barrier',text:'On April 23, the Council unanimously approved the task force’s recommendation to pursue a permanent physical barrier. Steve Madison moved approval, and Tyron Hampton seconded it.',result:'Policy direction was approved. A finished permanent design was not.',page:7,refs:'5–7',links:[['Council minutes',urls.m2018],['Task-force report',urls.r2018]]},
  {date:'Sep 2018',title:'The emergency fence extended along the bridge',text:'After a prolonged intervention over Labor Day weekend, the City Manager issued an emergency purchase order for full-length temporary fencing.',result:'The emergency measure remained while the design process continued.',page:5,refs:'4, 28',links:[['City’s 2022 account',urls.r2022]]},
  {date:'May 2019',title:'The first design contract was approved',text:'The Council approved the Donald MacDonald Architects contract after a revised proposal shortened the design schedule by ten months and reduced the proposed contract from $700,000 to $500,000. The forecast placed Council concept approval in December 2019 and construction in August 2020, if the City approved the funding. These were estimated dates. Funding for construction had not been approved.',result:'The anticipated schedule put Council concept approval in December 2019 and construction in August 2020, if the City approved the funding. These were estimated dates, not completed work or promises backed by approved construction funding.',page:8,refs:'8',links:[['May 2019 staff report · PDF p. 4',urls.r2019+'#page=4']]},
  {date:'Aug 2021',title:'Mockups reached the committee, but no design was selected',text:'After full-scale mockups and advisory reviews, the Public Safety Committee requested further design work, community input, and analysis.',result:'The committee did not recommend a permanent design.',page:8,refs:'9, 11',links:[['August 2021 staff report',urls.r2021],['Meeting recording',urls.v2021]]},
  {date:'2022–2023',title:'The design process restarted with another consultant',text:'The September 2022 report scheduled a Public Safety Committee return for September 2023. The first request for proposals received no proposals. A February 2023 newsletter forecast a return by year-end. The City invited proposals again and awarded the Apexx Architecture contract on April 14, 2023.',result:'The committee-return forecast had moved from September to the end of 2023 before the new concepts were presented.',page:12,refs:'4, 13, 24',links:[['Public Safety · September 21, 2022 · Schedule · PDF p. 3',urls.r2022+'#page=3'],['City Manager · February 9, 2023 · Newsletter · PDF p. 2',urls.rfp]]},
  {date:'Nov 2023',title:'Three new concepts, more questions, and further review',text:'Canted webmesh, vertical webmesh, and metal pickets were presented on November 15. Members again asked about netting, landscaping, staffing, and whether deaths would move elsewhere.',result:'The return came after the original September 2023 target but within the later year-end forecast. Commission reviews and a survey continued. No permanent design was selected.',page:13,refs:'13–15',links:[['Public Safety · November 15, 2023 · Concepts',urls.p2023],['February 2023 forecast · PDF p. 2',urls.rfp],['Meeting recording',urls.v2023]]},
  {date:'Jan–Jul 2024',title:'Review narrowed the options without a final selection',text:'The Design Commission reached no consensus in January. By July, staff’s options had narrowed to vertical webmesh and metal pickets, and staff returned with patrol costs, netting analysis, rescue concerns, and survey results.',result:'No permanent design was sent to the full Council. Further design work, feedback, and reviews were scheduled.',page:15,refs:'16–22, 33',links:[['January minutes',urls.mjan24],['July minutes',urls.m2024]]},
  {date:'2025–2026',title:'The design schedule moved again',text:'City project reports moved the target for finishing the design to June 30, 2028. The report covering work through June 30, 2026 said the options were still being evaluated and design work was continuing.',result:'June 2028 was a design-phase target. It was not a funded construction-completion commitment.',page:19,refs:'26',links:[['Year-end project row · p. 184',urls.q426]]},
  {date:'Reviewed record',title:'Design and construction remained separate decisions',text:'The reviewed records showed no final permanent-design approval or construction award. The City project page said design was funded and construction funding remained to be identified.',result:'This describes the reviewed records. It is not a new live-status check.',page:20,refs:'26–28, 31, 34',links:[['City project page',urls.project],['April 2026 funding discussion',urls.v2026]]}
];

// Retain existing numeric timeline links when inserting a historical event.
timeline.forEach((entry,index)=>{entry.id=String(index);});
timeline.splice(4,0,{"id":"2020-02-03","date":"Feb 2020","title":"Design alternatives and a March–May forecast","text":"The February 2020 presentation compared straight mesh, pickets, curved mesh, and a hybrid. It projected mockup installation in March, commission reviews in April, and a committee recommendation and Council approval in May. At the meeting, Kennedy requested a cost estimate for enclosing the bridge with a roof before Council consideration.","result":"The minutes record that the committee received and filed the information. The March–May dates were forecasts, not completed approvals.","page":8,"refs":"10","note":"The February 3, 2020 presentation separates the task force’s recommended minimum height from the consultant’s broader design criteria. Those criteria included height, resistance to climbing, historic preservation, appearance, and emergency access. Slides 10–27 show the design options and their different dimensions.\n\nSlide 30 ranks curved mesh highest among the options shown, but it does not identify the final mesh type.\n\nSlide 31 gives the projected schedule for March through May. Kennedy’s request for a roof over the barrier appears in the meeting minutes on page 2, not in the presentation. Page 3 says the committee received and filed the information; it does not say the committee approved a permanent design.",links:[['February 2020 presentation · Schedule · Slide 31',urls.p2020+'#page=31'],['Preserved February 2020 minutes · PDF',urls.minutes20200203],['Preserved February 2020 agenda packet · PDF',urls.agenda20200203]]});

// Milestone annotations belong to the chronology records. Both views use these
// same objects, titles, dates, and source destinations, not a second timeline.
const milestoneNotes = {
  '0':['Jul 2017','Temporary fencing was placed around the seating alcoves.'],
  '1':['Apr 2018','The Council decision set a direction for a permanent barrier. It was not an installation.'],
  '2':['Sep 2018','The temporary fence was extended along the bridge.'],
  '4':['Aug 2021','Full-size mockups were reviewed. They were not a completed permanent barrier.'],
  '6':['Nov 2023','The new concepts were proposed designs, not installed barriers.'],
  '7':['Jan–Jul 2024','The two remaining staff options were design concepts, not a completed installation.'],
  '8':['2025–2026','The reviewed report described continuing design work, not completion of a permanent barrier.']
};
for(const entry of timeline){
  if(Object.hasOwn(milestoneNotes,entry.id)){
    const [label,bridge]=milestoneNotes[entry.id];
    entry.milestone={label,bridge};
  }
}
function milestoneDetail(entry){return `<p class="milestone-date">${esc(entry.date)}</p><h3 class="milestone-title">${esc(entry.title)}</h3><div class="milestone-tracks"><div><p class="milestone-track-label">On the bridge</p><p>${esc(entry.milestone.bridge)}</p></div><div><p class="milestone-track-label">Project decisions and work</p><p>${esc(entry.text)}</p></div></div><a class="milestone-record-link" href="${esc(routeHref('timeline/'+entry.id))}" data-route="timeline/${esc(entry.id)}">Read this milestone’s full record and sources →</a>${entry.id==='7'?`<a class="milestone-record-link" href="${esc(routeHref('alternatives'))}" data-route="alternatives">See the City’s design illustrations →</a>`:''}`;}
function milestoneExplorer(){
  const entries=timeline.filter(entry=>entry.milestone);
  return `<section class="milestone-explorer" aria-labelledby="milestone-heading"><h2 id="milestone-heading">Explore the key milestones</h2><p class="milestone-intro">Physical changes and project decisions, side by side. The complete chronology remains below.</p><div id="milestone-controls" class="milestone-controls" role="group" aria-label="Choose a project milestone" hidden>${entries.map((entry,index)=>`<button type="button" class="milestone-button" data-milestone="${esc(entry.id)}" aria-controls="milestone-detail" aria-pressed="${index===0?'true':'false'}">${esc(entry.milestone.label)}</button>`).join('')}</div><div id="milestone-detail" class="milestone-detail" role="region" aria-label="Selected milestone" aria-live="polite" aria-atomic="true">${milestoneDetail(entries[0])}</div><p class="milestone-scope">Selected milestones, not a time-scaled chart. Later entries describe the reviewed records, not a new live-status check.</p></section>`;
}
function selectMilestone(id){
  const entry=timeline.find(item=>item.id===id&&item.milestone);
  const panel=document.getElementById('milestone-detail');
  if(!entry||!panel)return;
  panel.innerHTML=milestoneDetail(entry);
  document.querySelectorAll('[data-milestone]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.milestone===id)));
}
const decisionProcess = Object.freeze({
  title:'Who decides what?',
  intro:'The City’s project records distinguish four roles:',
  roles:[
    ['Public Works and the design team','City staff and hired architects and engineers develop and refine the designs, drawing on technical advice and public input.'],
    ['Historic Preservation Commission and Design Commission','Provide advisory review and comments on the proposed designs. Their recommendations are not final approval of a barrier.'],
    ['Public Safety Committee','Reviews the work, gives staff direction, and makes a recommendation to the City Council.'],
    ['City Council','Approves a barrier concept and the next steps. A committee recommendation is not Council approval.']
  ],
  remaining:'After concept approval, the City still has to complete detailed design, environmental documents, and construction documents. Building the barrier also requires construction funding and contract authorization.',
  status:'The records reviewed for this guide describe continuing design work and further review. They do not establish a confirmed date for the next Bridge decision.'
});
function decisionProcessView(){return `<details id="who-decides" class="decision-process scroll-focus" tabindex="-1"><summary>${esc(decisionProcess.title)}</summary><div role="region" aria-label="Who decides what?"><p>${esc(decisionProcess.intro)}</p><dl>${decisionProcess.roles.map(([role,text])=>`<dt>${esc(role)}</dt><dd>${esc(text)}</dd>`).join('')}</dl><p>${esc(decisionProcess.remaining)}</p><p>${esc(decisionProcess.status)}</p>${citations(null,'',[
  ['November 2023 presentation · PDF p. 34 · Decision process',urls.p2023+'#page=34'],
  ['August 2021 report · PDF p. 4 · Work after concept approval',urls.r2021+'#page=4'],
  ['August 2026 project report · PDF p. 184',urls.q426],
  ['City project page · Design team and funding',urls.project]
])}</div></details>`;}
function timelineView(){return head('02','Agreeing to a barrier was only the first step','Follow the project from emergency fencing to questions about what permanent barrier to build and how to pay for it.')+`<p class="quick-links"><a href="${esc(routeHref('timeline'))}#chronology">Skip to the full chronology</a><a href="${esc(routeHref('timeline'))}#forecast-heading">Compare planned dates with what happened</a></p><p class="bridge-history-note">Before this project: the bridge opened in 1913 and reopened after restoration in 1993. This guide follows the barrier project from 2017. <a href="https://www.nps.gov/places/colorado-street-bridge.htm" target="_blank" rel="noopener noreferrer">National Park Service history ↗</a></p>`+decisionProcessView()+milestoneExplorer()+'<h2 id="chronology" class="scroll-focus" tabindex="-1">The full chronology</h2><p class="timeline-key">Open the source section under an entry to see its supporting records.</p>'+steps(timeline,true)+forecastComparison();}
function steps(items, year=false){return `<div class="timeline ${year?'year-timeline':''}">${items.map(s=>`<article class="timeline-item" data-timeline-id="${esc(s.id??'')}"><div class="timeline-date">${esc(s.date)}</div><div class="timeline-entry"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><details><summary>Read the supporting record</summary>${s.note?s.note.split('\n\n').map(p=>`<p>${esc(p)}</p>`).join(''):''}${citations(s.page,s.refs,s.links)}</details></div></article>`).join('')}</div>`;}

function overview(){return head('01','Why is the fence still there?','')+`
  <article class="feature-card lead overview-summary"><p class="eyebrow">THE SHORT VERSION</p><p class="large">In 2018, Pasadena decided to pursue a permanent suicide prevention barrier on the Colorado Street Bridge. More than eight years later, the temporary fence remains.</p><p>The City has studied designs and alternatives, built full-size examples, and gathered public feedback. But as of September 2026, the records reviewed for this guide do not show an approved permanent design or secured construction funding.</p>
  <p class="overview-schedule"><strong>What the 2028 date means</strong> The City’s target for finishing the design is June 30, 2028. That is not a date for completing the barrier.</p></article>
  <nav class="next-cards" aria-label="Explore the project"><a class="next-card" href="${esc(routeHref('timeline'))}" data-go="timeline"><strong>How did the schedule change?</strong><span>In May 2019, construction was expected in August 2020 if the City approved the funding. See what happened next.</span><span class="action">The timeline →</span></a><a class="next-card" href="${esc(routeHref('alternatives'))}" data-go="alternatives"><strong>What alternatives were studied?</strong><span>See the upright barrier designs and the reviews of netting, trees, patrols, and cameras.</span><span class="action">The alternatives →</span></a><a class="next-card" href="${esc(routeHref('evidence'))}" data-go="evidence"><strong>Why would a barrier help?</strong><span>Read what prevention research tells us and what it does not answer.</span><span class="action">The evidence →</span></a></nav>
  <p class="quick-links"><a href="${esc(routeHref('timeline/who-decides'))}" data-route="timeline/who-decides">Who decides what?</a><a href="${esc(routeHref('evidence/funding'))}" data-route="evidence/funding">Funding and schedule</a><a href="${esc(routeHref('evidence/surveys'))}" data-route="evidence/surveys">The local surveys</a></p>
  <div class="overview-sources"><p>Supporting records</p>${link('City project page',urls.project)} ${link('April 2018 Council minutes · PDF pp. 4–5',urls.m2018+'#page=4')}<p>August 24, 2026 Finance/Audit packet, project row on p. 184: ${link('Page excerpt',urls.financeExcerpt)} ${link('Full packet',urls.q426)}</p><details class="source-detail"><summary>Source dates and funding note</summary><p>City project page checked ${formatDate(reviewDates.projectPage)}. The Finance/Audit report covers activity through June 30, 2026. A funding request does not mean the money has been awarded.</p></details></div>
  `;}

const designIllustrations=[
['temporary-fence','Temporary chain-link fence',6,1389,525,'Photograph looking along the bridge roadway, with chain-link fencing on both sides.','Photograph reproduced on slide 6. The presentation does not say when the photograph was taken. This is not a photograph taken for the September 2026 update.'],
['metal-pickets','Metal picket concept',12,734,820,'City concept rendering with closely spaced vertical metal pickets beside the bridge lamps.','Design illustration, slide 12. Shows closely spaced upright metal bars, not a barrier that has been built.'],
['vertical-webmesh','Vertical webmesh concept',13,734,820,'City concept rendering with upright posts supporting fine mesh along the balustrade.','Design illustration, slide 13. Shows mesh held by upright posts, not a barrier that has been built.'],
['canted-webmesh','Canted webmesh concept',14,734,820,'City concept rendering with angled posts supporting mesh over the edge of the sidewalk.','Design illustration, slide 14. Shows mesh held by angled posts. Included for comparison. The summary of commission feedback on slide 16 says this option was eliminated.']
];
function openIllustration(key,trigger){
  const illustration=designIllustrations.find(item=>item[0]===key);
  if(!illustration)return false;
  const dialog=document.createElement('dialog');
  if(typeof dialog.showModal!=='function')return false;
  const [file,title,page,width,height,alt,caption]=illustration;
  const imageUrl=siteBase+'assets/illustrations/'+file+'.jpeg';
  dialog.className='image-viewer';
  dialog.setAttribute('aria-labelledby','image-view-title');
  dialog.setAttribute('aria-describedby','image-view-caption');
  dialog.innerHTML=`<form method="dialog" class="image-view-close"><button type="submit" autofocus>Close image</button></form><h2 id="image-view-title">${esc(title)}</h2><figure><img src="${esc(imageUrl)}" width="${width}" height="${height}" alt="${esc(alt)}"><figcaption id="image-view-caption">${esc(caption)}</figcaption></figure><p class="image-view-links"><a href="${esc(imageUrl)}" target="_blank" rel="noopener noreferrer">Open full-size image</a><a href="${esc(urls.p2024+'#page='+page)}" target="_blank" rel="noopener noreferrer">View source presentation · City of Pasadena · July 17, 2024 · Slide ${page}</a></p>`;
  dialog.addEventListener('close',()=>{dialog.remove();if(trigger.isConnected)trigger.focus({preventScroll:true});},{once:true});
  document.body.append(dialog);
  dialog.showModal();
  return true;
}
function designGallery(){return `<section class="design-gallery" aria-labelledby="design-gallery-title"><h2 id="design-gallery-title">The temporary fence and proposed permanent barriers</h2><p class="topic-orientation">The temporary chain-link fence is different from the proposed permanent barriers. These images come from the City’s July 17, 2024 presentation. They show what the designs look like, not which options are still being considered.</p><div class="design-grid">
${designIllustrations.map(([file,title,page,width,height,alt,caption])=>`<figure><a href="${siteBase}assets/illustrations/${file}.jpeg" data-enlarge-image="${file}" aria-label="Enlarge image: ${esc(title)}"><img src="${siteBase}assets/illustrations/${file}.jpeg" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${esc(alt)}"></a><figcaption><strong>${esc(title)}</strong>${esc(caption)} <a class="image-enlarge-link" href="${siteBase}assets/illustrations/${file}.jpeg" data-enlarge-image="${file}" aria-label="Enlarge image: ${esc(title)}">Enlarge image</a><a class="source-link" href="${esc(urls.p2024+'#page='+page)}" target="_blank" rel="noopener noreferrer">View source presentation · City of Pasadena · July 17, 2024 · Slide ${page}</a></figcaption></figure>`).join('')}
</div><p class="locator-note">Earlier curved-mesh mockups and the February 2020 enclosure request belong to different stages of the project. <a href="${esc(routeHref('timeline/2020-02-03'))}" data-route="timeline/2020-02-03">Read the February 2020 record.</a> Images are included to explain the designs and are credited to the City.</p></section>`;}

const topicIntroductions = Object.freeze({
  netting:'Follow Pasadena’s review of horizontal netting, including engineering, rescue, and preservation concerns.',
  landscaping:'Follow the discussions of trees and other planting below the bridge, and the limits of the evidence reviewed.',
  staffing:'Follow proposals for staffing and patrols, the City’s cost estimates, and the distinction between adding personnel and replacing a barrier.',
  technology:'Follow proposals for cameras, sensors, and remote communication as additions to physical protection.'
});
function topicExchangeLink(key){
  const route='speakers/all?topic='+key;
  return `<nav class="related-reading" aria-label="Continue reading"><a href="${esc(routeHref(route))}" data-route="${esc(route)}">Selected exchanges: ${esc(speakerTopicLabel(key))} →</a></nav>`;
}
function alternatives(key){
  const selected=Object.hasOwn(topics,key),t=topics[selected?key:'netting'];
  const navigation=`<nav class="topic-menu" aria-label="Approaches considered">${Object.entries(topics).map(([id,x])=>`<a href="${esc(routeHref('alternatives/'+id))}" data-topic="${id}" aria-current="${key===id?'page':'false'}">${esc(x.name)}<small>${esc(x.sub)}</small></a>`).join('')}</nav>`;
  if(!selected)return head('03','What alternatives were studied?','Start with the upright barrier designs. Then choose another approach to see what was studied and what people said about it.')+`<p class="quick-links"><a href="${esc(routeHref('alternatives'))}#other-approaches">Skip to netting, landscaping, patrols, and technology</a></p>`+designGallery()+`<h2 id="other-approaches" class="scroll-focus" tabindex="-1">Other approaches studied</h2><p class="topic-orientation">These reviews took place as the City pursued the Council’s decision to develop a permanent barrier.</p><div class="approach-grid">${Object.entries(topics).map(([id,x])=>`<article class="approach-card"><h3><a href="${esc(routeHref('alternatives/'+id))}" data-topic="${id}">${esc(x.name)}</a></h3><p>${esc(x.answer)}</p><a class="approach-link" href="${esc(routeHref('alternatives/'+id))}" data-topic="${id}">Read the ${esc(x.name.toLowerCase())} record →</a></article>`).join('')}</div>`;
  return head('03',esc(t.name),esc(topicIntroductions[key]))+`<p class="quick-links"><a href="${esc(routeHref('alternatives'))}" data-route="alternatives">← All barrier designs and alternatives</a></p><article class="topic-answer"><h3 id="topic-title" class="scroll-focus" tabindex="-1">${esc(t.title.replace(/\.$/,''))}</h3><p>${esc(t.answer)}</p></article><div class="topic-layout">${navigation}<div class="topic-main">${steps(t.steps)}<div class="note"><p><strong>Findings and limits</strong></p><p>${esc(t.limit)}</p>${citations(t.limitPage,t.limitRefs)}</div>${topicExchangeLink(key)}</div></div>`;
}

function localCounts(){return `<section class="evidence-section" id="local-counts" tabindex="-1"><h2>What the local death counts show</h2><article data-evidence-id="9" class="feature-card wide"><h3>Available counts, with gaps and partial years</h3><p>The available figures do not give a complete total since the full-length temporary fence was installed in September 2018. The police table and later oral updates cover different periods and are shown separately below.</p>
<table class="local-counts-table"><caption>Police Department table presented August 18, 2021</caption><thead><tr><th scope="col">Year or period</th><th scope="col">Deaths</th></tr></thead><tbody><tr><th scope="row">2015</th><td>4</td></tr><tr><th scope="row">2016</th><td>2</td></tr><tr><th scope="row">2017</th><td>10</td></tr><tr><th scope="row">2018</th><td>4</td></tr><tr><th scope="row">2019</th><td>1</td></tr><tr><th scope="row">2020</th><td>0</td></tr><tr><th scope="row">2021 through June 13 only</th><td>1</td></tr></tbody></table>
<p class="quiet">The table covers January 1, 2015 through June 13, 2021. Another contemporaneous City account reported nine deaths in 2017, rather than ten. That difference remains unexplained. The 2018 figure covers time both before and after full-length fencing. The final row is not a full-year 2021 count.</p><p>${link('2021 staff report · Police tables · p. 2',urls.r2021+'#page=2')} ${link('Transcribed death and incident tables',urls.transcriptions+'#police-2021')}</p>
<table class="local-counts-table"><caption>Separate oral update at Public Safety on November 15, 2023</caption><thead><tr><th scope="col">Year or period reported</th><th scope="col">Deaths reported</th></tr></thead><tbody><tr><th scope="row">2022</th><td>4</td></tr><tr><th scope="row">2023 as of the November 15 meeting</th><td>2</td></tr></tbody></table>
<p>Police Lieutenant Brad May reported these figures and distinguished deaths from attempts. Public Works Director Tony Olmos later repeated them and specified that they concerned the bridge.</p><p>${link('May’s oral update · go to 00:25:22',urls.v2023)} ${link('Olmos’s clarification · go to 00:56:12',urls.v2023)}</p>
<p class="quiet">The oral figures and approximate times were previously checked against the official recording. They are not a reconciled annual dataset. The reviewed records do not supply the rest of 2021 or complete counts for 2023–2026. Do not combine these fragments into a complete “since the fence” total, treat missing years as zero, or use the table alone to measure the fence’s effect. Death counts and the report’s separate incident categories should not be added together.</p></article></section>`;}

function evidence(){return head('04','What does the evidence tell us?','Read the prevention studies, local surveys, and financial records, with the limits of each.')+`
  <nav class="section-jumps" aria-label="On this page"><a href="${esc(routeHref('evidence/local-counts'))}" data-route="evidence/local-counts">Local death counts</a><a href="${esc(routeHref('evidence/research'))}" data-route="evidence/research">Research findings</a><a href="${esc(routeHref('evidence/design-criteria'))}" data-route="evidence/design-criteria">Design questions</a><a href="${esc(routeHref('evidence/surveys'))}" data-route="evidence/surveys">Local surveys</a><a href="${esc(routeHref('evidence/funding'))}" data-route="evidence/funding">Funding and schedule</a><a href="${esc(routeHref('evidence/unresolved'))}" data-route="evidence/unresolved">Unresolved questions</a><a href="${esc(routeHref('evidence/sources'))}" data-route="evidence/sources">Using the sources</a></nav>${localCounts()}
  <div class="evidence-copy"><section class="evidence-section" id="research" tabindex="-1"><h2>What prevention research supports</h2><article data-evidence-id="1" class="feature-card lead"><span class="pill">Why a barrier can help</span><h3>A barrier can create time</h3><p>The research describes how interrupting access can allow an immediate crisis to ease or create an opportunity for intervention. The Clifton Suspension Bridge study reported fewer deaths and staff accounts of more time to intervene, even without fewer incidents.</p><p class="quiet">Clifton also used cameras and patrols, so the study cannot show that extra time alone explained the results. Research on how long a crisis lasts also does not give one timeline that applies to everyone.</p>${citations(18,'19, 29',[['Bennewith, Nowers & Gunnell · 2011 · European Journal of Public Health',urls.clifton],['2024 presentation · p. 43',urls.p2024+'#page=43']])}</article>
<article data-evidence-id="2" class="feature-card"><span class="pill">Would deaths move elsewhere?</span><h3>Deaths do not necessarily move to another site</h3><p>The research summarized here challenges the assumption that restricting one site simply moves every death elsewhere. Longer follow-up can also change an initial finding, as it did at Toronto’s Bloor Viaduct.</p><p class="quiet">The 2025 review combined results from several studies. It found no clear increase at other sites and fewer deaths using the same method overall. It did not detect a reduction across all suicide methods combined, and some comparison-site data were limited.</p>${citations(32,'30',[['2025 review',urls.too]])}</article></section>
<section class="evidence-section" id="design-criteria" tabindex="-1"><h2>What the research does not decide about Pasadena’s design</h2><article data-evidence-id="3" class="feature-card"><span class="pill">Local design choice</span><h3>Research does not identify one best design for every bridge</h3><p>The Swiss study cited in the early City presentations grouped complete vertical barriers and nets together. It did not establish that one type was more effective than the other.</p><p class="quiet">Pasadena’s preference also reflected its own assessment of architecture, engineering, and emergency-services concerns. The 2024 netting assessment still had unfinished engineering work.</p>${citations(26,'5, 16–17',[['Swiss study',urls.hemmer],['Preliminary assessment · p. 37',urls.p2024+'#page=37']])}</article>
<article data-evidence-id="0" class="feature-card wide"><span class="pill">Design dimensions</span><h3>Height depends on the measurement point</h3><p>The April 2018 task-force recommendation specified a minimum of 7 feet 6 inches above the highest toehold. The City FAQ, checked ${formatDate(reviewDates.heightFAQ)}, describes 8–11 feet above the nearest toehold and says its presented options use 10 feet. The wording and dates differ, but these statements alone do not show that the City officially replaced the earlier height requirement. Both measure height from a place someone could put a foot, not from the sidewalk.</p><p>${link('Public Safety · April 18, 2018 · Presentation · PDF p. 34',urls.p2018+'#page=34')} ${link('City height FAQ',urls.project)}</p></article></section>
<section class="evidence-section" id="surveys" tabindex="-1"><h2>What the local surveys show</h2><article data-evidence-id="8" class="feature-card wide"><span class="pill">2021 survey</span><h3>Curved-curved mesh (Option B) led among respondents who ranked the mockups</h3><p>The City reported 2,268 responses overall. Of the 1,038 respondents who ranked the three designs, 216 chose curved-straight mesh (Option A, 20.8%), 462 chose curved-curved mesh (Option B, 44.5%), and 360 chose pickets (Option C, 34.7%). Separately, staff grouped 622 comments by what people said and reported that 44% preferred no barriers and a return to the bridge’s original state.</p><p>Option B also matched the Historic Preservation Commission’s April 20, 2021 recommendation, with modifications. The minutes record eight votes in favor, none against, and one member absent. This was an advisory recommendation, not Council approval of a permanent design.</p><p class="quiet">People chose whether to take part. Their answers do not necessarily represent the views of Pasadena residents as a whole. The design rankings and written comments were counted separately, using different totals. They should not be treated as the same result or compared directly with the later survey to show a change in opinion.</p>${citations(9,'9',[['Public Safety · August 18, 2021 · Survey · PDF p. 3',urls.r2021+'#page=3'],['Historic Preservation · April 20, 2021 · Minutes · PDF p. 2',urls.hpc2021],['Hand-checked survey table',urls.transcriptions+'#survey-2021']])}</article>
<article data-evidence-id="4" class="feature-card"><span class="pill">2024 survey</span><h3>Respondents expressed doubts and design preferences</h3><p>The survey drew 678 responses overall. On whether a vertical barrier would help prevent suicides, the City reported 40% yes, 33% no, and 27% don’t know. The records do not show that all 678 people answered every question. Some respondents skipped the design ranking.</p><p>Metal pickets ranked highest as the preferred material and design. The City reported 81% support for added lighting and unanimous Historic Preservation Commission support for lighting under the balustrade.</p><p>${link('Public Safety · July 17, 2024 · Survey summary · PDF p. 18',urls.p2024+'#page=18')} · ${link('Commission feedback · PDF p. 16',urls.p2024+'#page=16')}</p><p class="quiet">People chose whether to take part. Their answers do not necessarily represent the views of Pasadena residents as a whole. The 2021 results grouped written comments by topic, while this survey asked direct questions. Comparing them does not establish a change in opinion.</p></article></section>
<section class="evidence-section" id="funding" tabindex="-1"><h2>What the records say about funding and the schedule</h2><article data-evidence-id="6" class="feature-card wide"><h3>Existing funds are being used, and construction needs more funding</h3><div class="stat-pair"><div><b>$1.48 million</b> <span>Total spending recorded for project 73324 through ${formatDate(financePeriod)}, rounded from $1,475,508.</span></div><div><b>June 2028</b> <span>The target for finishing the design, not a promised date for completing the barrier.</span></div></div><p>The project has recorded $1.48 million in spending, and two transfers in 2025 reduced its approved budget by $176,000. Staff said the remaining budget was enough to finish design. The reviewed records do not show secured funding to build the permanent barrier.</p><p class="quiet">The $2,874,000 approved budget is not a measure of cash still available. The spending total covers more than architects’ fees.</p><details class="funding-detail"><summary>Budget details and supporting records</summary><p>The report at the end of fiscal year 2026 listed a $2,874,000 approved budget for project 73324, titled “Colorado Street Bridge Barrier Enhancements – Design Phase.” The August 2021 report describes earlier project spending on temporary fencing and maintenance, mockups, environmental assessment, conceptual design, and outreach. The later spending total should not be read as architects’ fees alone. The cited 2026 project row does not break down that later spending total by category.</p><p>The 2021 report estimated $4–6 million to complete design and construction. In April 2026, staff separately estimated construction at roughly $4 million. The estimates cover different work, so comparing them does not show that costs fell.</p><p>The approved project budget reached $3,050,000: $950,000 from the General Fund, $100,000 in Gas Tax funding, and $2 million labeled ARPA, the federal American Rescue Plan Act. In 2025, the Council transferred $130,000 on June 9 and $46,000 on July 21 to the San Rafael Bridge Seismic Retrofit project, reducing the total to $2,874,000. Staff said enough remained to finish design without affecting its progress. Construction still required additional funding.</p><p class="quiet">The City’s budgets and approved transfers explain the $2,874,000 budget total. That is not the same as money still available to spend. The records reviewed here do not show the remaining amount after costs the City had already agreed to pay. They also do not fully explain how the federal ARPA funds were accounted for within this project.</p><p><a class="source-link" href="https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/04-Streets-and-Streetscapes-2.pdf#page=8" target="_blank" rel="noopener noreferrer">FY2023 adopted capital budget, project 73324, PDF p. 8</a> <a class="source-link" href="https://ww2.cityofpasadena.net/2025%20Agendas/Jun_09_25/AR%203.pdf#page=2" target="_blank" rel="noopener noreferrer">June 9, 2025 staff report, p. 2</a> <a class="source-link" href="https://ww2.cityofpasadena.net/2025%20Agendas/CC%20MINUTES/2025%2006%2009%20CC%20MIN.pdf#page=4" target="_blank" rel="noopener noreferrer">June 9 approved Council minutes, pp. 4 and 6</a> <a class="source-link" href="https://ww2.cityofpasadena.net/2025%20Agendas/Jul_21_25/AR%2014.pdf#page=2" target="_blank" rel="noopener noreferrer">July 21, 2025 staff report, pp. 2–4</a> <a class="source-link" href="https://ww2.cityofpasadena.net/2025%20Agendas/CC%20MINUTES/2025%2007%2021%20CC%20MIN.pdf#page=8" target="_blank" rel="noopener noreferrer">July 21 approved Council minutes, pp. 8–9 and 12</a></p><p class="quiet">Financial activity through ${formatDate(financePeriod)}. Source row checked ${formatDate(reviewDates.financeRow)}.</p>${citations(20,'26, 31, 41',[['Finance & Audit · August 24, 2026 · PDF p. 184 excerpt',urls.financeExcerpt],['Public Safety · August 18, 2021 · Fiscal section · PDF p. 5',urls.r2021+'#page=5'],['Checked financial table',urls.transcriptions+'#finance-2026']])}</details></article></section>
<section class="evidence-section" id="unresolved" tabindex="-1"><h2 id="unresolved-title">What remains unresolved</h2><article data-evidence-id="5" data-search-title="What remains unresolved" aria-labelledby="unresolved-title" class="feature-card wide"><ul class="limit-list"><li><strong>Complete year-by-year death counts for recent years</strong><span>Police tables cover an earlier period. Later oral updates are identified separately. The records reviewed do not provide complete year-by-year counts for 2024–2026. The records also show an unexplained disagreement between two 2017 counts.</span> ${link('2021 staff report · p. 2',urls.r2021+'#page=2')}</li><li><strong>What caused each delay, and how long it lasted</strong><span>The records describe pandemic delays in obtaining materials and building full-size examples, and a first search for a new consultant that received no proposals. The bridge records reviewed do not attribute a specific delay to the Eaton Fire. Repeated discussions alone do not tell us how many months of delay they caused.</span> ${link('August 2021 recording · 00:14:14',urls.v2021)}</li><li><strong>Construction funding</strong><span>A federal request and a House committee recommendation were not an award. The April 2026 “shortlist” discussion did not resolve which funding program or request the figure referred to.</span> ${link('April 2026 Finance recording',urls.v2026)} · ${link('House committee report',urls.house)}</li><li><strong>Missing recordings and unnamed speakers</strong><span>Some early meetings are supported by written City records because recordings were unavailable. The January 2024 off-camera respondent remains unidentified. Any shorter account should keep these limits clear.</span> ${link('January 2024 recording',urls.vjan24)}</li></ul></article></section>
<section class="evidence-section" id="sources" tabindex="-1"><h2 id="sources-title">How to use the sources</h2><article data-evidence-id="7" data-search-title="How to use the sources" aria-labelledby="sources-title" class="feature-card wide"><p>Source links open the underlying City records, original studies, and official recordings. The times show approximately where each discussion begins in the recording. Open the recording and move to the time shown.</p><p class="quiet">Selected remarks distinguish quotations, caption excerpts, and transcript excerpts. Verification details appear with each selection. Search covers the material shown here, including remarks, but does not search inside linked reports or recordings.</p></article></section></div>`;}


const views = ['overview','timeline','alternatives','evidence','speakers','meetings','news'];
const sectionPaths = Object.freeze({overview:'',timeline:'timeline',alternatives:'alternatives-studied',evidence:'evidence-and-limits',speakers:'who-said-what',meetings:'meetings-and-documents',news:'news-and-commentary',search:'search',about:'about'});
const sectionLabels = Object.freeze({overview:'Overview',timeline:'Timeline',alternatives:'Alternatives studied',evidence:'Evidence & limits',speakers:'Who said what',meetings:'Meetings & documents',news:'News & commentary',search:'Search results',about:'About this guide'});
const descriptions={overview:'An independent guide to Pasadena’s Colorado Street Bridge barrier project, with a decision timeline and links to City records and recordings.',timeline:'Follow the Colorado Street Bridge barrier project’s decisions, planned dates, and what happened next, with links to supporting City records.',alternatives:'Read the local reviews of netting, landscaping, staffing, and cameras for the Colorado Street Bridge.',evidence:'Read the prevention evidence, local surveys, funding records, and their limits for the Colorado Street Bridge project.',speakers:'Read 71 selected exchanges about the Colorado Street Bridge project, with earlier work, responses, source notes, and recording timestamps.',meetings:'Find the Colorado Street Bridge project’s meeting records, presentations, minutes, recordings, and preserved City documents.',news:'Read historical reporting, project coverage, interviews, and commentary about the Colorado Street Bridge.',search:'Search the Colorado Street Bridge Project Guide. JavaScript is required for search.',about:'About this independent guide, its research scope, source verification, and corrections contact.'};
const topicDescriptions={netting:'Follow Pasadena’s reviews of horizontal netting, engineering feasibility, rescue access, and maintenance for the Colorado Street Bridge.',landscaping:'Read the Colorado Street Bridge discussions of trees, cacti, and landscaping, including the local terrain and access limits.',staffing:'Compare the Colorado Street Bridge discussions of patrols, staffing costs, response time, and the limits of continuous coverage.',technology:'Read proposals for cameras, motion detection, and ways to speak remotely with someone in crisis as possible additions to a Colorado Street Bridge barrier.'};
function pageMetadata({view,arg}) {
  const isTopic=view==='alternatives'&&Object.hasOwn(topics,arg);
  const person=view==='speakers'&&(arg==='other'||Object.hasOwn(speakerDirectory,arg))?arg:'all';
  const label=isTopic?topics[arg].name:person!=='all'?(person==='other'?'Other speakers':speakerDirectory[person].name):sectionLabels[view];
  return {title:'Colorado Street Bridge Project Guide | '+label,description:isTopic?topicDescriptions[arg]:descriptions[view],canonical:'https://coloradostreetbridgeproject.com/'+(sectionPaths[view]?sectionPaths[view]+'/':'')+(isTopic?arg+'/':''),robots:view==='search'?'noindex, follow':'index, follow'};
}
function updateMetadata(route) {
  const meta=pageMetadata(route);
  document.title=meta.title;
  for(const [selector,attribute,value] of [
    ['link[rel="canonical"]','href',meta.canonical],
    ['meta[name="description"]','content',meta.description],
    ['meta[property="og:title"]','content',meta.title],
    ['meta[property="og:description"]','content',meta.description],
    ['meta[property="og:url"]','content',meta.canonical],
    ['meta[name="twitter:title"]','content',meta.title],
    ['meta[name="twitter:description"]','content',meta.description],
    ['meta[name="robots"]','content',meta.robots]
  ]) { const element=document.querySelector(selector);if(element)element.setAttribute(attribute,value); }
}
// Resolve the deployment root once. Relative HTML links also work on GitHub project paths.
const siteBase = new URL(document.documentElement?.dataset?.siteRoot || './', location.href || 'https://coloradostreetbridgeproject.com/').pathname;
function routeHref(route) {
  const [path,query='']=route.split('?');
  const [raw,arg]=path.split('/');
  const view=Object.hasOwn(sectionPaths,raw)?raw:'overview';
  const base=siteBase+(sectionPaths[view]?sectionPaths[view]+'/':'');
  if(view==='alternatives' && Object.hasOwn(topics,arg))return base+arg+'/';
  return base+(arg||query?'#'+route:'');
}
const content = document.getElementById('content');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const menuToggle = document.getElementById('menu-toggle');
const mobileView = document.getElementById('mobile-view');
const mobileHeader = document.querySelector('.topbar');
let mobileHeaderHeight=null;
function syncHeaderHeight() {
  // Layout is unavailable during the static build. CSS supplies the fallback.
  if(!mobileHeader?.getBoundingClientRect || !document.documentElement?.style)return;
  const height=Math.ceil(mobileHeader.getBoundingClientRect().height);
  if(height===mobileHeaderHeight)return;
  mobileHeaderHeight=height;
  document.documentElement.style.setProperty('--mobile-header-height',height+'px');
}
if(mobileHeader && typeof ResizeObserver!=='undefined')new ResizeObserver(syncHeaderHeight).observe(mobileHeader);
addEventListener('resize',syncHeaderHeight);
let menuOpen=false;
function closeMenu(focus=false) {
  menuOpen=false;
  document.documentElement.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded','false');
  if(focus)menuToggle?.focus();
}
menuToggle?.addEventListener('click',()=>{
  syncHeaderHeight();
  menuOpen=!menuOpen;
  document.documentElement.classList.toggle('menu-open',menuOpen);
  menuToggle.setAttribute('aria-expanded',String(menuOpen));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen)closeMenu(true);});

// Document-specific destinations supplement the preserved source records.
const preservedRemarkLinks = Object.freeze({
  'kennedy-enclosure':[{label:'Preserved February 2020 minutes · pp. 2–3',source:'minutes20200203'}],
  'tornek-urgency':[{label:'Preserved April 2019 minutes · pp. 2–3',source:'minutes20190417'},{label:'Preserved May 2019 minutes · pp. 2–3',source:'minutes20190515'}],
  'line-comparison':[{label:'Preserved February 2020 minutes',source:'minutes20200203'}]
});
function remarkSourceLinks(remark) {
  return (remark.links || []).flatMap(item=>item.source==='dropbox'&&preservedRemarkLinks[remark.id]?preservedRemarkLinks[remark.id]:[item]);
}
function remarkLinks(remark) {
  return remarkSourceLinks(remark).map(item => {
    let url = item.url || urls[item.source];
    if (item.page) url = url.split('#')[0] + '#page=' + item.page;
    const label = item.label + (item.time ? ' · ' + item.time : item.page ? ' · p. ' + item.page : '');
    return '<li>' + link(label,url) + '</li>';
  }).join('');
}
// Only explicit, dated follow-ups use the chronological label. Other existing
// outcomes remain in the source data but are not displayed or searched.
const datedFollowups = {
  'madison-staffing-2021':'first', 'madison-health-expertise':'all',
  'kennedy-enclosure':'first', 'markarian-staffing':'all',
  'olmos-health':'all', 'mossman-preservation':'all',
  'hampton-cushion':'last', 'augustin-cushion':'last'
};
function outcomeParts(remark) {
  const mode=datedFollowups[remark.id], text=remark.outcome, split=text.indexOf('. ')+2;
  if(mode==='all')return {event:text,note:''};
  if(mode==='first')return {event:text.slice(0,split).trimEnd(),note:text.slice(split)};
  if(mode==='last')return {event:text.slice(split),note:text.slice(0,split).trimEnd()};
  return {event:'',note:text};
}
// Roles for the represented meetings; the selector spans both offices.
// City biography: https://www.cityofpasadena.net/mayor/mayor-victor-gordo/
const gordoRolesByDate=Object.freeze({'2018-04-23':'Councilmember','2021-08-18':'Mayor','2023-11-15':'Mayor','2024-07-17':'Mayor'});
function speakerRole(person,remark){return (person===speakers.gordo&&remark&&gordoRolesByDate[remark.sortDate]) || person.role || (person===speakers.gordo?'Councilmember / mayor':'Councilmember');}
// Share these small copy edits between the displayed entries and search, while
// preserving the underlying speaker records and quotation/verification fields.
const remarkCopyEdits=Object.freeze({
  'johnson-regional':{
    title:'Would deaths fall overall or move elsewhere?',
    earlier:'Wilson had asked whether deaths would move to another location. Gordo followed with a question about deaths across the region at 01:31:15.'
  },
  'gordo-2018-regional':{
    earlier:'Earlier in the same discussion, Wilson had asked whether deaths would move to another location. Public Health Director Michael Johnson had begun explaining the research.'
  },
  'wilson-timetable':{
    context:'Wilson called attention to the project’s length, even after staff shortened the proposed design schedule.'
  },
  'mermell-return':{
    context:'In his closing summary, Mermell described the further work needed before the project could return to the committee.'
  },
  'delgado-three-designs':{
    context:'Delgado discussed the proposed designs’ materials, appearance, and relationship to the bridge.'
  }
});
function readableRemark(remark){return {...remark,...remarkCopyEdits[remark.id]};}
function speakerTopicLabel(key){return key==='effectiveness'?'Effectiveness and whether deaths move elsewhere':speakerTopics[key];}
function sourceType(remark){
  if(!remark.quote)return remark.meeting?'Discussion summary':'Written-record summary';
  if(/caption/i.test(remark.kind))return 'Caption excerpt';
  if(/transcript/i.test(remark.kind))return 'Working-transcript excerpt';
  return 'Quotation';
}
// Plain-language notes preserve each check's scope without exposing research bookkeeping.
const publicSourceNotes=Object.freeze({
  'madison-2018-motion':'The official Council minutes, page 5, document the action. The time marks the motion-and-approval sequence, not a verbatim statement by Madison.',
  'madison-safety':'The time marks the start of the surrounding discussion, not necessarily the quoted words.',
  'madison-response':'The author checked the changes of speaker and approximate times against the video. The displayed time starts Madison’s passage, not the quoted phrase. Not every quoted word was checked against the audio.',
  'gordo-decoupling':'This is Gordo’s interpretation of the local record, not a causal estimate. The time locates the surrounding discussion.',
  'gordo-staffing':'The author checked the changes of speaker and approximate times against the video, not every quoted word. The amount mentioned was not an approved staffing budget.',
  'gordo-rescue-clarification':'Summary of the City-caption exchange around 01:08:36–01:09:40, where the next speaker is addressed as mayor. These times come from captions, not a separate check of the audio.',
  'hampton-2018-action':'The official Council minutes, page 5, document the request and second. The time locates the motion-and-approval sequence, not Hampton’s separate temporary-fencing request.',
  'hampton-right':'The time locates the surrounding discussion. The phrase alone does not establish that the requested consideration was redundant.',
  'hampton-urgency':'Working-transcript wording. The minutes also document the request. The time marks the surrounding discussion.',
  'hampton-cushion':'Discussion summary. The time marks the surrounding follow-up. The May 2026 equipment list is a separate written record, not a new equipment inspection or an answer to the capacity question.',
  'jones-continue':'Words from the City’s video captions. The author checked the speaker, passage, and approximate time against the recording. Caption times differ slightly.',
  'jones-design':'The author checked the 01:18:55–01:19:30 passage against the official recording. The excerpt is a continuous portion of that passage.',
  'delgado-cacti':'Working-transcript excerpt from the January 9 discussion, with earlier listening notes. The responding voice is not identified as staff or a consultant.',
  'kennedy-review':'The brief quotation is presented with Kennedy’s support for narrowing the options and setting a timetable, not as a complete statement of his position.',
  'kennedy-staffing':'The time locates the surrounding discussion. These selected remarks do not identify a private motive or measure how much delay any individual caused.',
  'kennedy-enclosure':'Summary of the City Clerk-supplied February 3, 2020 minutes, pages 2–3. No recording was recovered. The source link opens the minutes PDF.',
  'tornek-consensus':'Quoted wording from the April 2018 working transcript. The time marks the surrounding passage in the official recording.',
  'tornek-urgency':'Summary of the April 17 and May 15, 2019 committee minutes. No recording was available for these exchanges. The links open the two minutes PDFs.',
  'wilson-timetable':'The written Council report supports the schedule and contract changes. The recording time marks the surrounding quoted passage.',
  'markarian-procurement':'The author checked 00:14:14–00:14:32 against the official recording. This summary covers the procurement and fabrication issues discussed in that passage.',
  'markarian-buys-time':'The author checked this phrase in the November 2023 recording. The time is approximate.',
  'markarian-structural':'The author checked 00:27:24–00:27:57 against the official recording. The summary preserves the unfinished connections and need for further study.',
  'mermell-opening':'Short quotation from the opening discussion, also checked in the City-hosted captions. The recording time is approximate.',
  'olmos-next-steps':'The author checked the speaker and approximate time for the 01:02:09 closing proposal against the official recording.',
  'olmos-pause':'The author checked the change of speaker and approximate time against the November 2023 recording. This entry summarizes the discussion.',
  'olmos-health':'The author checked the change of speaker and approximate time against the November 2023 recording. This entry summarizes the discussion.',
  'augustin-cushion':'Summary of the recorded discussion and local operating limits. The May 2026 equipment list is a separate written record, not proof that the 2024 question was answered.',
  'kramer-education':'The phrase was checked in selected City-hosted captions. The time locates the surrounding passage. This does not claim a full presentation or audio check.',
  'mossman-preservation':'Summary of the June 18, 2018 Los Angeles magazine interview, read as text. The August 2021 minutes and Winter 2026 column are separate written sources. No recording time is claimed.'
});
function readableSourceNote(note,remark={}) {
  if(publicSourceNotes[remark.id])return publicSourceNotes[remark.id];
  if(note.startsWith('Excerpt read in the preserved City-hosted captions'))return 'City-hosted captions. The time marks the approximate discussion start.';
  if(note.startsWith('Wording from the preserved working transcript'))return 'Working-transcript wording. The time marks the approximate discussion start.';
  if(note.startsWith('Summary of the recorded discussion retained')||note.startsWith('Discussion summary carried'))return 'Summary of the linked official recording, not a verbatim quotation. The starting time is approximate.';
  return note;
}
function sourceLegend(){return `<details class="source-legend"><summary>What the source labels mean</summary><dl><dt>Quotation</dt><dd>Selected quoted words. The entry’s source note identifies any specific recording check.</dd><dt>Caption excerpt</dt><dd>Words from City-hosted video captions, with punctuation and capitalization adjusted for reading. A caption excerpt is not automatically a word-for-word audio check.</dd><dt>Working-transcript excerpt</dt><dd>Words from a working transcript. Any separate recording check is stated in the entry.</dd><dt>Discussion or written-record summary</dt><dd>A paraphrase of the linked recording or written record, not the speaker’s exact words.</dd></dl><p>Times locate approximately where a discussion starts. Open the recording and move to the displayed time. Recording checks apply only to the passages and details stated in the entry.</p></details>`;}
function remarkExcerpt(remark) {
  if(!remark.quote)return '';
  const verified=['Author-confirmed excerpt','Author-checked quotation'].includes(remark.kind);
  let verification=verified?'Checked against the recording.':'';
  if(remark.id==='jones-continue')verification='Words from the City’s video captions. The author checked who was speaking and where the passage appears in the recording.';
  if(['madison-response','gordo-staffing'].includes(remark.id))verification='The author checked who was speaking and where the exchange appears in the recording. Not every quoted word was checked against the audio.';
  const text=`“${esc(remark.quote)}”`;
  return (verified?`<blockquote><p>${text}</p></blockquote>`:`<p class="remark-excerpt">${text}</p>`)+(verification?`<p class="excerpt-verification">${esc(verification)}</p>`:'');
}
function remarkCard(key, person, remark) {
  remark=readableRemark(remark);
  const outcome=outcomeParts(remark);
  return `<article class="remark-card" id="${esc(remark.id)}" tabindex="-1">
    <div class="remark-top"><p class="remark-person">${esc(person.name)}<span class="speaker-role">${esc(speakerRole(person,remark))}</span></p><time class="remark-date" datetime="${esc(remark.sortDate)}">${esc(remark.date)}</time><span class="remark-topic">${esc(speakerTopicLabel(remark.topic))}</span></div>
    <h4>${esc(remark.title)}</h4>
    <p class="remark-kind">${esc(sourceType(remark))}</p>
    ${remarkExcerpt(remark)}
    <p>${esc(remark.context)}</p>
    ${remark.meeting ? `<div class="recording-link">${link('Open recording · go to '+remark.time,urls[remark.meeting])}<span class="approx-label">Approximate start time</span></div>` : '<p class="recording-link">Written source. Open the supporting records below.</p>'}
    <details class="earlier-work"><summary>Earlier work</summary><p>${esc(remark.earlier)}</p></details>
    <dl class="remark-sequence">
      <div><dt>Response and context</dt><dd>${esc(remark.response)}</dd></div>
      ${outcome.event?`<div><dt>What followed</dt><dd>${esc(outcome.event)}</dd></div>`:''}
    </dl>
    <details class="exchange-records"><summary>Sources for this entry</summary><ul>${remarkLinks(remark)}</ul></details>
    <details class="source-detail"><summary>Source and verification</summary><p>${esc(readableSourceNote(remark.basis,remark))}</p></details>
  </article>`.replace(/^[\t ]+$/gm,'');
}
function speakerEntries(key='all', topic='all', year='all') {
  return Object.entries(speakerDirectory).filter(([id])=>key==='all'||key===id||(key==='other'&&Object.hasOwn(otherSpeakers,id)))
    .flatMap(([id,person])=>person.remarks.map(remark=>({id,person,remark})))
    .filter(({remark})=>(topic==='all'||remark.topic===topic)&&(year==='all'||remark.sortDate.startsWith(year)))
    .sort((a,b)=>(a.remark.sortDate+' '+(a.remark.time||'00:00:00')).localeCompare(b.remark.sortDate+' '+(b.remark.time||'00:00:00'))||(a.remark.sortOrder||0)-(b.remark.sortOrder||0)||a.id.localeCompare(b.id));
}
function countLabel(n,one='entry',many='entries'){return n+' '+(n===1?one:many);}
function meetingRecordFor(remark){
  const matches=meetingRecords.filter(record=>record.date===remark.sortDate&&record.body===remark.body);
  return matches.length===1?matches[0]:null;
}
function meetingDocumentsLink(remark){
  const record=meetingRecordFor(remark);
  if(!record)return '';
  const route='meetings/'+record.id;
  return `<a class="meeting-record-link" href="${esc(routeHref(route))}" data-route="${esc(route)}" aria-label="Meeting documents for ${esc(formatDate(record.date)+' · '+record.body)}">Meeting documents →</a>`;
}
function meetingExchangesLink(record){
  const entries=speakerEntries().filter(({remark})=>meetingRecordFor(remark)?.id===record.id);
  if(!entries.length)return '';
  const route='speakers/all/'+entries[0].remark.id;
  return `<p class="record-related"><a href="${esc(routeHref(route))}" data-route="${esc(route)}">Jump to ${countLabel(entries.length,'selected exchange','selected exchanges')} from this meeting →</a></p>`;
}
function speakerView(key='all', topic='all', year='all') {
  const entries=speakerEntries(key,topic,year);
  const name=key==='all'?'All speakers':key==='other'?'Other speakers':speakerDirectory[key].name;
  const activeFilters=[key!=='all'?(key==='other'?'Other speakers':name+' · '+speakerRole(speakerDirectory[key])):'',topic!=='all'?speakerTopicLabel(topic):'',year!=='all'?year:''].filter(Boolean);
  const years=[...new Set(speakerEntries().map(x=>x.remark.sortDate.slice(0,4)))];
  const groups=[];
  for(const item of entries){
    let group=groups[groups.length-1];
    if(!group||group.date!==item.remark.date||group.body!==item.remark.body){group={date:item.remark.date,body:item.remark.body,items:[]};groups.push(group);}
    group.items.push(item);
  }
  return head('05','Questions, answers, and decisions','Read selected exchanges in date order, with their background, responses, and supporting records.')+`
    <div class="filter-bar scroll-focus" id="speaker-controls" tabindex="-1" aria-label="Speaker filters">
    <div class="speaker-filter speaker-filter-person"><label for="speaker-person">Choose a speaker</label><select id="speaker-person"><option value="all">All ${Object.keys(speakerDirectory).length} speakers</option>${key==='other'?'<option value="other" selected>Other speakers (legacy selection)</option>':''}${Object.entries(speakerDirectory).sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([id,p])=>`<option value="${id}" ${id===key?'selected':''}>${esc(p.name)} · ${esc(speakerRole(p))}</option>`).join('')}</select></div>
    <div class="speaker-filter speaker-filter-topic"><label for="speaker-topic">Follow a topic</label><select id="speaker-topic">${Object.keys(speakerTopics).map(id=>`<option value="${id}" ${id===topic?'selected':''}>${esc(speakerTopicLabel(id))}</option>`).join('')}</select></div>
    <div class="speaker-filter speaker-filter-year"><label for="speaker-year">Choose a year</label><select id="speaker-year"><option value="all">All years</option>${years.map(y=>`<option value="${y}" ${year===y?'selected':''}>${y}</option>`).join('')}</select></div></div>
    <p class="filter-actions">${activeFilters.length?`<span class="active-filter-summary">Showing: ${esc(activeFilters.join(' · '))}</span><a href="${esc(routeHref('speakers'))}" data-route="speakers">Clear filters</a>`:''}${Object.hasOwn(topics,topic)?`<a href="${esc(routeHref('alternatives/'+topic))}" data-route="alternatives/${esc(topic)}">Read the ${esc(topics[topic].name.toLowerCase())} overview →</a>`:''}</p>
    ${groups.length>1?`<section class="meeting-jumps scroll-focus" id="meeting-index" tabindex="-1" aria-labelledby="meeting-index-heading"><h2 id="meeting-index-heading">Jump to a date (${groups.length})</h2><nav aria-label="Selected dates">${groups.map(g=>{const entry=g.items[0];const params=new URLSearchParams();if(topic!=='all')params.set('topic',topic);if(year!=='all')params.set('year',year);const route='speakers/'+key+'/'+entry.remark.id+(params.toString()?'?'+params:'');return `<a href="${esc(routeHref(route))}" data-route="${esc(route)}">${esc(g.date)} · ${esc(g.body)} (${g.items.length})</a>`;}).join('')}</nav></section>`:''}
    <p class="locator-note">The roles shown are the ones people held at the time, not necessarily their current positions.</p>${sourceLegend()}
    <div class="speaker-heading"><h2>${esc(name)}</h2><p role="status">${countLabel(entries.length)} · oldest first</p></div>
    ${key==='other'?'<p class="locator-note">35 entries from 15 people in the former “Other speakers” group.</p>':''}
    ${key==='all'?'<p class="locator-note">These are selected exchanges, not a complete record of anyone’s contributions. Remarks are included when they bear on a decision, an alternative, or the schedule, whether they support or challenge this guide’s reading of the record.</p>':''}
    ${groups.length?groups.map(g=>`<section class="meeting-group" aria-label="${esc(g.date+' '+g.body)}"><div class="meeting-heading"><h3>${esc(g.date)}</h3><p>${esc(g.body)}</p>${meetingDocumentsLink(g.items[0].remark)}</div><div class="remarks">${g.items.map(({id,person,remark})=>remarkCard(id,person,remark)).join('')}</div><nav class="meeting-tools" aria-label="Continue after ${esc(g.date+' '+g.body)}"><a href="${esc(routeHref('speakers'))}#speaker-controls" data-scroll-target="speaker-controls">↑ Back to filters</a>${groups.length>1?`<a href="${esc(routeHref('speakers'))}#meeting-index" data-scroll-target="meeting-index">Choose another date</a>`:''}</nav></section>`).join(''):'<p class="search-empty">No selected entries for these filters. Choose another speaker, topic, or year.</p>'}`;
}

function formatDate(date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return date;
  return new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
}
const preservedFileNames={
  minutes20170719:['2017-07-19_Public_Safety_Committee_Minutes.pdf'],
  minutes20180418:['2018-04-18_Public_Safety_Committee_Minutes.pdf'],
  minutes20190417:['2019-04-17_Public_Safety_Committee_Minutes.pdf'],
  minutes20190515:['2019-05-15_Public_Safety_Committee_Minutes.pdf'],
  minutes20200203:['2020-02-03_Public_Safety_Committee_Minutes.pdf'],
  agenda20200203:['2020-02-03_Public_Safety_Committee_Agenda_Packet.pdf']
};
function directoryLinks(items,recordId) {
  return '<ul class="directory-links">'+items.map(item=>{
    const url=item.url||urls[item.source];
    const files=preservedFileNames[item.source];
    const label=files?(item.source.startsWith('agenda')?'Open agenda packet (PDF)':'Open minutes (PDF)'):locatorLabel(item.label)+(/\.pdf(?:[?#]|$)/i.test(url)&&! /\bPDF\b/i.test(item.label)?' · PDF':'');
    return `<li><a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span class="source-label">${esc(label)}${linkArrow(url)}</span>${item.note?'<small>'+esc(item.note)+'</small>':''}</a></li>`;
  }).join('')+'</ul>';
}
function meetingsView(year='all', order='oldest') {
  const selected=meetingRecords.filter(m=>year==='all'||m.date.startsWith(year));
  if(order==='newest')selected.reverse();
  const years=[...new Set(meetingRecords.map(m=>m.date.slice(0,4)))];
  return head('06','Meetings & documents','Find meeting recordings, agendas, presentations, minutes, and related funding documents.')+
    `<div class="meeting-filters speaker-filter"><label for="meeting-year">Choose a year</label><select id="meeting-year"><option value="all">All years</option>${years.map(y=>`<option value="${y}" ${year===y?'selected':''}>${y}</option>`).join('')}</select><label for="meeting-order">Order</label><select id="meeting-order"><option value="oldest" ${order==='oldest'?'selected':''}>Oldest first</option><option value="newest" ${order==='newest'?'selected':''}>Newest first</option></select><span role="status">${countLabel(selected.length,'meeting or related record','meeting and related records')}</span></div>
${year!=='all'||order!=='oldest'?`<p class="filter-actions"><a href="${esc(routeHref('meetings'))}" data-route="meetings">Reset filters</a></p>`:''}
    <details class="directory-notes"><summary>About the directory and preserved records</summary><aside id="source-folder" class="source-folder" tabindex="-1"><div><h3>Preserved City records</h3><p>Six original City PDFs are available directly on this website, including minutes for early meetings where recordings were unavailable. The files retain their original contents and metadata. This guide also provides tables copied and checked by hand, searchable copies of two scanned reports, and a labeled page showing the project’s finances.</p>${link('Read the tables and preservation notes',urls.transcriptions)}</div>${link('Browse the preserved City PDFs',urls.dropbox)}</aside>
    <p class="locator-note">This directory brings together links from the City’s project page and the reviewed source records. Some presentations open through the City’s link list. As checked ${formatDate(reviewDates.projectPage)}, the City project page still listed a tentative Summer 2024 meeting as upcoming. That listing is outdated and should not be used as a current meeting schedule.</p>
    </details>
    <div class="directory-grid">${selected.map(m=>`<article class="directory-card" id="${esc(m.id)}" tabindex="-1"><p class="eyebrow">${esc(m.kind)}</p><p class="directory-date"><time datetime="${esc(m.date)}">${esc(formatDate(m.date))}</time> · ${esc(m.body)}</p><h3>${esc(m.title)}</h3>${m.note?'<p>'+esc(m.note)+'</p>':''}${directoryLinks(m.links,m.id)}${meetingExchangesLink(m)}</article>`).join('')}</div>
    <p class="directory-tail">${link('City project page and meeting list',urls.project)} · ${link('Public Safety agenda archive','https://www.cityofpasadena.net/commissions/city-council-public-safety-committee/past-agendas/')}</p>`;
}
// Relevance notes describe the cited article, not a new verification of its claims.
const newsRelevance={
 'lat-1989':'Background on the bridge’s rehabilitation and the preservation choices that preceded the current barrier project.',
 'lat-1992':'A retrospective account of a child’s survival in 1937 and the public response that followed.',
 'gnp-2013':'Explains the earlier decision to install crisis signs and the discussion of their limits.',
 'lat-2017':'Connects the 2017 emergency fencing with longer-term prevention proposals and an interview with Didi Hirsch’s Kita Curry.',
 'lamag-2018':'Interviews on the tension between prevention measures and historic preservation during the early task-force period.',
 'pnow-2018':'Reports the emergency decision to extend temporary fencing along the bridge in September 2018.',
 'pnow-2024':'Previews the July 2024 review of barrier concepts, commission feedback, surveys, and other prevention measures.',
 'wpra-2026':'Sue Mossman places the lengthy barrier process alongside other unresolved Pasadena preservation projects.'
};
function newsView(){
  const groups=[['Project reporting and commentary',newsRecords.filter(n=>n.date.slice(0,4)>='2017')],['Earlier history and prevention efforts',newsRecords.filter(n=>n.date.slice(0,4)<'2017')]];
  return head('07','News & commentary','Browse reporting, interviews, historical coverage, and preservation commentary about the bridge.')+`<p class="locator-note">Links open the original publisher sites. Some require a subscription.</p>`+
    groups.map(([title,records])=>`<section class="news-section"><h2>${title}</h2><div class="directory-grid">${records.map(n=>`<article class="directory-card news-card" id="${esc(n.id)}" tabindex="-1"><p class="eyebrow">${esc(n.publisher)}</p><p class="directory-date">${esc(formatDate(n.date))} · ${esc(n.kind)}</p><h3>${esc(n.title)}</h3>${newsRelevance[n.id]?'<p>'+esc(newsRelevance[n.id])+'</p>':''}<p>${link('Read at the publisher',n.url)}</p>${n.note?'<details class="source-detail"><summary>Source and access note</summary><p>'+esc(n.note)+'</p></details>':''}</article>`).join('')}</div></section>`).join('');
}

// Search aliases supplement the preserved speaker records; quotations and display names stay unchanged.
const speakerNameAliases = Object.freeze({delgado:['Julianna Delgado','J. Delgado','J Delgado']});
function searchDateAliases(value) {
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');
  if(!match)return [];
  const [,year,month,day]=match;
  return [value,Number(month)+'/'+Number(day)+'/'+year,month+'/'+day+'/'+year];
}
let indexCache;
function searchIndex() {
  if (indexCache) return indexCache;
  const result=[];
  result.push({type:'Project process',title:decisionProcess.title,text:[decisionProcess.intro,...decisionProcess.roles.flat(),decisionProcess.remaining,decisionProcess.status].join(' '),route:'timeline/who-decides'});
  for (const [key,t] of Object.entries(topics)) result.push({type:'Topic',title:t.name,text:[t.title,t.answer,...t.steps.flatMap(s=>[s.date,s.title,s.text]),t.limit].join(' '),route:'alternatives/'+key});
  timeline.forEach((t,i)=>result.push({type:'Timeline',title:t.date+' · '+t.title,aliases:searchDateAliases(t.id),text:[t.text,t.note,t.milestone?.bridge].filter(Boolean).join(' '),route:'timeline/'+(t.id??i)}));
  for (const [key,person] of Object.entries(speakerDirectory)) person.remarks.map(readableRemark).forEach(r=>result.push({type:'Selected remark',title:person.name+' · '+r.title,aliases:[...(speakerNameAliases[key]||[]),...searchDateAliases(r.sortDate)],text:[r.date,r.time,r.body,speakerTopicLabel(r.topic),r.quote,r.context,r.earlier,r.response,outcomeParts(r).event,...remarkSourceLinks(r).flatMap(l=>[l.label,l.time]),readableSourceNote(r.basis,r)].join(' '),metadata:[r.date+(r.time?' · '+r.time:''),r.body,speakerTopicLabel(r.topic)],previewFields:[{label:'Summary',text:r.context},{label:sourceType(r),text:r.quote},{label:'Earlier work',text:r.earlier},{label:'Response and context',text:r.response},{label:'What followed',text:outcomeParts(r).event},{label:'Supporting record',text:remarkSourceLinks(r).flatMap(l=>[l.label,l.time]).filter(Boolean).join(' · ')},{label:'Source and verification',text:readableSourceNote(r.basis,r)}],route:'speakers/'+key+'/'+r.id}));
  meetingRecords.forEach(m=>result.push({type:'Meeting & documents',title:formatDate(m.date)+' · '+m.body,aliases:searchDateAliases(m.date),text:[m.title,m.kind,m.note,...m.links.flatMap(l=>[l.label,...(preservedFileNames[l.source]||[])])].filter(Boolean).join(' · '),summary:[m.title,m.kind,m.note].filter(Boolean).map(text=>/[.!?]$/.test(text)?text:text+'.').join(' '),route:'meetings/'+m.id}));
  newsRecords.forEach(n=>result.push({type:'News & commentary',title:n.publisher+' · '+n.title,aliases:searchDateAliases(n.date),text:[formatDate(n.date),n.kind,newsRelevance[n.id],n.note].filter(Boolean).join(' '),route:'news/'+n.id}));
  result.push({type:'Source collection',title:'Preserved City records',text:'Agendas, minutes, and preserved official records supporting the project history.',route:'meetings/source-folder'});
  for (const [view,html] of [['evidence',evidence()],['overview',overview()]]) {
    const div=document.createElement('div');div.innerHTML=SearchText.separateBlocks(html);
    div.querySelectorAll('article.feature-card,aside.feature-card').forEach((a,i)=>{
      const h=a.querySelector('h3,.eyebrow');
      result.push({type:view==='evidence'?'Evidence & limits':'Overview',title:a.dataset?.searchTitle||(h?h.textContent:'Project overview'),text:a.textContent,summary:[...a.querySelectorAll('p')].map(p=>p.textContent).join(' '),route:view+'/'+(a.dataset?.evidenceId??i)});
    });
  }
  indexCache=result;return result;
}
function highlight(text, words) {
  if (!words.length) return esc(text);
  const escaped=words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length);
  const re=new RegExp('('+escaped.join('|')+')','gi');
  return String(text).split(re).map((part,i)=>i%2?'<mark>'+esc(part)+'</mark>':esc(part)).join('');
}
function searchView(query) {
  const words=SearchText.terms(query);
  const heading=head('','Search the guide','Search the guide by topic, name, date, filename, decision, or phrase. Results include explanations, selected remarks, meeting entries, and news links. Search does not look inside linked reports, articles, or recordings.')+`<form id="results-search-form" class="search-form results-search" role="search" aria-label="Search results"><label for="results-search-input">Search again or change your terms</label><div class="search-controls"><input id="results-search-input" name="q" type="search" maxlength="200" placeholder="Topic or name" enterkeyhint="search" value="${esc(query)}"><button type="submit">Search</button></div></form>`;
  if (!words.length) return heading+'<p class="search-empty">Try <button class="inline-search" data-query="netting">netting</button>, <button class="inline-search" data-query="funding">funding</button>, or <button class="inline-search" data-query="Madison">Madison</button>.</p>';
  const matches=searchIndex().map(item=>({item,score:SearchText.score(item,words)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const count=`${matches.length} ${matches.length===1?'result':'results'} for “${query}”`;
  return heading+`<p class="result-count" role="status">${esc(count)}</p>`+(matches.length?`<ol class="search-results">${matches.map(({item})=>{const preview=SearchText.preview(item,words);return `<li><p class="result-type">${esc(item.type)}</p><h3><a data-route="${esc(item.route)}" href="${esc(routeHref(item.route))}">${highlight(item.title,words)}</a></h3>${item.metadata?`<p class="result-meta">${item.metadata.map(text=>highlight(text,words)).join(' · ')}</p>`:''}<p class="result-excerpt">${preview.label?`<span class="result-excerpt-label">${esc(preview.label)}: </span>`:''}${highlight(preview.text,words)}</p></li>`;}).join('')}</ol>`:'<p class="search-empty">No matching guide entries were found. Try fewer words, a surname, or a broader topic.</p>');
}
function readRoute() {
  const relative=(location.pathname||siteBase).slice(siteBase.length).replace(/index\.html$/,'').replace(/\/$/,'');
  const [slug,topic]=relative.split('/');
  const pathView=Object.keys(sectionPaths).find(key=>sectionPaths[key]===slug)||'overview';
  const fallback=pathView+(pathView==='alternatives'&&Object.hasOwn(topics,topic)?'/'+topic:'');
  const hash=(location.hash||'').slice(1);
  const legacy=Object.hasOwn(sectionPaths,hash.split(/[/?]/)[0]);
  const [path,queryString='']=(legacy?hash:fallback).split('?');
  const [raw,arg,detail]=path.split('/');
  const view=Object.hasOwn(sectionPaths,raw)?raw:'overview';
  const params=new URLSearchParams(queryString);
  const filter=Object.hasOwn(speakerTopics,params.get('topic'))?params.get('topic'):'all';
  const year=meetingRecords.some(m=>m.date.slice(0,4)===params.get('year'))?params.get('year'):'all';
  const order=params.get('order')==='newest'?'newest':'oldest';
  return {view,arg,detail,filter,year,order,query:(params.get('q')||'').slice(0,200),anchor:legacy?'':hash};
}
function aboutView() {
  return `<div class="section-head"><div><h2>About this guide</h2></div></div>
    <div class="info-copy">
      <p>This guide is maintained as a personal research project, independent of the City of Pasadena. It follows the City’s effort since 2017 to develop a permanent suicide prevention barrier for the Colorado Street Bridge.</p>
      <p>Its purpose is to help readers follow the decisions, alternatives, and schedule, and check the supporting records for themselves. It brings together City reports, meeting minutes, presentations, and recordings.</p>
      <h2>Research and source checks</h2>
      <p>The main research review covers material through September 1, 2026. Later checks and additions are dated where they appear.</p>
      <p>Selected exchanges include earlier work, responses, and source links. Remarks are included when they bear on a decision, an alternative, or the schedule, whether they support or challenge the guide’s reading.</p>
      <h2>Reading the source labels</h2><p>Quotations, City-caption excerpts, working-transcript excerpts, and summaries are labeled separately. Each source note describes the recording or document checks completed for that selection. Checking who was speaking and when does not mean every quoted word was checked against the audio.</p>
      <h2>Questions and corrections</h2>
      <p>Email <a href="mailto:contact@coloradostreetbridgeproject.com">contact@coloradostreetbridgeproject.com</a>.</p>
    </div>`;
}
function forecastComparison(){return `<section aria-labelledby="forecast-heading"><h2 id="forecast-heading">Planned dates and what happened next</h2><div class="forecast-table" role="region" aria-label="Schedule comparison" tabindex="0"><table role="table"><caption>These dates were estimates. Finishing the design is one step. Building the barrier is another.</caption><thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">What was planned</th><th role="columnheader" scope="col">What happened next</th></tr></thead><tbody role="rowgroup">
<tr><th scope="row">May 2019: concept approval in December 2019; construction in August 2020, if the City approved the funding.</th><td>Mockups reached the committee in August 2021, but no permanent design was selected. ${link('May 2019 report · p. 4',urls.r2019+'#page=4')} ${link('August 2021 report',urls.r2021)}</td></tr>
<tr><th scope="row">September 2022 plan: return to the committee in September 2023. February 2023 update: return by year-end.</th><td>New designs were presented on November 15, 2023, after the original target but within the revised schedule. ${link('September 2022 report · p. 3',urls.r2022+'#page=3')} ${link('February 2023 newsletter · p. 2',urls.rfp)} ${link('November 2023 presentation',urls.p2023)}</td></tr>
<tr><th scope="row">Later City project reports: finish the design by June 30, 2028.</th><td>The report covering activity through June 30, 2026 said options were still being evaluated and design work was continuing. The target does not promise when the barrier will be built. ${link('Year-end project row · p. 184',urls.q426)}</td></tr>
</tbody></table></div></section>`.replaceAll('<tr><th scope="row">','<tr role="row"><th role="rowheader" scope="row"><span class="forecast-cell-label" aria-hidden="true">What was planned</span>').replaceAll('<td>','<td role="cell"><span class="forecast-cell-label" aria-hidden="true">What happened next</span>');}
function viewMarkup({view,arg,filter='all',year='all',order='oldest',query=''}) {
  const topic=Object.hasOwn(topics,arg)?arg:'netting';
  const person=arg==='other'||Object.hasOwn(speakerDirectory,arg)?arg:'all';
  let markup=view==='overview'?overview():view==='timeline'?timelineView():view==='alternatives'?alternatives(Object.hasOwn(topics,arg)?arg:undefined):view==='evidence'?evidence():view==='speakers'?speakerView(person,filter,year):view==='meetings'?meetingsView(year,order):view==='news'?newsView():view==='about'?aboutView():searchView(query);
  if(view!=='overview')markup=markup.replace('<h2>','<h1>').replace('</h2>','</h1>');
  if(['timeline','alternatives','meetings','search'].includes(view))markup=markup.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/g,(whole,attributes,text)=>attributes.includes('class="milestone-title"')?whole:`<h2${attributes}>${text}</h2>`);
  return markup;
}
function render(focus=false) {
  const route=readRoute();
  const {view,arg,detail,query,filter,year,anchor}=route;
  document.querySelector('.intro').hidden=view!=='overview';
  if(mobileView)mobileView.textContent=sectionLabels[view];
  // A longer section label can wrap. Measure it before scrolling to the target.
  syncHeaderHeight();
  document.querySelectorAll('.view-nav [data-view]').forEach(b=>{
    const on=b.dataset.view===view;b.setAttribute('aria-current',on?'page':'false');
  });
  if (view==='search') {
    document.querySelector('.view-nav [data-view]').tabIndex=0;
    searchInput.value=query;
  }
  const topic=Object.hasOwn(topics,arg)?arg:'netting';
  const person=arg==='other'||Object.hasOwn(speakerDirectory,arg)?arg:'all';
  content.innerHTML=(view!=='search'&&returnQuery?`<p class="return-search"><a data-route="search?q=${esc(encodeURIComponent(returnQuery))}" href="${esc(routeHref('search?q='+encodeURIComponent(returnQuery)))}" aria-label="Return to search results for ${esc(returnQuery)}">← Return to search results</a></p>`:'')+viewMarkup(route);
  const heading=content.querySelector('h1,h2');if(heading)heading.id='view-heading';
  content.setAttribute('aria-labelledby','view-heading');
  if(view==='timeline'){
    const controls=document.getElementById('milestone-controls');
    if(controls)controls.hidden=false;
    if(arg)selectMilestone(arg);
  }
  updateMetadata(route);
  let target=null;
  if(view==='timeline'&&arg==='who-decides')target=document.getElementById('who-decides');
  if(view==='evidence' && ['research','design-criteria','surveys','funding','unresolved','sources'].includes(arg))target=document.getElementById(arg);
  if (['timeline','evidence','overview'].includes(view) && /^(?:\d+|2020-02-03)$/.test(arg||'')) {
    const items=content.querySelectorAll(view==='timeline'?'.timeline-item':'article.feature-card,aside.feature-card');
    target=view==='timeline'?[...items].find(item=>item.dataset.timelineId===arg):view==='evidence'?[...items].find(item=>item.dataset.evidenceId===arg):items[Number(arg)];
    if(target && view==='timeline') {const d=target.querySelector('details');if(d)d.open=true;}
  }
  if(view==='speakers' && detail && speakerEntries(person,filter).some(({remark})=>remark.id===detail)) target=document.getElementById(detail);
  if(view==='meetings'&&(arg==='source-folder'||meetingRecords.some(m=>m.id===arg)))target=document.getElementById(arg);
  if(view==='news'&&newsRecords.some(n=>n.id===arg))target=document.getElementById(arg);
  if(!target && anchor)target=document.getElementById(anchor);
  if(target) {if(target.tagName==='DETAILS')target.open=true;let parent=target.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}
  else if(focus) {content.focus({preventScroll:true});content.scrollIntoView({block:'start'});}
}
let returnQuery='';
function navigate(path,focus=true,keepMenu=false) {
  const previous=readRoute();
  if(previous.view==='search' && path.split(/[/?]/)[0]!=='search')returnQuery=previous.query;
  if(['overview','search'].includes(path.split(/[/?]/)[0]))returnQuery='';
  if(menuOpen&&!keepMenu){closeMenu();focus=true;}
  const next=routeHref(path);
  if((location.pathname||siteBase)+(location.hash||'')!==next)history.pushState(null,'',next);
  render(focus);
}
searchForm.addEventListener('submit',e=>{e.preventDefault();navigate('search?q='+encodeURIComponent(searchInput.value.trim()));});
document.addEventListener('submit',e=>{
  if(e.target.id!=='results-search-form')return;
  e.preventDefault();navigate('search?q='+encodeURIComponent(document.getElementById('results-search-input').value.trim()));
});
document.addEventListener('click',e=>{
  if(e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button>0)return;
  const illustration=e.target.closest('[data-enlarge-image]');
  if(illustration){if(openIllustration(illustration.dataset.enlargeImage,illustration))e.preventDefault();return;}
  const skip=e.target.closest('a.skip[href="#content"]');
  if(skip){e.preventDefault();if(menuOpen)closeMenu();content.focus({preventScroll:true});content.scrollIntoView({block:'start'});return;}
  const milestone=e.target.closest('[data-milestone]');
  if(milestone){selectMilestone(milestone.dataset.milestone);return;}
  const scrollLink=e.target.closest('[data-scroll-target]');
  if(scrollLink){const target=document.getElementById(scrollLink.dataset.scrollTarget);if(target){e.preventDefault();target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}return;}
  const tab=e.target.closest('[data-view]');if(tab){e.preventDefault();const wasOpen=menuOpen;navigate(tab.dataset.view,true);if(!wasOpen)tab.focus({preventScroll:true});return;}
  const go=e.target.closest('[data-go]');if(go){e.preventDefault();navigate(go.dataset.go);return;}
  const topic=e.target.closest('[data-topic]');if(topic){e.preventDefault();navigate('alternatives/'+topic.dataset.topic);return;}
  const routeLink=e.target.closest('[data-route]');if(routeLink){e.preventDefault();navigate(routeLink.dataset.route);return;}
  const person=e.target.closest('[data-speaker]');if(person){const filter=readRoute().filter;navigate('speakers/'+person.dataset.speaker+(filter==='all'?'':'?topic='+filter));return;}
  const query=e.target.closest('[data-query]');if(query){navigate('search?q='+encodeURIComponent(query.dataset.query));return;}
  const a=e.target.closest('a[href^="#"]');
  if(a && a.getAttribute('href')!=='#content' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button===0){e.preventDefault();navigate(a.getAttribute('href').slice(1));}
});
document.addEventListener('change',e=>{
  const route=readRoute(),id=e.target.id;
  if(['meeting-year','meeting-order'].includes(id)){
    const year=id==='meeting-year'?e.target.value:route.year,order=id==='meeting-order'?e.target.value:route.order;
    const params=new URLSearchParams();if(year!=='all')params.set('year',year);if(order==='newest')params.set('order',order);
    navigate('meetings'+(params.toString()?'?'+params:''),false);document.getElementById(id).focus();return;
  }
  if(!['speaker-person','other-speaker','speaker-topic','speaker-year'].includes(id))return;
  const person=['speaker-person','other-speaker'].includes(id)?e.target.value:(route.arg==='other'||Object.hasOwn(speakerDirectory,route.arg)?route.arg:'all');
  const topic=id==='speaker-topic'?e.target.value:route.filter,year=id==='speaker-year'?e.target.value:route.year;
  const params=new URLSearchParams();if(topic!=='all')params.set('topic',topic);if(year!=='all')params.set('year',year);
  navigate('speakers/'+person+(params.toString()?'?'+params:''),false);document.getElementById(id==='other-speaker'?'speaker-person':id).focus();
});
document.querySelector('.view-nav').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  const current=e.target.closest('[data-view]');if(!current)return;e.preventDefault();
  let i=views.indexOf(current.dataset.view);i=e.key==='Home'?0:e.key==='End'?views.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+views.length)%views.length;
  navigate(views[i],true,true);document.getElementById('tab-'+views[i]).focus({preventScroll:true});
});
addEventListener('hashchange',()=>render(true));
addEventListener('popstate',()=>render(true));
// Pin persistent relative links before history navigation changes the document URL.
document.querySelectorAll('a[href],img[src]').forEach(element=>{
  const attr=element.tagName==='IMG'?'src':'href';
  const value=element.getAttribute(attr);
  if(value && !/^(?:#|\/|[a-z][a-z0-9+.-]*:)/i.test(value)){
    const url=new URL(value,location.href);element.setAttribute(attr,url.pathname+url.search+url.hash);
  }
});
render();
