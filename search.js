'use strict';
const SearchText = (() => {
  const normalize = value => String(value).toLocaleLowerCase('en-US').replace(/[–—−]/g, '-').replace(/\s+/g, ' ').trim();
  const terms = query => [...new Set(normalize(query).split(' ').filter(Boolean))];
  // textContent joins adjacent block elements. Separate them in the detached
  // search copy, while leaving inline markup and its punctuation untouched.
  const separateBlocks = html => String(html).replace(/(<\/(?:p|h[1-6]|div|li|dt|dd|ul|ol|dl|section|article|aside|details|summary)\s*>|<br\b[^>]*>|<hr\b[^>]*>)/gi, '$1 ');
  const score = (item, words) => {
    const title = normalize([item.title, ...(item.aliases || [])].join(' '));
    const body = normalize(item.text);
    if (!words.length || !words.every(word => (title + ' ' + body).includes(word))) return 0;
    return 1 + words.reduce((total, word) => total + (title.includes(word) ? 10 : 0), 0);
  };
  const excerpt = (text, words, length = 260) => {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    const lower = normalize(clean);
    const positions = words.map(word => lower.indexOf(word)).filter(i => i >= 0);
    const match = positions.length ? Math.min(...positions) : 0;
    let start = Math.max(0, match - 75);
    if (start > 0) {
      const space = clean.indexOf(' ', start);
      if (space >= 0 && space < match) start = space + 1;
    }
    return (start ? '…' : '') + clean.slice(start, start + length) + (start + length < clean.length ? '…' : '');
  };
  return {normalize, terms, separateBlocks, score, excerpt};
})();
