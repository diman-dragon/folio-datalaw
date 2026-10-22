// Markdown (headings, lists, quotes, code, emphasis, links as text) -> blocks. Small on purpose; no HTML passes through.
import { el, para, heading, gap } from '../reflow/blocks.js';
function inline(text, into) {
  const re = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|!?\[([^\]]*)\]\([^)]*\)/g;
  let at = 0, m;
  while ((m = re.exec(text))) {
    into.append(document.createTextNode(text.slice(at, m.index)));
    if (m[2]) into.append(Object.assign(el('strong'), { textContent: m[2] }));
    else if (m[4]) into.append(Object.assign(el('em'), { textContent: m[4] }));
    else if (m[5]) into.append(Object.assign(el('code'), { textContent: m[5] }));
    else into.append(document.createTextNode(m[6] ?? ''));
    at = re.lastIndex;
  }
  into.append(document.createTextNode(text.slice(at)));
  return into;
}
export function mdBlocks(text) {
  const blocks = [];
  let buf = [], fence = false;
  const flush = () => { if (buf.length) { blocks.push(inline(buf.join(' '), para(''))); buf = []; } };
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const l = raw.trimEnd(), t = l.trim();
    if (t.startsWith('```')) { flush(); fence = !fence; continue; }
    if (fence) { blocks.push(para(l || ' ', 'code')); continue; }
    let m;
    if (!t) flush();
    else if ((m = /^(#{1,6})\s+(.*)$/.exec(t))) { flush(); blocks.push(inline(m[2], heading(m[1].length, ''))); }
    else if (/^([-*_]\s*){3,}$/.test(t)) { flush(); blocks.push(gap()); }
    else if ((m = /^([-*+]|\d+[.)])\s+(.*)$/.exec(t))) { flush(); blocks.push(inline(m[2], para(`${/\d/.test(m[1]) ? m[1] : '•'} `, 'in-list'))); }
    else if ((m = /^>\s?(.*)$/.exec(t))) { flush(); blocks.push(inline(m[1], para('', 'in-cite'))); }
    else buf.push(t);
  }
  flush();
  return { blocks, ids: new Map() };
}
