// Painter of FB2 pages for the shared engine: builds a page's DOM when it nears the screen and scales it to the page box.
import { makePage } from './page-dom.js';
const fire = (e, name) => e.el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { i: e.i } }));
export function createFb2Views({ lay, pages, blocks, geo, resolve }) {
  const mounted = new Set();
  function show(e) {
    if (!e.mounted) { e.mounted = true; mounted.add(e); }
    if (!e.base) {
      e.base = makePage(blocks, pages[e.i] ?? [], geo, resolve);
      e.el.prepend(e.base);
      e.el.dataset.ready = '1';
      fire(e, 'pageready');
    }
    const w = lay.widthOf(e);
    if (e.baseW !== w) { e.base.style.transform = `scale(${w / geo.pw})`; e.baseW = w; }
  }
  function hide(e) {
    if (!e.mounted) return;
    e.mounted = false;
    mounted.delete(e);
    fire(e, 'pagehide');
    e.el.replaceChildren();
    delete e.el.dataset.ready;
    e.base = null;
    e.baseW = 0;
  }
  return { show, hide, detail() {}, mounted };
}
