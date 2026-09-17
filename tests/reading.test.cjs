'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const key='csb-reading-theme';
function themeContext(saved,blocked=false){
  const events={},storage=new Map([[key,saved]]),buttons=[{},{}],meta={};
  for(const button of buttons){button.hidden=true;button.attrs={};button.setAttribute=(k,v)=>button.attrs[k]=v;button.addEventListener=(event,fn)=>button[event]=fn;}
  const document={documentElement:{dataset:{}},querySelector:()=>({setAttribute:(k,v)=>meta[k]=v}),querySelectorAll:()=>buttons,addEventListener:(event,fn)=>events[event]=fn};
  const context={document,localStorage:{getItem:k=>{if(blocked)throw Error('Storage denied');return storage.get(k);},setItem:(k,v)=>{if(blocked)throw Error('Storage denied');storage.set(k,v);}},addEventListener:(event,fn)=>events[event]=fn};
  vm.runInNewContext(read('theme.js'),context);return{document,buttons,events,storage,meta};
}
for(const initial of [undefined,'dark','light','untrusted-value']){
  const app=themeContext(initial);assert.equal(app.document.documentElement.dataset.theme,initial==='light'?'light':'dark');
  app.events.DOMContentLoaded();assert(app.buttons.every(b=>!b.hidden));
  app.buttons[0].click();
  const expected=initial==='light'?'dark':'light';
  assert.equal(app.storage.get(key),expected);assert(app.buttons.every(b=>b.attrs['aria-pressed']===String(expected==='light')));
  assert.equal(app.meta.content,expected==='light'?'#f7f8fa':'#0c1420');
  assert.equal(themeContext(app.storage.get(key)).document.documentElement.dataset.theme,expected,'Choice survives a new document');
  app.events.storage({key,newValue:'light'});assert.equal(app.document.documentElement.dataset.theme,'light');
  app.events.storage({key:null,newValue:null});assert.equal(app.document.documentElement.dataset.theme,'dark');
}
const blocked=themeContext(undefined,true);blocked.events.DOMContentLoaded();blocked.buttons[1].click();assert.equal(blocked.document.documentElement.dataset.theme,'light','Blocked storage must not prevent switching');

const css=read('styles.css');
const tokens=block=>Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/g)].map(m=>[m[1],m[2]]));
const dark=tokens(css.match(/:root\s*\{([^}]+)\}/)[1]);
const light={...dark,...tokens(css.match(/:root\[data-theme="light"\]\s*\{([^}]+)\}/)[1])};
function luminance(hex){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
let minimum=99,checks=0;
for(const [theme,palette] of [['dark',dark],['light',light]]){
  for(const ink of ['ink','muted','dim','link','accent'])for(const bg of ['bg','surface','raised','sidebar','accent-wash','action-surface']){
    const ratio=contrast(palette[ink],palette[bg]);assert(ratio>=4.5,theme+' '+ink+' on '+bg+': '+ratio);minimum=Math.min(minimum,ratio);checks++;
  }
  for(const [ink,bg] of [['button-ink','accent'],['button-ink','button-hover'],['mark-ink','mark-bg']]){
    const ratio=contrast(palette[ink],palette[bg]);assert(ratio>=4.5,theme+' '+ink+' on '+bg);minimum=Math.min(minimum,ratio);checks++;
  }
}
const template=read('index.template.html');
assert.equal((template.match(/data-theme-toggle aria-pressed="false" hidden/g)||[]).length,2);
assert.equal((template.match(/aria-label="Light reading mode"/g)||[]).length,2,'Toggle name stays constant when its decorative indicator changes');
assert(template.indexOf('theme.js')<template.indexOf('styles.css'),'Saved preference applies before stylesheet paint');
const tables=read('preserved-records/tables.html');assert(tables.includes('../theme.js'));assert(tables.includes('data-theme-toggle'));
for(const file of ['2017-07-19_Public_Safety_Committee_Minutes.pdf','2018-04-18_Public_Safety_Committee_Minutes.pdf','2019-04-17_Public_Safety_Committee_Minutes.pdf','2019-05-15_Public_Safety_Committee_Minutes.pdf','2020-02-03_Public_Safety_Committee_Minutes.pdf','2020-02-03_Public_Safety_Committee_Agenda_Packet.pdf'])assert(read('meetings-and-documents/index.html').includes(file));
assert(read('news-and-commentary/index.html').includes('an interview with Didi Hirsch’s Kita Curry'));
assert(read('about/index.html').includes('The full paper is not published here.'));
console.log(JSON.stringify({themeTests:'pre-paint preference, toggle, persistence, storage failure, cross-tab reset',contrastPairs:checks,minimumTextContrast:Number(minimum.toFixed(2)),recordLocators:6,limitations:'Token contrast and source checks are not physical-device or screen-reader tests.'}));
