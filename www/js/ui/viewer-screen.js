// Viewer overlay lifecycle: open a document with its format module, close, remember the last page.
import { find } from '../formats/registry.js';
import { updateDoc } from '../data/library.js';
import { pushBack } from './back.js';
import { setHandle, showPage } from './viewer-toolbar.js';
import { t } from '../core/i18n.js';
import { getReadMode } from '../core/readmode.js';
const root = document.getElementById('viewer');
const pages = document.getElementById('viewer-pages');
const scroller = document.getElementById('viewer-scroll');
const status = document.getElementById('viewer-status');
let handle = null, popBack = null, session = 0, saveTimer;
const setStatus = (text) => { status.hidden = !text; status.textContent = text ?? ''; };
const saveLater = (id, n) => { clearTimeout(saveTimer); saveTimer = setTimeout(() => updateDoc(id, { lastPage: n }), 600); };
export function closeViewer() {
  session++;
  try { handle?.destroy(); } catch (err) { console.error(err); }
  handle = null;
  setHandle(null);
  popBack?.();
  popBack = null;
  root.hidden = true;
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
    const onPage = (n, total) => { showPage(n, total); saveLater(meta.id, n); };
    const h = await mod.mount({ container: pages, scroller, blob, startPage: meta.lastPage ?? 1, mode: getReadMode(), onPage });
    if (mine !== session) { h.destroy(); return; }
    handle = h;
    setHandle(h);
    setStatus(null);
  } catch (err) {
    console.error(err);
    if (mine === session) { pages.replaceChildren(); setStatus(t('viewer.error')); }
  }
}
document.getElementById('viewer-back').addEventListener('click', closeViewer);
