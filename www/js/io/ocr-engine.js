// Offline OCR engine: tesseract.js + wasm core + language data, fetched into www/vendor/tesseract by scripts/fetch-ocr.mjs.
const base = new URL('../../vendor/tesseract/', import.meta.url).href;
let info, worker = null, key = '', progress = null;
export async function ocrInfo() {
  info ??= await fetch(`${base}ready.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return info;
}
export async function stopOcr() {
  const w = worker;
  worker = null;
  key = '';
  try { await w?.terminate(); } catch { /* already gone */ }
}
const wordsOf = (d) => d.words ?? (d.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)));
// Recognizes a canvas; resolves with words [{ text, x0, y0, x1, y1 }] in canvas px.
export async function recognize(canvas, langs, onProgress) {
  const meta = await ocrInfo();
  if (!meta) throw new Error('ocr-missing');
  const use = langs.filter((l) => meta.langs.includes(l));
  if (!use.length) throw new Error('ocr-lang');
  progress = onProgress;
  if (worker && key !== use.join('+')) await stopOcr();
  if (!worker) {
    const { createWorker } = await import(`${base}tesseract.esm.min.js`);
    key = use.join('+');
    worker = await createWorker(key, 1, {
      workerPath: `${base}worker.min.js`, corePath: `${base}core`, langPath: `${base}lang`, gzip: true, workerBlobURL: false,
      logger: (m) => { if (m.status === 'recognizing text') progress?.(m.progress); },
    });
  }
  const { data } = await worker.recognize(canvas);
  return wordsOf(data)
    .filter((w) => w.text?.trim() && w.confidence >= 35)
    .map((w) => ({ text: w.text.trim(), x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }));
}
