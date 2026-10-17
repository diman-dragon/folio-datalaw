// Stylus mode: one finger scrolls the page (with a fling) and swipes between pages in "Pages" mode while the pen draws.
import { stylusOnly } from './stylus.js';
import { getDrawTool } from './viewer-draw.js';
import { getActiveHandle } from './viewer-handle.js';
import { getReadMode } from '../core/readmode.js';
import { on } from '../core/bus.js';
const scroller = document.getElementById('viewer-scroll');
let g = null, fling = 0, page = 1, penDown = false;
on('pagechange', (p) => { page = p.n; });
const stop = () => { cancelAnimationFrame(fling); fling = 0; };
function glide(vx, vy) {
  if (Math.hypot(vx, vy) < 0.05) return;
  scroller.scrollLeft -= vx * 16;
  scroller.scrollTop -= vy * 16;
  fling = requestAnimationFrame(() => glide(vx * 0.94, vy * 0.94));
}
scroller.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'pen') penDown = true; // a palm next to a drawing pen never scrolls
  if (e.pointerType !== 'touch' || penDown || !stylusOnly() || !getDrawTool()) return;
  stop();
  if (g) { g = null; return; }
  g = { pid: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0, from: page };
  try { scroller.setPointerCapture(e.pointerId); } catch { /* ignore */ }
});
scroller.addEventListener('pointermove', (e) => {
  if (!g || e.pointerId !== g.pid) return;
  const now = performance.now(), dt = Math.max(1, now - g.t);
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  g.vx = 0.7 * g.vx + 0.3 * (dx / dt); g.vy = 0.7 * g.vy + 0.3 * (dy / dt);
  scroller.scrollLeft -= dx; scroller.scrollTop -= dy;
  g.x = e.clientX; g.y = e.clientY; g.t = now;
});
function end(e) {
  if (!g || e.pointerId !== g.pid) return;
  const d = g;
  g = null;
  const dx = d.x - d.x0, dy = d.y - d.y0;
  if (getReadMode() === 'paged' && !scroller.classList.contains('zoomed')) {
    const flip = Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5;
    getActiveHandle()?.goTo(d.from + (flip ? (dx < 0 ? 1 : -1) : 0), true);
  } else glide(d.vx, d.vy);
}
const penUp = (e) => { if (e.pointerType === 'pen') penDown = false; };
scroller.addEventListener('pointerup', (e) => { penUp(e); end(e); });
scroller.addEventListener('pointercancel', (e) => { penUp(e); end(e); });
