// Page source of a pdf.js document for the shared engine: page count, shape of the first page and the canvas painter.
import { createViews } from './page-view.js';
export async function pdfSource(doc) {
  const first = await doc.getPage(1);
  const v = first.getViewport({ scale: 1 });
  return { count: doc.numPages, ratio: v.height / v.width, init: (e, i) => { e.page = i === 0 ? first : null; }, views: (lay) => createViews({ doc, lay }) };
}
