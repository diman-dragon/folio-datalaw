// Drawing and annotation gestures across document pages.
let activeTool = null, drawing = false, curCtx = null, curRect = null, dpr = 1;
const pagesContainer = document.getElementById('viewer-pages');
function getCanvas(pageEl) {
  let c = pageEl.querySelector('.annotate-layer');
  if (!c) {
    c = document.createElement('canvas');
    c.className = 'annotate-layer';
    const w = pageEl.clientWidth || 300, h = pageEl.clientHeight || 400;
    c.width = Math.round(w * (window.devicePixelRatio || 1));
    c.height = Math.round(h * (window.devicePixelRatio || 1));
    pageEl.append(c);
  }
  return c;
}
function setupCanvasCtx(ctx, tool) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'source-over';
  if (tool === 'pen') { ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3 * dpr; }
  else if (tool === 'highlighter') { ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)'; ctx.lineWidth = 20 * dpr; ctx.lineCap = 'square'; }
  else if (tool === 'underline') { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3 * dpr; }
  else if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 26 * dpr; }
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
  const on = Boolean(tool && tool !== 'text-select');
  document.getElementById('viewer').classList.toggle('draw-active', on);
}
export function getDrawTool() { return activeTool; }
pagesContainer.addEventListener('pointerdown', onPointerDown, { passive: false });
pagesContainer.addEventListener('pointermove', onPointerMove, { passive: false });
pagesContainer.addEventListener('pointerup', onPointerUp, { passive: false });
pagesContainer.addEventListener('pointercancel', onPointerUp, { passive: false });
