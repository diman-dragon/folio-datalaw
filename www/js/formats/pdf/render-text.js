// Builds a pdf.js text layer (invisible, geometry only) and makes sure its font sizes resolve.
import { pdfjs } from './pdfjs.js';
export async function renderTextLayer(page, container, viewport) {
  const { TextLayer } = await pdfjs();
  const textContent = await page.getTextContent();
  container.style.setProperty('--scale-factor', viewport.scale);
  await new TextLayer({ textContentSource: textContent, container, viewport }).render();
  fixFontSizes(container, viewport.scale);
}
// Safety net: if the stylesheet variables did not apply (other pdf.js build), size the spans inline.
function fixFontSizes(container, scale) {
  const first = container.querySelector('span');
  const h = first && parseFloat(first.style.getPropertyValue('--font-height'));
  if (!h || Math.abs(parseFloat(getComputedStyle(first).fontSize) - h * scale) < 1) return;
  container.querySelectorAll('span').forEach((el) => {
    const fh = parseFloat(el.style.getPropertyValue('--font-height'));
    if (fh) el.style.fontSize = `${fh * scale}px`;
    el.style.transform = `scaleX(${el.style.getPropertyValue('--scale-x') || 1})`;
  });
}
