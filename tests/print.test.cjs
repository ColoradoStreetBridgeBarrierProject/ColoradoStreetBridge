'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const events={},details=[{open:false},{open:true},{open:false}];
const context=vm.createContext({addEventListener(type,callback){events[type]=callback;},document:{querySelectorAll(selector){assert.equal(selector,'details:not([open])');return details.filter(detail=>!detail.open);}}});
vm.runInContext(read('print.js'),context);
events.afterprint();
assert.deepEqual(details.map(d=>d.open),[false,true,false]);
for(let pass=0;pass<2;pass++){
 events.beforeprint();
 assert(details.every(d=>d.open),'All supporting details open before printing');
 events.beforeprint();
 events.afterprint();
 assert.deepEqual(details.map(d=>d.open),[false,true,false],'Repeated events retain the original reading state');
}
details[0].open=true;
events.beforeprint();events.afterprint();
assert.deepEqual(details.map(d=>d.open),[true,true,false],'A new print uses the reader’s current choices');
assert(read('assets/guide.js').includes(read('print.js')),'Guide pages receive the print handlers');
assert(/<script src="\.\.\/print\.js\?v=[a-f0-9]+" defer><\/script>/.test(read('preserved-records/tables.html')),'Tables receive the same handlers');
for(const file of ['styles.css','preserved-records/tables.css'])assert(read(file).includes('details::details-content'),'CSS fallback exposes source details');
const error=read('404.html');
assert(error.includes('noindex, follow'));
assert(!error.includes('assets/guide.js'),'An error must not render the overview');
assert(!read('sitemap.xml').includes('/404.html'));
for(const [,href] of error.matchAll(/(?:href|src)="([^"]+)"/g)){
 if(/^[a-z]+:|^#/.test(href))continue;
 assert(href.startsWith('/'),'404 assets and navigation work below any missing path');
 const target=new URL(href,'https://coloradostreetbridgeproject.com/missing/deep/path/');
 const file=path.join(root,target.pathname,target.pathname.endsWith('/')?'index.html':'');
 assert(fs.existsSync(file),href+': recovery destination exists');
}
console.log('Print disclosure restoration, source inclusion, and deep-path 404 recovery checks passed');
