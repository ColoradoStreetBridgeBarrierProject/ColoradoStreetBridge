'use strict';
// Dependency-free build. Source records remain readable and unchanged.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),zlib=require('zlib');
const {secureHtml}=require('./security.cjs');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
const data=vm.createContext({});
for(const name of ['speakers.js','other-speakers.js','resources.js'])vm.runInContext(read(name),data,{filename:name});
const declarations=['speakerTopics','speakers','otherSpeakers','resourceUrls','meetingRecords','newsRecords'];
const compact=declarations.map(name=>'const '+name+'='+vm.runInContext('JSON.stringify('+name+')',data)+';').join('\n');
const script=read('search.js')+'\n'+compact+'\nconst speakerDirectory={...speakers,...otherSpeakers};\n'+read('app.js');

// Every static page and the interactive guide share the same view renderer.
const noop=()=>{};
const node=()=>({innerHTML:'',value:'',dataset:{view:'overview'},setAttribute:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],focus:noop,scrollIntoView:noop});
const ctx=vm.createContext({document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener:noop},location:{hash:'',pathname:'/',href:'https://coloradostreetbridgeproject.com/'},history:{pushState:noop},URL,URLSearchParams,addEventListener:noop});
vm.runInContext(script,ctx,{filename:'guide.js'});
const get=expression=>vm.runInContext(expression,ctx);
const sections=JSON.parse(get('JSON.stringify(sectionPaths)'));
const labels=JSON.parse(get('JSON.stringify(sectionLabels)'));
const topicNames=JSON.parse(get('JSON.stringify(Object.fromEntries(Object.entries(topics).map(([key,t])=>[key,t.name])))'));
const pages=Object.entries(sections).map(([view,slug])=>({view,path:slug?slug+'/':'',title:labels[view]}));
for(const [arg,title] of Object.entries(topicNames))pages.push({view:'alternatives',arg,path:sections.alternatives+'/'+arg+'/',title});
const output=[];
for(const page of pages){
  const prefix=page.path?'../'.repeat(page.path.split('/').filter(Boolean).length):'./';
  let markup=get('viewMarkup('+JSON.stringify(page)+')').replace(/<h([12])>/,'<h$1 id="view-heading">');
  // Static links are relative to the deployment root, including GitHub project paths.
  markup=markup.replace(/(href|src)="\/(?!\/)([^"]*)"/g,(_,attr,value)=>attr+'="'+prefix+value+'"');
  const meta=JSON.parse(get('JSON.stringify(pageMetadata('+JSON.stringify(page)+'))'));
  const values={ROOT:prefix,TITLE:get('esc('+JSON.stringify(meta.title)+')'),DESCRIPTION:get('esc('+JSON.stringify(meta.description)+')'),CANONICAL:meta.canonical,ROBOTS:meta.robots,SECTION_LABEL:get('esc('+JSON.stringify(labels[page.view])+')'),HERO_HIDDEN:page.view==='overview'?'':'hidden',STYLE_VERSION:hash(read('styles.css')),THEME_VERSION:hash(read('theme.js')),SCRIPT_VERSION:hash(script),CONTENT:markup,BASELINE_DATE:get('formatDate(reviewDates.baseline)'),SITE_UPDATE_DATE:get('formatDate(reviewDates.siteUpdated)')};
  for(const [view,slug] of Object.entries(sections)){values['LINK_'+view.toUpperCase()]=prefix+(slug?slug+'/':'');values['CURRENT_'+view.toUpperCase()]=view===page.view?'page':'false';}
  const html=secureHtml(read('index.template.html').replace(/__([A-Z_]+)__/g,(match,key)=>values[key]??match));
  if(/__[A-Z_]+__/.test(html))throw new Error('Unresolved build placeholder: '+page.path);
  const target=path.join(root,page.path,'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);
  output.push({path:page.path,html});
}
fs.mkdirSync(path.join(root,'assets'),{recursive:true});
fs.writeFileSync(path.join(root,'assets/guide.js'),script);
fs.writeFileSync(path.join(root,'preserved-records/tables.html'),secureHtml(read('preserved-records/tables.html')));
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.filter(p=>p.view!=='search').map(p=>'  <url><loc>https://coloradostreetbridgeproject.com/'+p.path+'</loc></url>').join('\n')+'\n  <url><loc>https://coloradostreetbridgeproject.com/preserved-records/tables.html</loc></url>\n</urlset>\n');
const html=output.find(p=>p.path==='').html;
const currentText=[html,read('styles.css'),read('theme.js'),script];
const report={initialRequests:5,initialUncompressedBytes:currentText.reduce((n,s)=>n+Buffer.byteLength(s),0)+fs.statSync(path.join(root,'bridge-preview.webp')).size,gzipTextBytes:currentText.reduce((n,s)=>n+zlib.gzipSync(s).length,0),largerImageClickOnly:true};
console.log(JSON.stringify({...report,staticPages:output.length}));
