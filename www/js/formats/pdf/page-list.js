// Page placeholders for a pdf.js document; pages are rendered lazily near the viewport, freed when far.
import { renderPage } from './render-page.js';
const MARGIN = 16;
export async function createPageList({ doc, container, scroller }) {
  const first = await doc.getPage(1);
  const v = first.getViewport({ scale: 1 });
  let scale = 1;
  const width = () => Math.max(120, (scroller.clientWidth - MARGIN) * scale);
  const entries = Array.from({ length: doc.numPages }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'pdf-page';
    el.dataset.i = i;
    return { i, el, ratio: v.height / v.width, page: i === 0 ? first : null, task: null, shown: false, seq: 0, drawnAt: 0 };
  });
  const layout = (e) => { const w = width(); e.el.style.width = w + 'px'; e.el.style.height = w * e.ratio + 'px'; };
  async function draw(e) {
    const w = width();
    if (e.drawnAt === w) return;
    const seq = ++e.seq;
    e.task?.cancel();
    try {
      e.page ??= await doc.getPage(e.i + 1);
      if (seq !== e.seq) return;
      const vp = e.page.getViewport({ scale: 1 });
      e.ratio = vp.height / vp.width;
      layout(e);
      const canvas = document.createElement('canvas');
      e.task = renderPage(e.page, canvas, w);
      await e.task.promise;
      e.el.replaceChildren(canvas);
      e.drawnAt = w;
    } catch { /* cancelled or failed page: ignore */ }
  }
  function release(e) {
    e.seq++;
    e.task?.cancel();
    e.task = null;
    e.drawnAt = 0;
    e.el.replaceChildren();
    e.page?.cleanup();
  }
  const io = new IntersectionObserver((list) => list.forEach((x) => {
    const e = entries[x.target.dataset.i];
    e.shown = x.isIntersecting;
    if (e.shown) draw(e); else release(e);
  }), { root: scroller, rootMargin: '120% 0px' });
  entries.forEach((e) => { layout(e); container.append(e.el); io.observe(e.el); });
  return {
    els: entries.map((e) => e.el),
    setScale(s) { scale = s; entries.forEach(layout); },
    rerender() { entries.filter((e) => e.shown).forEach(draw); },
    destroy() { io.disconnect(); entries.forEach(release); },
  };
}
