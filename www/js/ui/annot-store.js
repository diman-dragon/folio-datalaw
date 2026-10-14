// In-memory annotations per page + one undo/redo history across pages. Coordinates are 0..1 of the page (follow zoom).
// Items: { k: 'pen'|'hl'|'er', c, w, p:[[x,y]..] } strokes; { k: 'th'|'tu', c, r:[[x,y,w,h]..] } text highlight / underline.
import { emit } from '../core/bus.js';
const pages = new Map();
let done = [], undone = [];
const changed = () => emit('annotchange', { undo: done.length > 0, redo: undone.length > 0 });
export const getItems = (i) => pages.get(i) ?? [];
export function addItem(i, item) {
  const list = pages.get(i) ?? [];
  list.push(item);
  pages.set(i, list);
  done.push({ i, item });
  undone = [];
  changed();
}
export function undoItem() {
  const h = done.pop();
  if (!h) return -1;
  const list = pages.get(h.i) ?? [];
  list.splice(list.lastIndexOf(h.item), 1);
  undone.push(h);
  changed();
  return h.i;
}
export function redoItem() {
  const h = undone.pop();
  if (!h) return -1;
  const list = pages.get(h.i) ?? [];
  list.push(h.item);
  pages.set(h.i, list);
  done.push(h);
  changed();
  return h.i;
}
export function clearAnnots() { pages.clear(); done = []; undone = []; changed(); }
