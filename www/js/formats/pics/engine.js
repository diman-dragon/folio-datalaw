// Picture-based documents (CBZ comics, single images) on the shared engine: one picture per page; recognition makes scans selectable.
import { createEngine } from '../shared/engine.js';
import { ocrText } from '../../core/ocr-geom.js';
const fire = (e, name) => e.el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { i: e.i } }));
function views(lay, items) {
  const mounted = new Set();
  function show(e) {
    if (!e.mounted) { e.mounted = true; mounted.add(e); }
    if (e.base) return;
    const img = Object.assign(document.createElement('img'), { className: 'pic-page', draggable: false });
    e.base = img;
    e.el.prepend(img);
    items[e.i].blob().then((b) => {
      if (!e.mounted) return;
      img.onload = () => {
        const r = img.naturalHeight / img.naturalWidth;
        if (Math.abs(e.ratio - r) > 0.001) { e.ratio = r; lay.place(e); lay.measure(); }
        e.el.dataset.ready = '1';
        fire(e, 'pageready');
      };
      img.src = e.url = URL.createObjectURL(b);
    });
  }
  function hide(e) {
    if (!e.mounted) return;
    e.mounted = false;
    mounted.delete(e);
    fire(e, 'pagehide');
    e.el.replaceChildren();
    delete e.el.dataset.ready;
    if (e.url) URL.revokeObjectURL(e.url);
    e.base = e.url = null;
  }
  return { show, hide, detail() {}, mounted };
}
async function scaled(blob, maxW) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, maxW / bmp.width), c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}
// items: [{ blob() -> Promise<Blob> }]; ratio: height / width of the first picture.
export function mountPics({ container, scroller, items, ratio, startPage = 1, mode = 'scroll', onPage }) {
  const n = items.length, ocr = new Map();
  const eng = createEngine({ source: { count: n, ratio, views: (lay) => views(lay, items) }, container, scroller, mode, startPage, onPage: (p, t) => onPage(p, t, t > 1 ? (p - 1) / (t - 1) : 0) });
  return {
    caps: { thumbs: n > 1, ocr: true, mode: n > 1 },
    doc: { numPages: n, getPage: async () => ({ getViewport: () => ({ width: 1, height: ratio }) }) },
    zoomBy: eng.zoomBy, goTo: eng.goTo, setMode: eng.setMode,
    getText: async (i) => (ocr.has(i) ? ocrText(ocr.get(i)) : { w: 1, h: 1, chars: [] }),
    hasText: async (i) => ocr.has(i),
    setOcr: (i, data) => ocr.set(i, data),
    renderForOcr: async (i) => { const c = await scaled(await items[i].blob(), 1600); return { canvas: c, w: c.width, h: c.height }; },
    thumb: async (k, canvas, w) => {
      const c = await scaled(await items[k - 1].blob(), Math.round(w * Math.min(window.devicePixelRatio || 1, 2)));
      canvas.width = c.width; canvas.height = c.height;
      canvas.getContext('2d').drawImage(c, 0, 0);
    },
    destroy() { eng.destroy(); },
  };
}
export const firstRatio = async (blob) => { const b = await createImageBitmap(blob); const r = b.height / b.width; b.close?.(); return r; };
export async function coverOf(blob) {
  const c = await scaled(blob, 320);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}
