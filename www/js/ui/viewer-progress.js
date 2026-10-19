// Reading progress of the open document: page + position fraction saved shortly after every page change.
import { updateDoc } from '../data/library.js';
import { emit } from '../core/bus.js';
let pending = null, timer = 0, known = 0;
export async function flushProgress() {
  clearTimeout(timer);
  const p = pending;
  pending = null;
  if (p) { await updateDoc(p.id, p.patch); emit('libchange'); }
}
export function saveProgress(meta, n, total, frac, realPages) {
  pending = { id: meta.id, patch: { lastPage: n, lastFrac: frac, ...(realPages && total !== known ? { pages: total } : {}) } };
  if (realPages) known = total;
  clearTimeout(timer);
  timer = setTimeout(flushProgress, 600);
}
export const resetProgress = () => { known = 0; };
