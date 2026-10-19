// Viewer engine shared by page-based formats: page list + zoom + pinch / double tap + resize handling. A format supplies a source.
import { createPageList } from './page-list.js';
import { createZoom } from './zoom.js';
import { attachPinch } from './pinch.js';
import { attachDoubleTap } from './double-tap.js';
export function createEngine({ source, container, scroller, mode = 'scroll', onPage, startPage = 1 }) {
  let cur = startPage, curMode = mode, timer;
  const list = createPageList({ source, container, scroller, mode, onPage: (n) => { cur = n; onPage(n, source.count); } });
  const zoom = createZoom({
    scroller, content: container, lay: list.lay, entries: list.entries, getMode: () => curMode,
    onChange: (s) => { scroller.classList.toggle('zoomed', s !== 1); list.setScale(s); },
    onSettle: () => list.vp.sync(),
  });
  let from = cur;
  const swipe = ({ dx, dy }) => {
    if (curMode !== 'paged' || zoom.get() > 1.01) return;
    const flip = Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5;
    list.goTo(from + (flip ? (dx < 0 ? 1 : -1) : 0), true);
  };
  const offPinch = attachPinch({ scroller, zoom, onSwipe: swipe, onStart: () => { from = cur; } });
  const offTap = attachDoubleTap({ scroller, zoom });
  list.goTo(startPage);
  list.vp.sync();
  let lastW = scroller.clientWidth, lastH = scroller.clientHeight;
  const ro = new ResizeObserver(() => {
    const w = scroller.clientWidth, h = scroller.clientHeight;
    const changed = Math.abs(w - lastW) > 2 || (curMode === 'paged' && Math.abs(h - lastH) > 2);
    lastW = w; lastH = h;
    if (changed) { clearTimeout(timer); timer = setTimeout(list.relayout, 100); }
  });
  ro.observe(scroller);
  return {
    list, zoom, current: () => cur, zoomBy: zoom.by, goTo: list.goTo,
    setMode(m) {
      const keep = cur;
      curMode = m;
      zoom.reset();
      scroller.classList.remove('zoomed');
      list.setMode(m);
      list.goTo(keep);
      list.vp.sync();
    },
    destroy() { clearTimeout(timer); ro.disconnect(); offPinch(); offTap(); list.destroy(); },
  };
}
