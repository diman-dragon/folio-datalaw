// Keeps the marks and drawings of the open document: saved (per layout signature) a moment after every change, restored on open.
import { exportAnnots, importAnnots, clearAnnots } from './annot-store.js';
import { repaintPage } from './annot-layers.js';
import { saveAnnots, loadAnnots } from '../data/annot-db.js';
import { on } from '../core/bus.js';
let docId = null, handle = null, timer = 0, loading = false;
const sig = () => handle?.layoutSig?.() ?? 'pdf';
async function flush() {
  clearTimeout(timer);
  if (docId && !loading) await saveAnnots(docId, sig(), exportAnnots()).catch(() => {});
}
async function restore() {
  loading = true;
  const id = docId;
  const data = await loadAnnots(id, sig()).catch(() => []);
  if (id === docId) {
    importAnnots(data);
    document.querySelectorAll('.pdf-page[data-ready]').forEach(repaintPage);
  }
  loading = false;
}
export function startPersist(id, h) { docId = id; handle = h; clearAnnots(); return restore(); }
export async function stopPersist() { await flush(); docId = null; handle = null; }
on('annotchange', () => { if (docId && !loading) { clearTimeout(timer); timer = setTimeout(flush, 800); } });
on('layoutwill', flush);   // another pagination is about to replace the pages: save the old one first
on('layoutchange', restore);
