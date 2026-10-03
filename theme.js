'use strict';
// A saved choice wins. Otherwise follow the system preference, including changes.
(() => {
  const key='csb-reading-theme';
  const media=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: light)'):null;
  const valid=value=>value==='light'||value==='dark'?value:null;
  const system=()=>media?.matches?'light':'dark';
  function apply(value){
    const light=value==='light';
    document.documentElement.dataset.theme=light?'light':'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f7f8fa':'#0c1420');
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      button.hidden=false;
      button.setAttribute('aria-pressed',String(light));
    });
  }
  let choice=null;
  try{choice=valid(localStorage.getItem(key));}catch{}
  apply(choice||system());
  document.addEventListener('DOMContentLoaded',()=>{
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const value=document.documentElement.dataset.theme==='light'?'dark':'light';
      choice=value;
      apply(value);
      try{localStorage.setItem(key,value);}catch{}
    }));
  });
  addEventListener('storage',event=>{if(event.key===key||event.key===null){choice=valid(event.newValue);apply(choice||system());}});
  media?.addEventListener?.('change',()=>{if(!choice)apply(system());});
})();
