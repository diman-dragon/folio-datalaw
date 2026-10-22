// HTML / XHTML -> flat blocks (paragraphs, headings, list items, pictures). Whitelisted tags only; scripts and styles are dropped.
import { el, para, gap, picture } from './blocks.js';
const INLINE = { b: 'strong', strong: 'strong', i: 'em', em: 'em', cite: 'em', u: 'u', s: 's', strike: 's', del: 's', sub: 'sub', sup: 'sup', code: 'code', tt: 'code', kbd: 'code' };
const SKIP = new Set(['SCRIPT', 'STYLE', 'HEAD', 'NAV', 'SVG', 'NOSCRIPT', 'TEMPLATE']);
const BLOCK = 'P,DIV,H1,H2,H3,H4,H5,H6,UL,OL,LI,BLOCKQUOTE,PRE,TABLE,TR,SECTION,ARTICLE,ASIDE,HEADER,FOOTER,MAIN,FIGURE,FIGCAPTION,HR,DL,DT,DD,BODY';
const isBlock = (n) => n.nodeType === 1 && BLOCK.split(',').includes(n.tagName);
const resolve = (file, href) => { try { return new URL(href, `http://x/${file}`).pathname.slice(1).split('/').map(decodeURIComponent).join('/'); } catch { return href; } };
// opts: { file, img(src) -> url|null }; returns { blocks, ids } (ids: "file#anchor" and anchors of this document -> block index)
export function htmlBlocks(root, { file = '', img = () => null } = {}) {
  const blocks = [], ids = new Map();
  let cur = null, pend = [];
  const push = (b) => { pend.forEach((id) => ids.set(id, blocks.length)); pend = []; blocks.push(b); };
  const flush = () => { if (cur && cur.textContent.trim()) push(cur); cur = null; };
  const inline = (n, into, flags) => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) { into.append(document.createTextNode(c.nodeValue.replace(/\s+/g, ' '))); continue; }
      if (c.nodeType !== 1 || SKIP.has(c.tagName.toUpperCase())) continue;
      if (c.id) pend.push(`${file}#${c.id}`, c.id);
      const tag = c.tagName.toLowerCase();
      if (tag === 'br') { into.append(document.createElement('br')); continue; }
      if (tag === 'img') { const u = img(c.getAttribute('src') ?? ''); if (u) { flush(); push(picture(u, c.getAttribute('alt') ?? '')); } continue; }
      const w = INLINE[tag] ? el(INLINE[tag]) : tag === 'a' ? el('a') : null;
      if (tag === 'a') { const h = c.getAttribute('href') ?? ''; if (h && !/^[a-z]+:/i.test(h)) { w.dataset.to = h.startsWith('#') ? `${file}${h}` : (([f, a]) => `${resolve(file, f)}${a ? `#${a}` : ''}`)(h.split('#')); } }
      if (w) { inline(c, w, flags); into.append(w); } else inline(c, into, flags);
    }
  };
  function walk(n, ctx) {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) { if (c.nodeValue.trim()) { cur ??= para('', ctx); cur.append(document.createTextNode(c.nodeValue.replace(/\s+/g, ' '))); } continue; }
      if (c.nodeType !== 1 || SKIP.has(c.tagName)) continue;
      if (!isBlock(c) && c.tagName !== 'IMG' && c.tagName !== 'BR') { cur ??= para('', ctx); inline({ childNodes: [c] }, cur); continue; }
      flush();
      if (c.id) pend.push(`${file}#${c.id}`, c.id);
      const t = c.tagName;
      if (/^H[1-6]$/.test(t)) { const h = el(`h${Math.max(2, +t[1] + 1 > 6 ? 6 : +t[1] + 1)}`, 'title'); inline(c, h); if (h.textContent.trim()) push(h); }
      else if (t === 'HR') push(gap());
      else if (t === 'PRE') push(el('p', `${ctx} code`.trim(), c.textContent));
      else if (t === 'LI' || t === 'DT' || t === 'DD') { const p = para('', ctx); p.append(document.createTextNode(t === 'LI' ? '• ' : '')); inline(c, p); if (p.textContent.trim()) push(p); }
      else if (t === 'TR') { const p = para('', ctx); [...c.children].forEach((x, i) => { if (i) p.append(document.createTextNode(' | ')); inline(x, p); }); if (p.textContent.trim()) push(p); }
      else if (t === 'BLOCKQUOTE') walk(c, 'in-cite');
      else if (t === 'P' || (t === 'DIV' && ![...c.children].some(isBlock))) { const p = para('', ctx); inline(c, p); if (p.textContent.trim() || p.querySelector('br')) push(p); }
      else if (c.tagName === 'IMG') { const u = img(c.getAttribute('src') ?? ''); if (u) push(picture(u)); }
      else walk(c, ctx);
    }
    flush();
  }
  walk(root, '');
  return { blocks, ids };
}
