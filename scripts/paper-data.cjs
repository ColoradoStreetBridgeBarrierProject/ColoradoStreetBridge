'use strict';
const fs = require('node:fs'), path = require('node:path');
const paper = JSON.parse(fs.readFileSync(path.join(__dirname, '../paper/content.json'), 'utf8'));
const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
function plain(markup) {
  return markup.replace(/<a\b[^>]*class="csb-cite"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<span class="csb-cell-label">[\s\S]*?<\/span>/g, '')
    .replace(/<\/(?:p|h[1-6]|div|tr|th|td|caption)>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, key) => key[0] === '#' ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2),16) : Number(key.slice(1))) : entities[key.toLowerCase()])
    .replace(/\s+/g,' ').trim();
}
const searchRecords = paper.sections.map((section,index) => {
  const passages = [];
  // Match only the known leaf blocks in the authored chapter HTML. Table cells
  // have persistent IDs, as do prose paragraphs, headings, and the survey table.
  const blocks = /<(p|h[23]|table)\b([^>]*)>([\s\S]*?)<\/\1>|<div\b([^>]*\brole="(?:cell|rowheader)"[^>]*)>([\s\S]*?)<\/div>/g;
  for (const match of section.html.matchAll(blocks)) {
    const attrs = match[2] ?? match[4], markup = match[3] ?? match[5];
    const id = attrs.match(/\bid="([^"]+)"/)?.[1], text = plain(markup);
    if (text && !id) throw Error('Missing stable passage ID in ' + section.slug + ': ' + text.slice(0,50));
    if (text) passages.push({id,text});
  }
  const route='paper/'+(section.slug?section.slug+'/':'');
  return {type:'Paper',title:'Section '+(index+1)+' · '+section.title,aliases:index===0?[paper.title,paper.author]:[],text:passages.map(p=>p.text).join(' '),route,path:route,passages};
});
const words = searchRecords.reduce((total, section) => total + section.text.split(/\s+/).length, 0);
const readingMinutes = Math.ceil(words / 220 / 5) * 5;
module.exports = {paper,searchRecords,readingMinutes,plain};
