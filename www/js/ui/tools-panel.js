// Floating tool palette (transparent backing, over the document): tools, colours, page flip, lock position, hide.
import { setDrawTool, setDrawColor } from './viewer-draw.js';
import { initPanelDrag } from './panel-drag.js';
import { getActiveHandle } from './viewer-handle.js';
import { toast } from './toast.js';
import { t } from '../core/i18n.js';
import { on, emit } from '../core/bus.js';
import { getPref, setPref } from '../core/prefs.js';
const panel = document.getElementById('tools-panel');
const editBtn = document.getElementById('edit-btn');
const tools = [...panel.querySelectorAll('[data-tool]')];
const dots = panel.querySelectorAll('.color-dot');
let pinned = getPref('panelpinned', false), tool = null, page = 1, total = 1;
const place = initPanelDrag(panel, () => pinned);
function pick(next) {
  tool = next;
  tools.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
  setDrawTool(tool);
  if (tool === 'text-select' || tool === 'underline') toast(t('edit.hintMark'));
}
export function showPanel(open, { save = true } = {}) {
  panel.hidden = !open;
  editBtn.classList.toggle('active', open);
  if (save) setPref('panelopen', open);
  if (open) place(); else if (tool) pick(null);
  emit('editbar', open);
}
export const restorePanel = () => showPanel(getPref('panelopen', false), { save: false });
export const suspendPanel = () => showPanel(false, { save: false });
editBtn.addEventListener('click', () => showPanel(panel.hidden));
document.getElementById('tp-hide').addEventListener('click', () => showPanel(false));
const pinBtn = document.getElementById('tp-pin');
const paintPin = () => { pinBtn.classList.toggle('on', pinned); panel.classList.toggle('pinned', pinned); };
pinBtn.addEventListener('click', () => { pinned = !pinned; setPref('panelpinned', pinned); paintPin(); });
tools.forEach((b) => b.addEventListener('click', () => pick(tool === b.dataset.tool ? null : b.dataset.tool)));
dots.forEach((d) => d.addEventListener('click', () => {
  dots.forEach((x) => x.classList.toggle('active', x === d));
  setDrawColor(d.dataset.color);
}));
const flip = (d) => getActiveHandle()?.goTo(Math.min(total, Math.max(1, page + d)), true);
document.getElementById('tp-prev').addEventListener('click', () => flip(-1));
document.getElementById('tp-next').addEventListener('click', () => flip(1));
on('pagechange', (p) => { page = p.n; total = p.total; });
paintPin();
