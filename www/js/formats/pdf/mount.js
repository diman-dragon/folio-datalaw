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
  let timer, cur = startPage;
  const refit = (s) => { scroller.classList.toggle('zoomed', s !== 1); list.setScale(s); clearTimeout(timer); timer = setTimeout(list.rerender, 120); };
  const zoom = createZoom({ scroller, content: container, els: list.els, onChange: refit });
  const offPinch = attachPinch({ scroller, zoom });
  const offTap = attachDoubleTap({ scroller, zoom });
  list.goTo(startPage);
  const tracker = trackPages({ scroller, els: list.els, onPage: (n) => { cur = n; onPage(n, doc.numPages); } });
  const ro = new ResizeObserver(() => refit(zoom.get()));
  ro.observe(scroller);
  return {
    doc,
    zoomBy: zoom.by,
    goTo: list.goTo,
    setMode(m) {
      const keep = cur;
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
