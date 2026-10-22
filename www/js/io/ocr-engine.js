// Offline OCR engine: tesseract.js + wasm core + language data, fetched into www/vendor/tesseract by scripts/fetch-ocr.mjs.
// Every step reports its status; a step that shows no sign of life for a minute fails with the last status instead of hanging.
const base = new URL('../../vendor/tesseract/', import.meta.url).href;
const stall = () => globalThis.__ocrStall ?? 60000; // the override is only for tests
const SIMD = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
let info, worker = null, key = '', sink = null;
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
// Runs fn(ping); rejects when ping() was not called for STALL ms.
function watched(fn, what) {
  let timer, last = what, rej;
  const stalled = new Promise((_, r) => { rej = r; });
  const ping = (text) => { if (text) last = text; clearTimeout(timer); timer = setTimeout(() => rej(new Error(`stalled at "${last}"`)), stall()); };
  ping();
  return Promise.race([fn(ping), stalled]).finally(() => clearTimeout(timer));
}
const corePaths = (meta) => {
  const file = `tesseract-core${WebAssembly.validate(SIMD) ? '-simd' : ''}-lstm.wasm.js`;
  return [`${base}core`, ...(meta.core?.includes(file) ? [`${base}core/${file}`] : [])];
};
// Starts the worker; if one way fails or stalls the next is tried (core as directory / exact file, worker from URL / blob).
async function start(meta, langs) {
  const mod = await import(`${base}tesseract.esm.min.js`);
  const T = mod.createWorker ? mod : (mod.default?.createWorker ? mod.default : globalThis.Tesseract);
  if (typeof T?.createWorker !== 'function') throw new Error('createWorker export not found in tesseract.esm.min.js');
  const errors = [];
  for (const [blob, core] of [[false, 0], [true, 0], [false, 1]]) {
    const corePath = corePaths(meta)[core];
    if (!corePath) continue;
    try {
      return await watched((ping) => T.createWorker(langs, 1, {
        workerPath: `${base}worker.min.js`, corePath, langPath: `${base}lang`, gzip: true, cacheMethod: 'none', workerBlobURL: blob,
        logger: (m) => { ping(m.status); sink?.(m.status, m.progress ?? 0); },
      }), 'starting');
    } catch (err) { errors.push(String(err?.message ?? err)); }
  }
  throw new Error(`engine: ${errors.join(' | ')}`);
}
const wordsOf = (d) => d.words ?? (d.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)));
const toBlob = (canvas) => new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('canvas.toBlob failed'))), 'image/png'));
// Recognizes a canvas; resolves with words [{ text, x0, y0, x1, y1 }] in canvas px. onStatus(text, 0..1) reports every step.
export async function recognize(canvas, langs, onStatus) {
  const meta = await ocrInfo();
  if (!meta) throw new Error('ocr-missing');
  const use = langs.filter((l) => meta.langs.includes(l));
  if (!use.length) throw new Error('ocr-lang');
  sink = onStatus;
  if (worker && key !== use.join('+')) await stopOcr();
  if (!worker) { key = use.join('+'); worker = await start(meta, key); }
  onStatus?.('recognizing text', 0);
  const image = await toBlob(canvas);
  const { data } = await watched((ping) => { sink = (s, p) => { ping(s); onStatus?.(s, p); }; return worker.recognize(image); }, 'recognizing text');
  return wordsOf(data)
    .filter((w) => w.text?.trim() && w.confidence >= 35)
    .map((w) => ({ text: w.text.trim(), x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }));
}
