// Header undo / redo buttons: step through the annotation history of all pages and repaint the affected page.
import { undoItem, redoItem } from './annot-store.js';
import { repaintPage } from './annot-layers.js';
import { clearSel } from './text-select.js';
import { getActiveHandle } from './viewer-handle.js';
import { on } from '../core/bus.js';
const root = document.getElementById('viewer');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
let editing = false;
function apply(i) {
  if (i < 0) return;
  clearSel();
  const el = document.querySelector(`.pdf-page[data-i="${i}"]`);
  if (el?.dataset.ready) repaintPage(el);
  const r = el?.getBoundingClientRect(), s = document.getElementById('viewer-scroll').getBoundingClientRect();
  if (!r || r.bottom < s.top || r.top > s.bottom) getActiveHandle()?.goTo(i + 1); // show the page that changed
}
undoBtn.addEventListener('click', () => apply(undoItem()));
redoBtn.addEventListener('click', () => apply(redoItem()));
const paint = () => root.classList.toggle('show-undo', editing);
on('annotchange', ({ undo, redo }) => { undoBtn.disabled = !undo; redoBtn.disabled = !redo; });
on('editbar', (open) => { editing = open; paint(); });
