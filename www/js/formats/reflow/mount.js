// Reflowable books (FB2, EPUB, DOCX, TXT...) on the shared page engine: the blocks are paginated into fixed pages, so ribbon /
// page mode, swipes, selection, marks and pen tools behave exactly as in PDF. Zoom buttons change the font size.
import { paginate } from './paginate.js';
import { createFb2Views } from './views.js';
import { domChars } from './page-dom.js';
import { drawThumb } from './thumb.js';
import { createEngine } from '../shared/engine.js';
import { getPref, setPref } from '../../core/prefs.js';
import { emit } from '../../core/bus.js';
function geometry(scroller, fs) {
  const pw = Math.max(280, Math.min(720, scroller.clientWidth - 16)), aspect = Math.min(1.6, Math.max(1.25, scroller.clientHeight / Math.max(1, scroller.clientWidth)));
  const px = 22, py = 26, ph = Math.round(pw * aspect);
  return { pw, ph, px, py, w: pw - 2 * px, h: ph - 2 * py, gap: 40, fs, ratio: ph / pw };
}
export async function mountReflow({ container, scroller, blocks, ids, startFrac, startPage = 1, pagesHint = 100, mode = 'scroll', onPage, id = 'book', dispose }) {
  let fs = getPref('fb2font', 18), geo, pages, pg, eng, curMode = mode, back = null;
  // Reading position = block + char offset, so it maps to the same text on any pagination.
  let top = { b: Math.min(blocks.length - 1, Math.floor((startFrac ?? (startPage - 1) / pagesHint) * blocks.length)), off: 0 };
  const covers = (seg, b, off) => seg.b > b || (seg.b === b && (seg.n === undefined || pg.resolve(seg).e > off));
  const pageOf = ({ b, off }) => Math.max(0, pages.findIndex((p) => p.some((s) => covers(s, b, off))));
  async function build() {
    geo = geometry(scroller, fs);
    pg?.dispose();
    pg = await paginate(blocks, geo);
    pages = pg.pages;
    const source = { count: pages.length, ratio: geo.ratio, views: (lay) => createFb2Views({ lay, pages, blocks, geo, resolve: pg.resolve }) };
    const onP = (n, total) => { const s = pages[n - 1]?.[0]; top = { b: s?.b ?? 0, off: s ? (pg.resolve(s).s ?? 0) : 0 }; onPage(n, total, top.b / blocks.length); };
    eng = createEngine({ source, container, scroller, mode: curMode, onPage: onP, startPage: pageOf(top) + 1 });
  }
  await build();
  const backBtn = Object.assign(document.createElement('button'), { className: 'fb2-back', hidden: true, textContent: '↩' });
  document.getElementById('viewer').append(backBtn);
  backBtn.addEventListener('click', () => { eng.goTo(back, true); backBtn.hidden = true; });
  const onClick = (e) => {
    const to = e.target.closest('a[data-to]')?.dataset.to;
    if (!ids.has(to)) return;
    back = eng.current();
    eng.goTo(pageOf({ b: ids.get(to), off: 0 }) + 1, true);
    backBtn.hidden = false;
  };
  container.addEventListener('click', onClick);
  const doc = { get numPages() { return pages.length; }, getPage: async () => ({ getViewport: () => ({ width: geo.pw, height: geo.ph }) }) };
  return {
    caps: { thumbs: true, ocr: false },
    doc,
    layoutSig: () => `${id}:${geo.pw}x${geo.ph}@${fs}`,
    goTo: (n, smooth) => eng.goTo(n, smooth),
    getText: async (i) => domChars(eng.list.entries[i].el, geo),
    thumb: async (n, canvas, w) => { canvas.width = Math.round(w * Math.min(window.devicePixelRatio || 1, 2)); drawThumb(canvas, pages[n - 1] ?? [], blocks, geo); },
    setMode(m) { curMode = m; eng.setMode(m); },
    async zoomBy(f) {
      const next = Math.min(34, Math.max(12, Math.round(fs * f * 10) / 10));
      if (next === fs) return;
      emit('layoutwill');
      fs = next;
      setPref('fb2font', fs);
      eng.destroy();
      await build();
      emit('layoutchange');
    },
    destroy() { container.removeEventListener('click', onClick); backBtn.remove(); eng.destroy(); pg.dispose(); dispose?.(); },
  };
}
