// Drawing and annotation gestures across document pages.
let activeTool = null;
const pagesContainer = document.getElementById('viewer-pages');
function getCanvas(pageEl) {
  let c = pageEl.querySelector('.annotate-layer');
  if (!c) {
    c = document.createElement('canvas');
    c.className = 'annotate-layer';
    const r = pageEl.getBoundingClientRect();
    c.width = Math.round(r.width * (window.devicePixelRatio || 1));
    c.height = Math.round(r.height * (window.devicePixelRatio || 1));
    pageEl.append(c);
  }
  return c;
}
function setupCanvasCtx(ctx, tool) {
  const dpr = window.devicePixelRatio || 1;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'source-over';
  if (tool === 'pen') { ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 2.5 * dpr; }
  else if (tool === 'highlighter') { ctx.strokeStyle = 'rgba(255, 235, 59, 0.45)'; ctx.lineWidth = 18 * dpr; ctx.lineCap = 'square'; }
  else if (tool === 'underline') { ctx.strokeStyle = '#e53935'; ctx.lineWidth = 2.5 * dpr; }
  else if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 24 * dpr; }
}
let drawing = false, lastX = 0, lastY = 0, curCtx = null;
function onPointerDown(e) {
  if (!activeTool || activeTool === 'text-select') return;
  const page = e.target.closest('.pdf-page');
  if (!page) return;
  const canvas = getCanvas(page);
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  curCtx = canvas.getContext('2d');
  setupCanvasCtx(curCtx, activeTool);
  drawing = true;
  lastX = (e.clientX - r.left) * dpr;
  lastY = (e.clientY - r.top) * dpr;
  curCtx.beginPath();
  curCtx.moveTo(lastX, lastY);
  canvas.setPointerCapture?.(e.pointerId);
}
function onPointerMove(e) {
  if (!drawing || !curCtx) return;
  const canvas = curCtx.canvas;
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = (e.clientX - r.left) * dpr;
  const y = (e.clientY - r.top) * dpr;
  curCtx.lineTo(x, y);
  curCtx.stroke();
  lastX = x; lastY = y;
}
function onPointerUp() {
  if (!drawing) return;
  drawing = false;
  curCtx = null;
}
export function setDrawTool(tool) {
  activeTool = tool;
  const on = Boolean(tool && tool !== 'text-select');
  document.getElementById('viewer').classList.toggle('draw-active', on);
}
export function getDrawTool() { return activeTool; }
pagesContainer.addEventListener('pointerdown', onPointerDown);
pagesContainer.addEventListener('pointermove', onPointerMove);
pagesContainer.addEventListener('pointerup', onPointerUp);
pagesContainer.addEventListener('pointercancel', onPointerUp);
