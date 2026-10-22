// Splits blocks into pages with the browser's own column layout: one measuring pass gives every block its page(s).
// A block spread over several pages is a "crossing" block: its exact cut offsets are found lazily (resolve), only for pages that are shown.
import { textMap, leftAt } from './text-pos.js';
export async function paginate(blocks, g) {
  const m = document.createElement('div');
  m.className = 'fb2p fb2m';
  m.style.cssText = `position:fixed;left:-99999px;top:0;visibility:hidden;width:${g.w}px;height:${g.h}px;column-width:${g.w}px;column-gap:${g.gap}px;column-fill:auto;font-size:${g.fs}px`;
  blocks.forEach((b) => m.append(b));
  document.body.append(m);
  // Pictures must have their size before measuring, but a stuck / broken one must never block the book.
  const waits = [...m.querySelectorAll('img')].map((i) => i.decode().catch(() => {}));
  await Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 4000))]);
  const x0 = m.getBoundingClientRect().left, step = g.w + g.gap;
  const colOf = (left) => Math.max(0, Math.floor((left - x0 + g.w * 0.02) / step));
  const pages = [], crossing = new Map(), maps = new Map(), cuts = new Map();
  let last = 0;
  const put = (p, seg) => { (pages[p] ??= []).push(seg); last = p; };
  for (let i = 0; i < blocks.length; i++) {
    if (i % 400 === 399) await new Promise((r) => setTimeout(r)); // let the screen breathe on very long books
    const cols = [...new Set([...blocks[i].getClientRects()].filter((r) => r.width || r.height).map((r) => colOf(r.left)))].sort((a, c) => a - c);
    if (cols.length <= 1) { put(cols[0] ?? last, { b: i }); continue; }
    crossing.set(i, cols);
    cols.forEach((c, k) => put(c, { b: i, k, n: cols.length }));
  }
  const map = (b) => { if (!maps.has(b)) maps.set(b, textMap(blocks[b])); return maps.get(b); };
  // First char of block b that lies after column cols[k] (cached binary search).
  function cut(b, k) {
    const key = `${b}:${k}`;
    if (cuts.has(key)) return cuts.get(key);
    const mp = map(b), col = crossing.get(b)[k];
    let lo = k ? cut(b, k - 1) : 0, hi = mp.total;
    while (lo < hi) { const mid = (lo + hi) >> 1, left = leftAt(mp, mid); if (left !== null && colOf(left) > col) hi = mid; else lo = mid + 1; }
    cuts.set(key, lo);
    return lo;
  }
  return {
    pages: Array.from({ length: pages.length }, (_, p) => pages[p] ?? []),
    // {b} -> itself; a piece of a crossing block -> { b, s, e } char offsets
    resolve: (seg) => (seg.n === undefined ? seg : { b: seg.b, s: seg.k ? cut(seg.b, seg.k - 1) : 0, e: seg.k === seg.n - 1 ? map(seg.b).total : cut(seg.b, seg.k) }),
    dispose() { m.remove(); },
  };
}
