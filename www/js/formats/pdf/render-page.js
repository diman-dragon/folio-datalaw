// Renders a pdf.js page (whole, or just a css-px window of it) into a canvas at device resolution, capped by pixel count.
export function renderPage(page, canvas, cssWidth, { maxPx = 3_000_000, rect = null } = {}) {
  const base = page.getViewport({ scale: 1 });
  const k = cssWidth / base.width;
  const w = rect ? rect.w : cssWidth;
  const h = rect ? rect.h : base.height * k;
  let d = Math.min(window.devicePixelRatio || 1, 2);
  if (w * h * d * d > maxPx) d = Math.sqrt(maxPx / (w * h));
  const viewport = page.getViewport({ scale: k * d, offsetX: rect ? -rect.x * d : 0, offsetY: rect ? -rect.y * d : 0 });
  canvas.width = Math.max(1, Math.floor(w * d));
  canvas.height = Math.max(1, Math.floor(h * d));
  return page.render({ canvas, viewport });
}
