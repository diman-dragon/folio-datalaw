// Thumbnail render queue: one page at a time (nearest to the current page first), retries, waits while main pages render.
import { on } from '../core/bus.js';
const WIDTH = 72, TRIES = 4;
let mainBusy = 0;
on('pagebusy', (n) => { mainBusy = n; });
function fromMain(num, canvas) {
  const src = document.querySelector(`.pdf-page[data-i="${num - 1}"][data-ready] > canvas.page-img`);
  if (!src?.width) return false;
  canvas.height = Math.round((canvas.width * src.height) / src.width);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return true;
}
async function paint(doc, num) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(WIDTH * Math.min(window.devicePixelRatio || 1, 2));
  if (fromMain(num, canvas)) return canvas;
  const page = await doc.getPage(num);
  const vp = page.getViewport({ scale: canvas.width / page.getViewport({ scale: 1 }).width });
  canvas.height = Math.floor(vp.height);
  await page.render({ canvas, viewport: vp, background: '#fff' }).promise;
  return canvas;
}
export function createThumbQueue(doc, getCurrent, onDone) {
  const pending = new Set();
  let running = false, dead = false, timer = 0;
  const kick = (ms) => { clearTimeout(timer); timer = setTimeout(pump, ms); };
  async function pump() {
    if (running || dead || !pending.size) return;
    if (mainBusy) { kick(200); return; }
    const cur = getCurrent();
    let best = null;
    pending.forEach((it) => { if (!best || Math.abs(it.num - cur) < Math.abs(best.num - cur)) best = it; });
    pending.delete(best);
    running = true;
    try { onDone(best, await paint(doc, best.num)); }
    catch (err) {
      if (!dead && ++best.tries < TRIES) setTimeout(() => add(best), 300 * best.tries);
      else console.warn('thumbnail failed', best.num, err);
    }
    running = false;
    kick(30);
  }
  function add(item) { if (dead || !item.want) return; pending.add(item); kick(0); }
  return { add, drop: (it) => pending.delete(it), destroy() { dead = true; clearTimeout(timer); pending.clear(); } };
}
