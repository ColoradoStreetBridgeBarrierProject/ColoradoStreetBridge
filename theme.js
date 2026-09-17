'use strict';
// Apply the saved reading choice before paint. Storage may be unavailable.
(() => {
  const key='csb-reading-theme';
  function apply(value){
    const light=value==='light';
    document.documentElement.dataset.theme=light?'light':'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f7f8fa':'#0c1420');
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      button.hidden=false;
      button.setAttribute('aria-pressed',String(light));
    });
  }
  let saved='dark';
  try{saved=localStorage.getItem(key)||'dark';}catch{}
  apply(saved);
  document.addEventListener('DOMContentLoaded',()=>{
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const value=document.documentElement.dataset.theme==='light'?'dark':'light';
      apply(value);
      try{localStorage.setItem(key,value);}catch{}
    }));
  });
  addEventListener('storage',event=>{if(event.key===key||event.key===null)apply(event.newValue);});
})();
