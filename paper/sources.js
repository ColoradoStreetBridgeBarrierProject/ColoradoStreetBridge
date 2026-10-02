'use strict';
// Enhance a direct source visit with an exact return link. The ordinary list of
// all cited passages remains available when scripts or query parameters are absent.
(() => {
  const query = new URLSearchParams(location.search);
  const from = query.get('from'), cite = query.get('cite');
  if (!from || !cite || !/^citation-\d+$/.test(cite)) return;
  const expected = '../../paper/' + (from === 'opening' ? '' : from + '/') + '#' + cite;
  const source = document.getElementById(location.hash.slice(1));
  if (!source?.classList.contains('csb-source')) return;
  const link = Array.from(source.querySelectorAll('[data-citation-return]')).find(a => a.getAttribute('href') === expected);
  if (!link) return;
  const back = source.querySelector('[data-return-to-passage]');
  back.setAttribute('href', link.getAttribute('href'));
  back.hidden = false;
})();
