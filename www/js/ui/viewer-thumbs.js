// Sidebar thumbnails controller with transparent background overlay.
import { renderPage } from '../formats/pdf/render-page.js';
const thumbsPanel = document.getElementById('viewer-thumbs');
const thumbsList = document.getElementById('thumbs-list');
const thumbsBtn = document.getElementById('thumbs-btn');
let docRef = null, handleRef = null, curPage = 1, io = null;
const items = [];
function renderThumb(item) {
  if (!item || item.drawn || !docRef) return;
  item.drawn = true;
  docRef.getPage(item.num).then((page) => {
    const canvas = document.createElement('canvas');
    const task = renderPage(page, canvas, 84);
    return task.promise.then(() => {
      item.box.replaceChildren(canvas);
    });
  }).catch(() => { item.drawn = false; });
}
function renderVisible() {
  const start = Math.max(0, curPage - 4);
  const end = Math.min(items.length, curPage + 8);
  for (let i = start; i < end; i++) renderThumb(items[i]);
}
export function updateThumbsActive(n) {
  curPage = n;
  items.forEach((it, idx) => {
    const on = idx + 1 === n;
    it.el.classList.toggle('active', on);
    if (on && !thumbsPanel.hidden) it.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  if (!thumbsPanel.hidden) renderVisible();
}
export function toggleThumbs(force) {
  const show = force !== undefined ? force : thumbsPanel.hidden;
  thumbsPanel.hidden = !show;
  thumbsBtn.classList.toggle('active', show);
  if (show) {
    renderVisible();
    updateThumbsActive(curPage);
  }
}
export function initThumbs(doc, handle, start = 1) {
  destroyThumbs();
  if (!doc) return;
  docRef = doc; handleRef = handle; curPage = start;
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !thumbsPanel.hidden) renderThumb(items[e.target.dataset.idx]);
    });
  }, { root: thumbsList, rootMargin: '160px' });
  for (let i = 1; i <= doc.numPages; i++) {
    const el = document.createElement('div');
    el.className = 'thumb-item';
    el.dataset.idx = i - 1;
    const box = document.createElement('div');
    box.className = 'thumb-box';
    box.textContent = i;
    const num = document.createElement('span');
    num.className = 'thumb-num';
    num.textContent = i;
    el.append(box, num);
    const item = { num: i, el, box, drawn: false };
    items.push(item);
    el.addEventListener('click', () => { handleRef?.goTo(i); updateThumbsActive(i); });
    thumbsList.append(el);
    io.observe(el);
  }
  updateThumbsActive(start);
}
export function destroyThumbs() {
  io?.disconnect(); io = null;
  items.length = 0;
  thumbsList.replaceChildren();
  thumbsPanel.hidden = true;
  thumbsBtn.classList.remove('active');
  docRef = null; handleRef = null;
}
thumbsBtn.addEventListener('click', () => toggleThumbs());
