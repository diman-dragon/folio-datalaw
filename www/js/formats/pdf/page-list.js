// Page placeholders for a pdf.js document (ribbon or one-page-per-screen); pages render lazily near the viewport.
import { renderPage } from './render-page.js';
import { createLayout } from './page-layout.js';
import { ensureText } from './page-text.js';
import { emit } from '../../core/bus.js';
export async function createPageList({ doc, container, scroller, mode = 'scroll' }) {
  const first = await doc.getPage(1);
  const v = first.getViewport({ scale: 1 });
  const entries = Array.from({ length: doc.numPages }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'pdf-page';
    el.dataset.i = i;
    return { i, el, ratio: v.height / v.width, page: i === 0 ? first : null, task: null, shown: false, seq: 0, drawnAt: 0, timer: 0, text: null, textJob: null };
  });
  const lay = createLayout({ scroller, container, entries, getMode: () => mode });
  let busy = 0;
  const bump = (d) => { busy += d; emit('pagebusy', busy); };
  async function draw(e) {
    if (e.page && e.drawnAt === lay.widthOf(e)) return;
    const seq = ++e.seq;
    e.task?.cancel();
    try {
      e.page ??= await doc.getPage(e.i + 1);
      if (seq !== e.seq) return;
      const vp = e.page.getViewport({ scale: 1 });
      if (Math.abs(e.ratio - vp.height / vp.width) > 0.001) { e.ratio = vp.height / vp.width; lay.place(e); }
      const w = lay.widthOf(e);
      if (e.drawnAt === w) return;
      const canvas = document.createElement('canvas');
      canvas.className = 'page-img';
      e.task = renderPage(e.page, canvas, w);
      bump(1);
      try { await e.task.promise; } finally { bump(-1); }
      if (seq !== e.seq) return;
      e.text = e.textJob = null;
      e.el.replaceChildren(canvas);
      e.drawnAt = w;
      e.el.dataset.ready = '1';
      e.el.dispatchEvent(new CustomEvent('pagedrawn', { bubbles: true, detail: { i: e.i } }));
    } catch { /* cancelled or failed page: ignore */ }
  }
  function release(e) {
    clearTimeout(e.timer);
    e.seq++;
    if (!e.task && !e.el.firstChild) return;
    e.task?.cancel();
    e.task = null;
    e.drawnAt = 0;
    e.text = e.textJob = null;
    delete e.el.dataset.ready;
    e.el.replaceChildren();
    e.page?.cleanup();
  }
  // A short delay keeps fast flings from rendering pages that are already gone.
  const io = new IntersectionObserver((list) => list.forEach((x) => {
    const e = entries[x.target.dataset.i];
    e.shown = x.isIntersecting;
    clearTimeout(e.timer);
    if (e.shown) e.timer = setTimeout(() => e.shown && draw(e), e.drawnAt ? 0 : 70); else release(e);
  }), { root: scroller, rootMargin: '60% 100%' });
  const setClass = () => scroller.classList.toggle('paged', mode === 'paged');
  setClass();
  lay.all();
  entries.forEach((e) => { container.append(e.el); io.observe(e.el); });
  return {
    els: entries.map((e) => e.el),
    setScale: lay.setScale,
    setMode(m) { mode = m; setClass(); lay.setScale(1); entries.forEach((e) => { e.drawnAt = 0; }); },
    goTo(n) {
      const el = entries[Math.min(Math.max(n, 1), entries.length) - 1].el;
      el.scrollIntoView(mode === 'paged' ? { block: 'nearest', inline: 'center' } : { block: 'start' });
    },
    rerender() { entries.filter((e) => e.shown).forEach(draw); },
    ensureText: (i) => ensureText(entries[i]),
    destroy() {
      io.disconnect();
      entries.forEach(release);
      scroller.classList.remove('paged', 'zoomed');
      container.style.paddingInline = '';
    },
  };
}
