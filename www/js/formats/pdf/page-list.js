// Page placeholders for a pdf.js document (ribbon or one-page-per-screen); pages render lazily near the viewport.
import { renderPage } from './render-page.js';
const MARGIN = 16;
export async function createPageList({ doc, container, scroller, mode = 'scroll' }) {
  const first = await doc.getPage(1);
  const v = first.getViewport({ scale: 1 });
  let scale = 1;
  const widthOf = (e) => {
    const cw = scroller.clientWidth - MARGIN, ch = scroller.clientHeight - MARGIN;
    return Math.max(120, (mode === 'paged' ? Math.min(cw, ch / e.ratio) : cw) * scale);
  };
  const entries = Array.from({ length: doc.numPages }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'pdf-page';
    el.dataset.i = i;
    return { i, el, ratio: v.height / v.width, page: i === 0 ? first : null, task: null, shown: false, seq: 0, drawnAt: 0 };
  });
  const layout = (e) => { const w = widthOf(e); e.el.style.width = w + 'px'; e.el.style.height = w * e.ratio + 'px'; };
  function layoutAll() {
    entries.forEach(layout);
    const pad = mode === 'paged' ? (scale <= 1 ? Math.max(8, (scroller.clientWidth - widthOf(entries[0])) / 2) : 8) : 0;
    container.style.paddingInline = mode === 'paged' ? pad + 'px' : '';
  }
  async function draw(e) {
    if (e.page && e.drawnAt === widthOf(e)) return;
    const seq = ++e.seq;
    e.task?.cancel();
    try {
      e.page ??= await doc.getPage(e.i + 1);
      if (seq !== e.seq) return;
      const vp = e.page.getViewport({ scale: 1 });
      e.ratio = vp.height / vp.width;
      layout(e);
      const w = widthOf(e);
      if (e.drawnAt === w) return;
      const canvas = document.createElement('canvas');
      e.task = renderPage(e.page, canvas, w);
      await e.task.promise;
      const layer = e.el.querySelector('.annotate-layer');
      e.el.replaceChildren(canvas);
      if (layer) e.el.append(layer);
      e.drawnAt = w;
    } catch { /* cancelled or failed page: ignore */ }
  }
  function release(e) {
    e.seq++;
    e.task?.cancel();
    e.task = null;
    e.drawnAt = 0;
    const layer = e.el.querySelector('.annotate-layer');
    e.el.replaceChildren();
    if (layer) e.el.append(layer);
    e.page?.cleanup();
  }
  const io = new IntersectionObserver((list) => list.forEach((x) => {
    const e = entries[x.target.dataset.i];
    e.shown = x.isIntersecting;
    if (e.shown) draw(e); else release(e);
  }), { root: scroller, rootMargin: '80% 100%' });
  const setClass = () => scroller.classList.toggle('paged', mode === 'paged');
  setClass();
  layoutAll();
  entries.forEach((e) => { container.append(e.el); io.observe(e.el); });
  return {
    els: entries.map((e) => e.el),
    setScale(s) { scale = s; layoutAll(); },
    setMode(m) { mode = m; scale = 1; setClass(); layoutAll(); entries.forEach((e) => { e.drawnAt = 0; }); },
    goTo(n) {
      const el = entries[Math.min(Math.max(n, 1), entries.length) - 1].el;
      el.scrollIntoView(mode === 'paged' ? { block: 'nearest', inline: 'center' } : { block: 'start' });
    },
    rerender() { entries.filter((e) => e.shown).forEach(draw); },
    destroy() {
      io.disconnect();
      entries.forEach(release);
      scroller.classList.remove('paged', 'zoomed');
      container.style.paddingInline = '';
    },
  };
}
