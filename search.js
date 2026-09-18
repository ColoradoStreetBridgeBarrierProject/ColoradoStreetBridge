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
  // Prefer explanatory sentences over headings and display statistics. Keep the
  // full indexed text available when a query matches a source label or detail.
  const snippet = (item, words) => {
    const summary = item.summary || '';
    const title = normalize([item.title, ...(item.aliases || [])].join(' '));
    if (summary && (words.some(word => normalize(summary).includes(word)) || words.every(word => title.includes(word)))) return summary;
    const text = String(item.text).trim();
    return text.startsWith(item.title) ? text.slice(item.title.length).trim() : text;
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
    let end = Math.min(start + length, clean.length);
    if (end < clean.length) {
      const space = clean.lastIndexOf(' ', end);
      if (space > start + length - 40) end = space;
    }
    return (start ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '');
  };
  const preview = (item, words) => {
    if (!item.previewFields) return {label:'',text:excerpt(snippet(item,words),words)};
    // Metadata remains searchable, but does not get spliced into the prose.
    const metadata=normalize([item.title,...(item.aliases||[]),...(item.metadata||[])].join(' '));
    const contentWords=words.filter(word=>!metadata.includes(word));
    const fields=item.previewFields.filter(field=>field.text);
    const matchCount=text=>contentWords.filter(word=>normalize(text).includes(word)).length;
    const field=fields.reduce((best,next)=>matchCount(next.text)>matchCount(best.text)?next:best,fields[0]);
    if(!field)return {label:'',text:excerpt(snippet(item,words),words)};
    const sentences=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(field.text)].map(part=>part.segment.trim()):[field.text];
    const sentence=sentences.reduce((best,next)=>matchCount(next)>matchCount(best)?next:best,sentences[0]);
    return {label:field.label,text:excerpt(sentence,contentWords)};
  };
  return {normalize, terms, separateBlocks, score, snippet, excerpt, preview};
})();
