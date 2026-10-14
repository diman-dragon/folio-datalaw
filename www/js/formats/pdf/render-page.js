// Renders one pdf.js page into a canvas at device resolution (capped to protect memory).
const MAX_PIXELS = 12_000_000;
export function renderPage(page, canvas, cssWidth) {
  const base = page.getViewport({ scale: 1 });
  let scale = (cssWidth / base.width) * Math.min(window.devicePixelRatio || 1, 2.5);
  const px = base.width * scale * base.height * scale;
  if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px);
  const viewport = page.getViewport({ scale });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  return page.render({ canvas, viewport });
}
