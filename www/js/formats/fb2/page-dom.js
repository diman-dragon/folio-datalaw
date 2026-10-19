// One FB2 page as DOM: the blocks (or the pieces of split blocks) of a page inside a fixed-size "paper" box.
import { textMap, rangeOf } from './text-pos.js';
export function makePage(blocks, segs, geo) {
  const page = document.createElement('div');
  page.className = 'fb2p';
  page.style.cssText = `width:${geo.pw}px;height:${geo.ph}px;padding:${geo.py}px ${geo.px}px;font-size:${geo.fs}px`;
  for (const s of segs) {
    const b = blocks[s.b];
    if (s.s === undefined) { page.append(b.cloneNode(true)); continue; }
    const piece = b.cloneNode(false);
    piece.append(rangeOf(textMap(b), s.s, s.e).cloneContents());
    if (s.s > 0) piece.classList.add('cont');
    page.append(piece);
  }
  return page;
}
// Char table of a mounted page in page units (like the PDF text engine): box = the whole paper.
export function domChars(el, geo) {
  const paper = el.querySelector('.fb2p');
  const out = { w: geo.pw, h: geo.ph, chars: [] };
  if (!paper) return out;
  const pr = paper.getBoundingClientRect(), k = pr.width / geo.pw || 1;
  const rg = document.createRange();
  const walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    for (let i = 0; i < n.data.length; i++) {
      rg.setStart(n, i);
      rg.setEnd(n, i + 1);
      const r = rg.getBoundingClientRect();
      if (r.width || r.height) out.chars.push({ ch: n.data[i], x: (r.left - pr.left) / k, y: (r.top - pr.top) / k, w: r.width / k, h: r.height / k });
    }
  }
  return out;
}
