// Drawing and annotation gestures across document pages.
let activeTool = null, activeColor = '#2563eb', drawing = false, curCtx = null, curRect = null, dpr = 1;
const pagesContainer = document.getElementById('viewer-pages');
function getCanvas(pageEl) {
  let c = pageEl.querySelector('.annotate-layer');
  if (!c) {
    c = document.createElement('canvas');
    c.className = 'annotate-layer';
    const r = pageEl.getBoundingClientRect();
    c.width = Math.round((r.width || pageEl.clientWidth || 300) * (window.devicePixelRatio || 1));
    c.height = Math.round((r.height || pageEl.clientHeight || 400) * (window.devicePixelRatio || 1));
    pageEl.append(c);
  }
  return c;
}
function setupCanvasCtx(ctx, tool) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'multiply';
  if (tool === 'pen') {
    ctx.strokeStyle = activeColor; ctx.globalAlpha = 0.72; ctx.lineWidth = 3 * dpr;
  } else if (tool === 'highlighter') {
    ctx.strokeStyle = activeColor; ctx.globalAlpha = 0.38; ctx.lineWidth = 22 * dpr; ctx.lineCap = 'square';
  } else if (tool === 'underline') {
    ctx.strokeStyle = activeColor; ctx.globalAlpha = 0.8; ctx.lineWidth = 3.5 * dpr;
  } else if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1.0; ctx.lineWidth = 28 * dpr;
  }
}
function onPointerDown(e) {
  if (!activeTool || activeTool === 'text-select') return;
  const page = e.target.closest('.pdf-page');
  if (!page) return;
  e.preventDefault(); e.stopPropagation();
  const canvas = getCanvas(page);
  dpr = window.devicePixelRatio || 1;
  curRect = canvas.getBoundingClientRect();
  curCtx = canvas.getContext('2d');
  setupCanvasCtx(curCtx, activeTool);
  drawing = true;
  const x = (e.clientX - curRect.left) * dpr;
  const y = (e.clientY - curRect.top) * dpr;
  curCtx.beginPath();
  curCtx.moveTo(x, y);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
}
function onPointerMove(e) {
  if (!drawing || !curCtx || !curRect) return;
  e.preventDefault(); e.stopPropagation();
  const x = (e.clientX - curRect.left) * dpr;
  const y = (e.clientY - curRect.top) * dpr;
  curCtx.lineTo(x, y);
  curCtx.stroke();
}
function onPointerUp(e) {
  if (!drawing) return;
  e?.preventDefault?.(); e?.stopPropagation?.();
  drawing = false; curCtx = null; curRect = null;
}
export function setDrawTool(tool) {
  activeTool = tool;
  const on = Boolean(tool && tool !== 'text-select' && tool !== 'underline');
  const root = document.getElementById('viewer');
  root.classList.toggle('draw-active', on);
  root.classList.toggle('tool-text-select', tool === 'text-select');
  root.classList.toggle('tool-underline', tool === 'underline');
}
export function setDrawColor(color) { activeColor = color; }
export function getDrawTool() { return activeTool; }
pagesContainer.addEventListener('pointerdown', onPointerDown, { passive: false });
pagesContainer.addEventListener('pointermove', onPointerMove, { passive: false });
pagesContainer.addEventListener('pointerup', onPointerUp, { passive: false });
pagesContainer.addEventListener('pointercancel', onPointerUp, { passive: false });
