// Active tool / colour state and the freehand tools (pen, marker, eraser) drawn as vector paths.
import { ensureLayers } from './annot-layers.js';
import { addItem, recordErase } from './annot-store.js';
import { svgNode, register, HL } from './annot-svg.js';
import { eraseSegment } from './annot-erase.js';
import { emit } from '../core/bus.js';
const pages = document.getElementById('viewer-pages');
const root = document.getElementById('viewer');
const WIDTH = { pen: 2.6, highlighter: 20, eraser: 14 };
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
function down(e) {
  if (g && e.pointerId !== g.pid) { abort(); return; }
  const el = e.target.closest?.('.pdf-page');
  if (!KIND[tool] || !e.isPrimary || !el?.dataset.ready) return;
  e.preventDefault();
  const { mark, ink, R } = ensureLayers(el);
  const r = el.getBoundingClientRect();
  g = { pid: e.pointerId, el, r, R, k: tool, w: WIDTH[tool] / r.width, pts: [], n: 1, raf: 0, removed: [], i: Number(el.dataset.i) };
  g.pts.push(point(e));
  if (tool !== 'eraser') {
    const hl = tool === 'highlighter';
    g.node = svgNode('path', { fill: 'none', stroke: color, 'stroke-width': g.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(hl ? { 'stroke-opacity': HL } : {}) });
    (hl ? mark : ink).append(g.node);
    g.d = `M${g.pts[0][0]} ${g.pts[0][1] * R}`;
    g.node.setAttribute('d', `${g.d}L${g.pts[0][0] + 0.0001} ${g.pts[0][1] * R}`);
  }
  try { pages.setPointerCapture(e.pointerId); } catch { /* ignore */ }
}
function flush() {
  if (!g) return;
  g.raf = 0;
  for (; g.n < g.pts.length; g.n++) {
    const c = g.pts[g.n - 1], p = g.pts[g.n];
    if (g.k === 'eraser') g.removed.push(...eraseSegment(g.i, c, p, g.R, g.w));
    else g.d += `Q${c[0]} ${c[1] * g.R} ${(c[0] + p[0]) / 2} ${((c[1] + p[1]) / 2) * g.R}`;
  }
  if (g.node) g.node.setAttribute('d', `${g.d}L${g.pts.at(-1)[0]} ${g.pts.at(-1)[1] * g.R}`);
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
  if (g.k === 'eraser' && g.pts.length === 1) g.pts.push(g.pts[0]);
  flush();
  if (g.k === 'eraser') recordErase(g.removed);
  else {
    const item = { k: KIND[g.k], c: color, w: Math.round(g.w * 1e5) / 1e5, p: g.pts };
    register(item, g.node);
    addItem(g.i, item);
  }
  g = null;
}
// A second finger means pinch / pan, not drawing: drop a barely started stroke, keep a real one.
function abort() {
  if (!g) return;
  const far = g.pts.some((p) => Math.hypot((p[0] - g.pts[0][0]) * g.r.width, (p[1] - g.pts[0][1]) * g.r.height) > 14);
  if (far || g.k === 'eraser') { finish(); return; }
  cancelAnimationFrame(g.raf);
  g.node?.remove();
  g = null;
}
const up = (e) => { if (g && e.pointerId === g.pid) finish(); };
pages.addEventListener('pointerdown', down, { passive: false });
pages.addEventListener('pointermove', move, { passive: false });
pages.addEventListener('pointerup', up);
pages.addEventListener('pointercancel', up);
