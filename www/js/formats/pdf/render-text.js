// Renders pdf.js text layer into a container matching page viewport.
import { pdfjs } from './pdfjs.js';
export async function renderTextLayer(page, container, viewport) {
  try {
    const { TextLayer } = await pdfjs();
    const textContent = await page.getTextContent();
    const layer = new TextLayer({ textContentSource: textContent, container, viewport });
    await layer.render();
    return layer;
  } catch (err) {
    console.error('TextLayer render error:', err);
    return null;
  }
}
