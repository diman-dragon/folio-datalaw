// PDF module entry: pdf.js document + shared engine, plus text layer, OCR and thumbnails for the viewer handle.
import { openPdf } from './open-doc.js';
import { pdfSource } from './source.js';
import { createEngine } from '../shared/engine.js';
import { getPageText } from './page-chars.js';
import { renderThumb } from './thumb.js';
import { renderForOcr } from './ocr-source.js';
import { ocrText } from '../../core/ocr-geom.js';
const TEXT_MIN = 20; // fewer chars than this (page numbers, stamps) does not make a page "text"
export async function mountPdf({ container, scroller, blob, startPage = 1, mode = 'scroll', onPage }) {
  const doc = await openPdf(blob);
  const source = await pdfSource(doc);
  const eng = createEngine({ source, container, scroller, mode, onPage: (n, total) => onPage(n, total, total > 1 ? (n - 1) / (total - 1) : 0), startPage });
  const ocr = new Map(); // page index -> recognized words (see core/ocr-geom.js)
  const native = (i) => doc.getPage(i + 1).then(getPageText);
  return {
    doc,
    zoomBy: eng.zoomBy,
    goTo: eng.goTo,
    // Native text first; a page without text uses its recognized layer.
    getText: async (i) => {
      const T = await native(i);
      return T.chars.length >= TEXT_MIN || !ocr.has(i) ? T : ocrText(ocr.get(i));
    },
    hasText: async (i) => ocr.has(i) || (await native(i)).chars.length >= TEXT_MIN,
    setOcr: (i, data) => ocr.set(i, data),
    renderForOcr: (i) => renderForOcr(doc, i + 1),
    thumb: (n, canvas, w, near) => renderThumb(eng.list, doc, n, canvas, w, near),
    setMode: eng.setMode,
    destroy() { eng.destroy(); doc.loadingTask.destroy(); },
  };
}
