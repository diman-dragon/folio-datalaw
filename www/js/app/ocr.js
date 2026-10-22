// OCR orchestration: render a page for recognition, run the engine, keep the result as a selectable text layer and in the library.
import { recognize } from '../io/ocr-engine.js';
import { saveOcr } from '../data/ocr-store.js';
const timeBox = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out`)), ms))]);
// onStatus(text, 0..1): "render" first, then the engine's own steps (loading core / language data / recognizing text).
export async function recognizePage(handle, docId, i, langs, onStatus) {
  onStatus?.('render', 0);
  const src = await timeBox(handle.renderForOcr(i), 40000, 'page render');
  const words = await recognize(src.canvas, langs, onStatus);
  const k = src.w / src.canvas.width;
  src.canvas.width = 0;
  const data = { w: src.w, h: src.h, words: words.map((x) => [x.text, x.x0 * k, x.y0 * k, (x.x1 - x.x0) * k, (x.y1 - x.y0) * k]) };
  handle.setOcr(i, data);
  await saveOcr(docId, i, data);
  return data;
}
// Pages that already have text (native or recognized) are skipped. Returns how many pages were recognized.
export async function recognizePages(handle, docId, pages, langs, { onPage, cancelled }) {
  let done = 0;
  for (let n = 0; n < pages.length && !cancelled(); n++) {
    const i = pages[n];
    onPage(n + 1, pages.length, 0, 'render');
    if (await handle.hasText(i)) continue;
    await recognizePage(handle, docId, i, langs, (s, p) => onPage(n + 1, pages.length, p, s));
    done++;
  }
  return done;
}
