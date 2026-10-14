// Edit toolbar controller: tools selection, outside click and pin toggle.
import { setDrawTool, setDrawColor } from './viewer-draw.js';
const editBar = document.getElementById('edit-bar');
const editBtn = document.getElementById('edit-btn');
const pinBtn = document.getElementById('edit-pin');
const toolBtns = editBar.querySelectorAll('.edit-tool[data-tool]:not(#edit-pin)');
const colorDots = editBar.querySelectorAll('.color-dot');
let isPinned = false;
let currentTool = null;
export function openEditBar() {
  editBar.hidden = false;
  editBtn.classList.add('active');
}
export function closeEditBar(force = false) {
  if (!force && isPinned) return;
  editBar.hidden = true;
  editBtn.classList.remove('active');
  if (force) {
    isPinned = false;
    pinBtn.classList.remove('pinned');
    currentTool = null;
    toolBtns.forEach((b) => b.classList.remove('active'));
    setDrawTool(null);
  }
}
export function toggleEditBar() {
  if (editBar.hidden) openEditBar();
  else closeEditBar(true);
}
editBtn.addEventListener('click', toggleEditBar);
pinBtn.addEventListener('click', () => {
  isPinned = !isPinned;
  pinBtn.classList.toggle('pinned', isPinned);
});
toolBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    if (currentTool === tool) {
      currentTool = null;
      btn.classList.remove('active');
      setDrawTool(null);
    } else {
      toolBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = tool;
      setDrawTool(tool);
    }
  });
});
colorDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    colorDots.forEach((d) => d.classList.remove('active'));
    dot.classList.add('active');
    setDrawColor(dot.dataset.color);
  });
});
document.addEventListener('pointerdown', (e) => {
  if (editBar.hidden || isPinned) return;
  if (editBar.contains(e.target) || editBtn.contains(e.target)) return;
  closeEditBar();
});
