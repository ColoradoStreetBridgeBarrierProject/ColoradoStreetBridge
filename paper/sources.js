'use strict';
// Citation URLs stay canonical. Remember only a source's last citing passage in
// this tab, with ordinary return links as the fallback when storage is unavailable.
(() => {
  document.querySelectorAll('.csb-cite').forEach(link => link.addEventListener('click', () => {
    const source = new URL(link.href).hash.slice(1);
    try { sessionStorage.setItem('csb-paper-return:' + source, location.pathname + '#' + link.id); } catch {}
  }));
  function updateReturn() {
    document.querySelectorAll('[data-return-to-passage]').forEach(link => { link.hidden = true; });
    const source = document.getElementById(location.hash.slice(1));
    if (!source?.classList.contains('csb-source')) return;
    let expected;
    // Preserve return behavior for citation URLs shared before this update.
    const query = new URLSearchParams(location.search);
    const from = query.get('from'), cite = query.get('cite');
    if (from && cite && /^citation-[a-z0-9-]+$/.test(cite)) {
      const url = new URL('../../paper/' + (from === 'opening' ? '' : from + '/') + '#' + cite, location.href);
      expected = url.pathname + url.hash;
    } else {
      try { expected = sessionStorage.getItem('csb-paper-return:' + source.id); } catch {}
    }
    if (!expected) return;
    const link = Array.from(source.querySelectorAll('[data-citation-return]')).find(a => {
      const url = new URL(a.href); return url.pathname + url.hash === expected;
    });
    if (!link) return;
    const back = source.querySelector('[data-return-to-passage]');
    back.setAttribute('href', link.getAttribute('href'));
    back.hidden = false;
  }
  updateReturn();
  addEventListener('hashchange', updateReturn);
  addEventListener('pageshow', updateReturn);
})();
