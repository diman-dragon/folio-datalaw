// Active tool / colour state and the freehand tools (pen, marker, eraser); strokes preview live and are stored on release.
import { ensureLayers } from './annot-layers.js';
import { addItem } from './annot-store.js';
import { HL_ALPHA } from './annot-paint.js';
import { emit } from '../core/bus.js';
const pages = document.getElementById('viewer-pages');
const root = document.getElementById('viewer');
const WIDTH = { pen: 2.6, highlighter: 20, eraser: 26 };
const KIND = { pen: 'pen', highlighter: 'hl', eraser: 'er' };
let tool = null, color = '#2563eb', g = null;
export const getDrawTool = () => tool;
export const getDrawColor = () => color;
export const setDrawColor = (c) => { color = c; };
export function setDrawTool(next) {
  finish();
  tool = next;
  root.classList.toggle('draw-active', Boolean(next));
  root.dataset.tool = next ?? '';
  emit('toolchange', next);
}
const norm = (v) => Math.round(Math.min(1, Math.max(0, v)) * 10000) / 10000;
const point = (e) => [norm((e.clientX - g.r.left) / g.r.width), norm((e.clientY - g.r.top) / g.r.height)];
function prepare(ctx, cw) {
  Object.assign(ctx, { lineCap: 'round', lineJoin: 'round', lineWidth: g.w * cw, strokeStyle: color });
  if (g.k === 'eraser') ctx.globalCompositeOperation = 'destination-out';
}
function down(e) {
  if (g && e.pointerId !== g.pid) { finish(); return; }
  const el = e.target.closest?.('.pdf-page');
  if (!KIND[tool] || !e.isPrimary || !el?.dataset.ready) return;
  e.preventDefault();
  const { ink, mark } = ensureLayers(el);
  const r = el.getBoundingClientRect();
  g = { pid: e.pointerId, el, r, ink, mark, k: tool, w: WIDTH[tool] / r.width, pts: [], n: 1, raf: 0, live: null };
  const ic = ink.getContext('2d'), mc = mark.getContext('2d');
  if (tool === 'highlighter') {
    g.live = Object.assign(document.createElement('canvas'), { className: 'annot annot-live', width: ink.width, height: ink.height });
    el.append(g.live);
    g.ctxs = [g.live.getContext('2d')];
  } else g.ctxs = tool === 'eraser' ? [ic, mc] : [ic];
  g.ctxs.forEach((c) => { c.save(); prepare(c, ink.width); });
  g.pts.push(point(e));
  g.mid = g.pts[0];
  g.ctxs.forEach((c) => { c.beginPath(); c.moveTo(g.mid[0] * ink.width, g.mid[1] * ink.height); c.lineTo(g.mid[0] * ink.width + 0.01, g.mid[1] * ink.height); c.stroke(); });
  try { pages.setPointerCapture(e.pointerId); } catch { /* ignore */ }
}
function flush() {
  if (!g) return;
  g.raf = 0;
  const cw = g.ink.width, ch = g.ink.height;
  for (; g.n < g.pts.length; g.n++) {
    const c = g.pts[g.n - 1], p = g.pts[g.n], mid = [(c[0] + p[0]) / 2, (c[1] + p[1]) / 2];
    g.ctxs.forEach((x) => { x.beginPath(); x.moveTo(g.mid[0] * cw, g.mid[1] * ch); x.quadraticCurveTo(c[0] * cw, c[1] * ch, mid[0] * cw, mid[1] * ch); x.stroke(); });
    g.mid = mid;
  }
}
function move(e) {
  if (!g || e.pointerId !== g.pid) return;
  e.preventDefault();
  const list = e.getCoalescedEvents?.() ?? [];
  (list.length ? list : [e]).forEach((ev) => g.pts.push(point(ev)));
  g.raf ||= requestAnimationFrame(flush);
}
function finish() {
  if (!g) return;
  cancelAnimationFrame(g.raf);
  flush();
  const cw = g.ink.width, ch = g.ink.height, last = g.pts.at(-1);
  g.ctxs.forEach((x) => { x.beginPath(); x.moveTo(g.mid[0] * cw, g.mid[1] * ch); x.lineTo(last[0] * cw, last[1] * ch); x.stroke(); });
  if (g.live) {
    const m = g.mark.getContext('2d');
    m.globalAlpha = HL_ALPHA;
    m.drawImage(g.live, 0, 0);
    m.globalAlpha = 1;
    g.live.remove();
  }
  g.ctxs.forEach((c) => c.restore());
  addItem(Number(g.el.dataset.i), { k: KIND[g.k], c: color, w: Math.round(g.w * 1e5) / 1e5, p: g.pts });
  g = null;
}
const up = (e) => { if (g && e.pointerId === g.pid) finish(); };
pages.addEventListener('pointerdown', down, { passive: false });
pages.addEventListener('pointermove', move, { passive: false });
pages.addEventListener('pointerup', up);
pages.addEventListener('pointercancel', up);
