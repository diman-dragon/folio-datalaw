// Edit toolbar controller: tool selection, colours, pin; outside taps close it only while no tool is active.
import { setDrawTool, setDrawColor } from './viewer-draw.js';
import { toast } from './toast.js';
import { t } from '../core/i18n.js';
import { emit } from '../core/bus.js';
const editBar = document.getElementById('edit-bar');
const editBtn = document.getElementById('edit-btn');
const pinBtn = document.getElementById('edit-pin');
const toolBtns = [...editBar.querySelectorAll('.edit-tool[data-tool]:not(#edit-pin)')];
const colorDots = editBar.querySelectorAll('.color-dot');
let isPinned = false, currentTool = null;
function pick(tool) {
  currentTool = tool;
  toolBtns.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
  setDrawTool(tool);
}
export function openEditBar() { editBar.hidden = false; editBtn.classList.add('active'); emit('editbar', true); }
export function closeEditBar(force = false) {
  if (!force && (isPinned || currentTool)) return;
  editBar.hidden = true;
  editBtn.classList.remove('active');
  emit('editbar', false);
  if (force) { isPinned = false; pinBtn.classList.remove('pinned'); pick(null); }
}
editBtn.addEventListener('click', () => (editBar.hidden ? openEditBar() : closeEditBar(true)));
pinBtn.addEventListener('click', () => { isPinned = !isPinned; pinBtn.classList.toggle('pinned', isPinned); });
toolBtns.forEach((b) => b.addEventListener('click', () => {
  const tool = currentTool === b.dataset.tool ? null : b.dataset.tool;
  pick(tool);
  if (tool === 'text-select' || tool === 'underline') toast(t('edit.hintMark'));
}));
colorDots.forEach((dot) => dot.addEventListener('click', () => {
  colorDots.forEach((d) => d.classList.remove('active'));
  dot.classList.add('active');
  setDrawColor(dot.dataset.color);
}));
document.addEventListener('pointerdown', (e) => {
  if (editBar.hidden || isPinned || currentTool) return;
  if (editBar.contains(e.target) || editBtn.contains(e.target)) return;
  closeEditBar();
});
