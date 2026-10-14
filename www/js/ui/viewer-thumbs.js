// Page thumbnails sidebar: lazy skeleton list, tap to jump, active page follows the reading position.
import { createThumbQueue } from './thumb-queue.js';
import { pushBack } from './back.js';
const panel = document.getElementById('viewer-thumbs');
const list = document.getElementById('thumbs-list');
const btn = document.getElementById('thumbs-btn');
const items = [];
let queue = null, io = null, cur = 1, active = null, popBack = null;
function want(it, on) {
  if (!it) return;
  it.want = on;
  if (on && !it.canvas) { it.tries = 0; queue?.add(it); }
  if (!on) {
    queue?.drop(it);
    if (it.canvas) { it.canvas.width = 0; it.canvas = null; it.box.replaceChildren(it.ph); }
  }
}
function reveal(it) {
  const top = it.el.offsetTop, bot = top + it.el.offsetHeight;
  if (top < list.scrollTop + 8) list.scrollTop = top - 8;
  else if (bot > list.scrollTop + list.clientHeight - 8) list.scrollTop = bot - list.clientHeight + 8;
}
export function updateThumbsActive(n) {
  cur = n;
  active?.el.classList.remove('active');
  active = items[n - 1] ?? null;
  active?.el.classList.add('active');
  if (active && !panel.hidden) reveal(active);
}
export function toggleThumbs(force) {
  const show = force ?? panel.hidden;
  panel.hidden = !show;
  btn.classList.toggle('active', show);
  popBack?.();
  popBack = show ? pushBack(() => toggleThumbs(false)) : null;
  if (!show) return;
  updateThumbsActive(cur);
  for (let i = Math.max(0, cur - 3); i < Math.min(items.length, cur + 8); i++) want(items[i], true);
}
export function initThumbs(doc, handle, start = 1) {
  destroyThumbs();
  if (!doc) return;
  queue = createThumbQueue(doc, () => cur, (it, canvas) => {
    if (!it.want) { canvas.width = 0; return; }
    it.canvas = canvas;
    it.box.replaceChildren(canvas);
  });
  doc.getPage(1).then((p) => { const v = p.getViewport({ scale: 1 }); list.style.setProperty('--th', `${Math.round((72 * v.height) / v.width)}px`); });
  io = new IntersectionObserver((es) => {
    if (panel.hidden) return;
    es.forEach((x) => want(items[x.target.dataset.idx], x.isIntersecting));
  }, { root: list, rootMargin: '300px' });
  for (let i = 1; i <= doc.numPages; i++) {
    const el = document.createElement('div');
    el.className = 'thumb-item';
    el.dataset.idx = i - 1;
    const box = Object.assign(document.createElement('div'), { className: 'thumb-box' });
    const ph = Object.assign(document.createElement('span'), { className: 'thumb-ph', textContent: i });
    box.append(ph);
    el.append(box, Object.assign(document.createElement('span'), { className: 'thumb-num', textContent: i }));
    el.addEventListener('click', () => { handle?.goTo(i); updateThumbsActive(i); });
    items.push({ num: i, el, box, ph, canvas: null, want: false, tries: 0 });
    list.append(el);
    io.observe(el);
  }
  updateThumbsActive(start);
}
export function destroyThumbs() {
  queue?.destroy(); queue = null;
  io?.disconnect(); io = null;
  items.length = 0;
  active = null;
  list.replaceChildren();
  panel.hidden = true;
  btn.classList.remove('active');
  popBack?.();
  popBack = null;
}
btn.addEventListener('click', () => toggleThumbs());
