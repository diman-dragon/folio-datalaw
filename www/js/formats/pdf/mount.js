// PDF module entry: composes document, page list, page tracker and zoom gestures into a viewer handle.
import { openPdf } from './open-doc.js';
import { createPageList } from './page-list.js';
import { trackPages } from './page-tracker.js';
import { createZoom } from './zoom.js';
import { attachPinch } from './pinch.js';
import { attachDoubleTap } from './double-tap.js';
export async function mountPdf({ container, scroller, blob, startPage = 1, mode = 'scroll', onPage }) {
  const doc = await openPdf(blob);
  const list = await createPageList({ doc, container, scroller, mode });
  let timer, cur = startPage, curMode = mode;
  const refit = (s) => { scroller.classList.toggle('zoomed', s !== 1); list.setScale(s); clearTimeout(timer); timer = setTimeout(list.rerender, 120); };
  const zoom = createZoom({ scroller, content: container, els: list.els, onChange: refit });
  const offPinch = attachPinch({ scroller, zoom });
  const offTap = attachDoubleTap({ scroller, zoom });
  list.goTo(startPage);
  const tracker = trackPages({ scroller, els: list.els, onPage: (n) => { cur = n; onPage(n, doc.numPages); } });
  let lastW = scroller.clientWidth, lastH = scroller.clientHeight;
  const ro = new ResizeObserver(() => {
    const w = scroller.clientWidth, h = scroller.clientHeight;
    // Height matters only when one page must fit the screen (paged mode).
    if (Math.abs(w - lastW) > 2 || (curMode === 'paged' && Math.abs(h - lastH) > 2)) {
      lastW = w; lastH = h;
      refit(zoom.get());
    }
    lastH = h;
  });
  ro.observe(scroller);
  return {
    doc,
    zoomBy: zoom.by,
    goTo: list.goTo,
    ensureText: list.ensureText,
    setMode(m) {
      const keep = cur;
      curMode = m;
      scroller.classList.remove('zoomed');
      list.setMode(m);
      zoom.reset();
      list.goTo(keep);
      clearTimeout(timer);
      timer = setTimeout(list.rerender, 120);
    },
    destroy() {
      clearTimeout(timer); ro.disconnect(); tracker.destroy(); offPinch(); offTap(); list.destroy(); doc.loadingTask.destroy();
    },
  };
}
