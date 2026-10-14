// PDF module entry: composes document, page list, page tracker and zoom into a viewer handle.
import { openPdf } from './open-doc.js';
import { createPageList } from './page-list.js';
import { trackPages } from './page-tracker.js';
import { createZoom } from './zoom.js';
export async function mountPdf({ container, scroller, blob, startPage = 1, onPage }) {
  const doc = await openPdf(blob);
  const list = await createPageList({ doc, container, scroller });
  let timer;
  const refit = (s) => { list.setScale(s); clearTimeout(timer); timer = setTimeout(list.rerender, 200); };
  const zoom = createZoom({ scroller, onChange: refit });
  const goTo = (n) => list.els[Math.min(Math.max(n, 1), doc.numPages) - 1]?.scrollIntoView({ block: 'start' });
  goTo(startPage);
  const tracker = trackPages({ scroller, els: list.els, onPage: (n) => onPage(n, doc.numPages) });
  const ro = new ResizeObserver(() => refit(zoom.get()));
  ro.observe(scroller);
  return {
    zoomBy: zoom.by,
    goTo,
    destroy() { clearTimeout(timer); ro.disconnect(); tracker.destroy(); zoom.destroy(); list.destroy(); doc.loadingTask.destroy(); },
  };
}
