// Per-page annotation canvases (marks under ink): created on demand, sized to the page, repainted from the store.
import { getItems } from './annot-store.js';
import { paintItem } from './annot-paint.js';
const MAX_PX = 4_000_000;
const make = (cls) => { const c = document.createElement('canvas'); c.className = `annot ${cls}`; return c; };
const paintAll = (el, ink, mark) => getItems(Number(el.dataset.i)).forEach((it) => paintItem(it, ink, mark));
export function ensureLayers(el) {
  let ink = el.querySelector(':scope > .annot-ink'), mark = el.querySelector(':scope > .annot-mark');
  if (!ink) { mark = make('annot-mark'); ink = make('annot-ink'); el.append(mark, ink); }
  const w = el.offsetWidth, h = el.offsetHeight;
  const d = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_PX / Math.max(1, w * h)));
  const cw = Math.max(1, Math.round(w * d)), ch = Math.max(1, Math.round(h * d));
  if (ink.width !== cw || ink.height !== ch) {
    ink.width = mark.width = cw;
    ink.height = mark.height = ch;
    paintAll(el, ink, mark);
  }
  return { ink, mark };
}
export function repaintPage(el) {
  const { ink, mark } = ensureLayers(el);
  [ink, mark].forEach((c) => c.getContext('2d').clearRect(0, 0, c.width, c.height));
  paintAll(el, ink, mark);
}
// Pages are re-created when they scroll back into view: bring their annotations back.
document.getElementById('viewer-pages').addEventListener('pagedrawn', (e) => {
  if (getItems(e.detail.i).length) ensureLayers(e.target);
});
