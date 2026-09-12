'use strict';
// Dependency-free build. Source records remain readable and unchanged.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),zlib=require('zlib');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
const data=vm.createContext({});
for(const name of ['speakers.js','other-speakers.js','resources.js'])vm.runInContext(read(name),data,{filename:name});
const declarations=['speakerTopics','speakers','otherSpeakers','resourceUrls','meetingRecords','newsRecords'];
const compact=declarations.map(name=>'const '+name+'='+vm.runInContext('JSON.stringify('+name+')',data)+';').join('\n');
const script=read('search.js')+'\n'+compact+'\nconst speakerDirectory={...speakers,...otherSpeakers};\n'+read('app.js');

// Render the same overview function used by the interactive guide, not a second account.
const noop=()=>{};
const node=()=>({innerHTML:'',value:'',dataset:{view:'overview'},setAttribute:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],focus:noop,scrollIntoView:noop});
const ctx=vm.createContext({document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener:noop},location:{hash:''},history:{pushState:noop},URLSearchParams,addEventListener:noop});
vm.runInContext(script,ctx,{filename:'guide.js'});
const overview=vm.runInContext('overview()',ctx).replace('<h2>','<h2 id="view-heading">');
const html=read('index.template.html').replace('__STYLE_VERSION__',hash(read('styles.css'))).replace('__SCRIPT_VERSION__',hash(script)).replace('__OVERVIEW__',overview);
if(/__(STYLE_VERSION|SCRIPT_VERSION|OVERVIEW)__/.test(html))throw new Error('Unresolved build placeholder');
fs.mkdirSync(path.join(root,'assets'),{recursive:true});
fs.writeFileSync(path.join(root,'assets/guide.js'),script);
fs.writeFileSync(path.join(root,'index.html'),html);
const currentText=[html,read('styles.css'),script];
const report={initialRequests:4,initialUncompressedBytes:currentText.reduce((n,s)=>n+Buffer.byteLength(s),0)+fs.statSync(path.join(root,'bridge-preview.webp')).size,gzipTextBytes:currentText.reduce((n,s)=>n+zlib.gzipSync(s).length,0),largerImageClickOnly:true};
console.log(JSON.stringify(report));
