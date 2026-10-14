// Touch gestures on page text: long press selects a word, handles extend it, text tools mark by dragging.
import { getActiveHandle } from './viewer-handle.js';
import { buildChars, lineBoxes } from './sel-chars.js';
import { hitChar, wordAt } from './sel-hit.js';
import { handleSide, paintSel, removeSel } from './sel-view.js';
import { getSel, select, clearSel, placeMenu, applyMark } from './text-select.js';
import { getDrawTool } from './viewer-draw.js';
import { hideMenu } from './text-menu.js';
import { on } from '../core/bus.js';
const pages = document.getElementById('viewer-pages');
const scroller = document.getElementById('viewer-scroll');
const LONG = 420, SLOP = 10, REACH = 28;
const cache = new WeakMap();
let press = null, drag = null;
async function charsFor(el) {
  const layer = await getActiveHandle()?.ensureText?.(Number(el.dataset.i));
  if (!layer) return null;
  if (!cache.has(layer)) cache.set(layer, buildChars(el, layer));
  return cache.get(layer);
}
const local = (el, x, y) => { const r = el.getBoundingClientRect(); return [x - r.left, y - r.top]; };
function cancelPress() { clearTimeout(press?.timer); press = null; }
async function fire(p) {
  const chars = await p.job;
  if (press !== p || !chars?.length) return;
  const h = hitChar(chars, ...local(p.el, p.x, p.y));
  if (h.i < 0 || h.dist > REACH) return;
  p.fired = true;
  const [a, b] = wordAt(chars, h.i);
  select(p.el, chars, a, b);
  navigator.vibrate?.(12);
}
function startPress(e) {
  const el = e.target.closest?.('.pdf-page');
  if (!el?.dataset.ready || getDrawTool()) return;
  cancelPress();
  press = { el, x: e.clientX, y: e.clientY, pid: e.pointerId, fired: false, job: charsFor(el) };
  press.timer = setTimeout(fire, LONG, press);
}
// A drag is either a selection handle (extends the selection) or a text tool (marks the range on release).
function startDrag(kind, e, init) {
  drag = { kind, pid: e.pointerId, pt: [e.clientX, e.clientY], raf: 0, anchor: -1, chars: null, range: null, ...init };
  try { (kind === 'handle' ? e.target : pages).setPointerCapture(e.pointerId); } catch { /* ignore */ }
  e.preventDefault();
  return drag;
}
function step(d) {
  d.raf = 0;
  if (!d.chars || d.anchor < 0) return;
  const h = hitChar(d.chars, ...local(d.el, d.pt[0], d.pt[1] - (d.kind === 'handle' ? 22 : 0)));
  if (h.i < 0) return;
  let a = Math.min(d.anchor, h.i), b = Math.max(d.anchor, h.i);
  if (d.kind === 'mark' && a === b) [a, b] = wordAt(d.chars, a);
  d.range = [a, b];
  if (d.kind === 'handle') select(d.el, d.chars, a, b, { menu: false });
  else paintSel(d.el, lineBoxes(d.chars, a, b), { handles: false });
}
function startMark(e, tool) {
  const el = e.target.closest?.('.pdf-page');
  if (!el?.dataset.ready) return;
  clearSel();
  const d = startDrag('mark', e, { el, tool });
  const pt = [e.clientX, e.clientY];
  d.ready = charsFor(el).then((chars) => {
    d.chars = chars;
    if (!chars) return;
    const h = hitChar(chars, ...local(el, ...pt));
    d.anchor = h.dist <= REACH * 1.5 ? h.i : -1;
    if (!d.ended) step(d);
  });
}
async function finishMark(d) {
  await d.ready;
  step(d);
  removeSel();
  if (d.range) applyMark(d.tool === 'underline' ? 'tu' : 'th', d.el, d.chars, ...d.range);
}
pages.addEventListener('pointerdown', (e) => {
  if (drag) return;
  const side = handleSide(e.target), s = getSel(), tool = getDrawTool();
  if (side && s) { hideMenu(); startDrag('handle', e, { el: s.el, chars: s.chars, anchor: side === 'start' ? s.b : s.a }); }
  else if (tool === 'text-select' || tool === 'underline') startMark(e, tool);
  else if (!tool) startPress(e);
});
pages.addEventListener('pointermove', (e) => {
  if (press && !press.fired && Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP) cancelPress();
  if (drag && e.pointerId === drag.pid) { drag.pt = [e.clientX, e.clientY]; drag.raf ||= requestAnimationFrame(() => step(drag)); }
});
function end(e) {
  if (press && e.pointerId === press.pid) {
    const tap = !press.fired && e.type === 'pointerup';
    cancelPress();
    if (tap && getSel()) clearSel();
  }
  if (!drag || e.pointerId !== drag.pid) return;
  const d = drag;
  drag = null;
  d.ended = true;
  cancelAnimationFrame(d.raf);
  if (d.kind === 'mark') { finishMark(d); return; }
  step(d);
  placeMenu();
}
pages.addEventListener('pointerup', end);
pages.addEventListener('pointercancel', end);
pages.addEventListener('contextmenu', (e) => e.preventDefault());
pages.addEventListener('pagedrawn', (e) => { if (getSel()?.el === e.target) clearSel(); });
scroller.addEventListener('scroll', () => { cancelPress(); if (getSel() && !drag) requestAnimationFrame(placeMenu); }, { passive: true });
on('toolchange', () => { cancelPress(); drag = null; clearSel(); });
