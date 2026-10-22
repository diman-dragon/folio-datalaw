// Viewer overlay lifecycle: open a document with its format module, close, remember the last page.
import { find } from '../formats/registry.js';
import { pushBack } from './back.js';
import { setHandle, showPage } from './viewer-toolbar.js';
import { initThumbs, updateThumbsActive, destroyThumbs } from './viewer-thumbs.js';
import { suspendPanel, restorePanel } from './tools-panel.js';
import { startAwake, stopAwake } from '../core/awake.js';
import { emit } from '../core/bus.js';
import { setActiveHandle, setActiveDoc } from './viewer-handle.js';
import { loadAllOcr } from '../data/ocr-store.js';
import { on } from '../core/bus.js';
import { flushProgress, saveProgress, resetProgress } from './viewer-progress.js';
import { startPersist, stopPersist } from './annot-persist.js';
import { clearAnnots } from './annot-store.js';
import { clearSel } from './text-select.js';
import { t } from '../core/i18n.js';
import { getReadMode } from '../core/readmode.js';
const root = document.getElementById('viewer');
const pages = document.getElementById('viewer-pages');
const scroller = document.getElementById('viewer-scroll');
const status = document.getElementById('viewer-status');
let handle = null, popBack = null, session = 0;
const setStatus = (text) => { status.hidden = !text; status.textContent = text ?? ''; };
// Another pagination of a reflowable book: the thumbnail list has to follow the new page count.
on('layoutchange', () => { if (handle?.doc) initThumbs(handle.doc, handle, 1); });
export function closeViewer() {
  session++;
  stopAwake();
  flushProgress();
  stopPersist();
  resetProgress();
  try { handle?.destroy(); } catch (err) { console.error(err); }
  handle = null;
  setHandle(null);
  setActiveHandle(null);
  setActiveDoc(null);
  emit('viewerclose');
  clearSel();
  clearAnnots();
  destroyThumbs();
  suspendPanel();
  popBack?.();
  popBack = null;
  root.hidden = true;
  root.classList.remove('no-thumbs', 'no-draw', 'no-mode', 'no-ocr');
  pages.replaceChildren();
  setStatus(null);
}
export async function openViewer(meta, blob) {
  closeViewer();
  const mine = session;
  document.getElementById('viewer-title').textContent = meta.name;
  setStatus(t('viewer.loading'));
  root.hidden = false;
  popBack = pushBack(closeViewer);
  try {
    const mod = find(meta.name, blob.type);
    let real = false;
    const onPage = (n, total, frac) => { showPage(n, total); saveProgress(meta, n, total, frac ?? 0, real); updateThumbsActive(n); emit('pagechange', { n, total }); };
    const wait = new Promise((_, rej) => setTimeout(() => rej(new Error('open timeout')), 120000));
    const h = await Promise.race([wait, mod.mount({ container: pages, scroller, blob, startPage: meta.lastPage ?? 1, startFrac: meta.lastFrac, name: meta.name, mode: getReadMode(), onPage })]);
    real = Boolean(h.layoutSig); // FB2: the page count depends on screen and font, so it is stored after opening
    if (mine !== session) { h.destroy(); return; }
    handle = h;
    setHandle(h);
    setActiveHandle(h);
    setActiveDoc(meta);
    const caps = { thumbs: true, draw: true, mode: true, ...h.caps };
    root.classList.toggle('no-thumbs', !caps.thumbs);
    root.classList.toggle('no-draw', !caps.draw);
    root.classList.toggle('no-mode', !caps.mode);
    root.classList.toggle('no-ocr', caps.ocr === false);
    if (h.setOcr) loadAllOcr(meta.id).then((list) => list.forEach(([i, d]) => h.setOcr(i, d))).catch(() => {});
    handle = h;
    initThumbs(h.doc, h, meta.lastPage ?? 1);
    if (caps.draw) restorePanel();
    startPersist(meta.id, h);
    startAwake();
    setStatus(null);
  } catch (err) {
    console.error(err);
    if (mine === session) { pages.replaceChildren(); setStatus(t('viewer.error')); }
  }
}
document.getElementById('viewer-back').addEventListener('click', closeViewer);
