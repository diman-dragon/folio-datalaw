// FB2 reader on the shared page engine: the book is paginated into fixed pages (ribbon or page-by-page), so selection,
// marks, pen tools, zoom and swipes behave exactly as in PDF. Zoom buttons change the font size (the book is paginated again).
import { loadBook } from './load.js';
import { createRenderer } from './render.js';
import { flatten } from './flatten.js';
import { paginate } from './paginate.js';
import { createFb2Views } from './views.js';
import { domChars } from './page-dom.js';
import { createEngine } from '../shared/engine.js';
import { getPref, setPref } from '../../core/prefs.js';
import { emit } from '../../core/bus.js';
function geometry(scroller, fs) {
  const pw = Math.max(280, Math.min(720, scroller.clientWidth - 16)), aspect = Math.min(1.6, Math.max(1.25, scroller.clientHeight / Math.max(1, scroller.clientWidth)));
  const px = 22, py = 26, ph = Math.round(pw * aspect);
  return { pw, ph, px, py, w: pw - 2 * px, h: ph - 2 * py, gap: 40, fs, ratio: ph / pw };
}
export async function mountFb2({ container, scroller, blob, startFrac, startPage = 1, mode = 'scroll', onPage }) {
  const book = await loadBook(blob);
  const renderer = createRenderer(book);
  const { blocks, ids } = flatten(renderer.render());
  let fs = getPref('fb2font', 18), geo, pages, eng;
  // Reading position = block + char offset, so it maps to the same text on any pagination.
  let top = { b: Math.min(blocks.length - 1, Math.floor((startFrac ?? (startPage - 1) / book.pages) * blocks.length)), off: 0 };
  const pageOf = ({ b, off }) => Math.max(0, pages.findIndex((p) => p.some((s) => s.b > b || (s.b === b && (s.e === undefined || s.e > off)))));
  const pageOfBlock = (b) => pageOf({ b, off: 0 });
  async function build() {
    geo = geometry(scroller, fs);
    pages = await paginate(blocks, geo);
    const source = { count: pages.length, ratio: geo.ratio, views: (lay) => createFb2Views({ lay, pages, blocks, geo }) };
    const onP = (n, total) => { const s = pages[n - 1]?.[0]; top = { b: s?.b ?? 0, off: s?.s ?? 0 }; onPage(n, total, top.b / blocks.length); };
    eng = createEngine({ source, container, scroller, mode: curMode, onPage: onP, startPage: pageOf(top) + 1 });
  }
  let curMode = mode, back = null;
  await build();
  const backBtn = Object.assign(document.createElement('button'), { className: 'fb2-back', hidden: true, textContent: '↩' });
  document.getElementById('viewer').append(backBtn);
  backBtn.addEventListener('click', () => { eng.goTo(back, true); backBtn.hidden = true; });
  const onClick = (e) => {
    const to = e.target.closest('a[data-to]')?.dataset.to;
    if (!ids.has(to)) return;
    back = eng.current();
    eng.goTo(pageOfBlock(ids.get(to)) + 1, true);
    backBtn.hidden = false;
  };
  container.addEventListener('click', onClick);
  return {
    caps: { thumbs: false, ocr: false },
    layoutSig: () => `fb2:${geo.pw}x${geo.ph}@${fs}`,
    goTo: (n, smooth) => eng.goTo(n, smooth),
    getText: async (i) => domChars(eng.list.entries[i].el, geo),
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
    destroy() { container.removeEventListener('click', onClick); backBtn.remove(); eng.destroy(); renderer.dispose(); },
  };
}
