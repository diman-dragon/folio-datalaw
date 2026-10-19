// Splits blocks into pages with the browser's own column layout: one measuring pass, then a page number per block (or per piece).
import { textMap, leftAt } from './text-pos.js';
export async function paginate(blocks, g) {
  const m = document.createElement('div');
  m.className = 'fb2p fb2m';
  m.style.cssText = `position:fixed;left:-99999px;top:0;visibility:hidden;width:${g.w}px;height:${g.h}px;column-width:${g.w}px;column-gap:${g.gap}px;column-fill:auto;font-size:${g.fs}px`;
  blocks.forEach((b) => m.append(b));
  document.body.append(m);
  await Promise.all([...m.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
  const x0 = m.getBoundingClientRect().left, step = g.w + g.gap;
  const colOf = (left) => Math.max(0, Math.floor((left - x0 + g.w * 0.02) / step));
  const pages = [];
  let last = 0;
  const put = (p, seg) => { (pages[p] ??= []).push(seg); last = p; };
  blocks.forEach((b, i) => {
    const cols = [...new Set([...b.getClientRects()].filter((r) => r.width || r.height).map((r) => colOf(r.left)))].sort((a, c) => a - c);
    if (cols.length <= 1) { put(cols[0] ?? last, { b: i }); return; }
    const map = textMap(b);
    let from = 0;
    for (let k = 0; k < cols.length - 1; k++) {
      let lo = from, hi = map.total; // first char whose column is after cols[k]
      while (lo < hi) { const mid = (lo + hi) >> 1, left = leftAt(map, mid); if (left !== null && colOf(left) > cols[k]) hi = mid; else lo = mid + 1; }
      put(cols[k], { b: i, s: from, e: lo });
      from = lo;
    }
    put(cols.at(-1), { b: i, s: from, e: map.total });
  });
  blocks.forEach((b) => b.remove());
  m.remove();
  return Array.from({ length: pages.length }, (_, p) => pages[p] ?? []);
}
