// Page list of a paged source (PDF, FB2): in-flow page boxes (ribbon or one page per screen), virtualized by the viewport controller.
// source: { count, ratio, init?(entry, i), views(lay) -> { show, hide, detail, mounted } }
import { createLayout } from './layout.js';
import { createViewport } from './viewport.js';
import { clearQueue } from './render-queue.js';
export function createPageList({ source, container, scroller, mode = 'scroll', onPage }) {
  const entries = Array.from({ length: source.count }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'pdf-page';
    el.dataset.i = i;
    const e = { i, el, ratio: source.ratio, mounted: false, base: null, baseW: 0, baseJob: 0, detail: null };
    source.init?.(e, i);
    return e;
  });
  const lay = createLayout({ scroller, container, entries, getMode: () => mode });
  const views = source.views(lay);
  const vp = createViewport({ scroller, lay, entries, views, getMode: () => mode, onPage });
  const setClass = () => scroller.classList.toggle('paged', mode === 'paged');
  entries.forEach((e) => container.append(e.el));
  setClass();
  lay.all();
  return {
    entries, lay, views, vp,
    setScale: (s) => lay.setScale(s),
    relayout() { lay.all(); vp.sync(); },
    setMode(m) { mode = m; setClass(); lay.setScale(1); },
    goTo(n, smooth = false) {
      const el = entries[Math.min(Math.max(n, 1), entries.length) - 1].el;
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: mode === 'paged' ? 'nearest' : 'start', inline: 'center' });
    },
    destroy() {
      vp.destroy();
      clearQueue();
      [...views.mounted].forEach(views.hide);
      entries.forEach((e) => e.el.remove());
      scroller.classList.remove('paged', 'zoomed');
      container.style.paddingInline = '';
    },
  };
}
