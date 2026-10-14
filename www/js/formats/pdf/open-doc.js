// Opens a PDF Blob as a pdf.js document (asks for a password when needed).
import { pdfjs, ASSETS } from './pdfjs.js';
import { t } from '../../core/i18n.js';
export async function openPdf(blob) {
  const lib = await pdfjs();
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = lib.getDocument({
    data,
    cMapUrl: ASSETS + 'cmaps/', cMapPacked: true,
    standardFontDataUrl: ASSETS + 'standard_fonts/',
    wasmUrl: ASSETS + 'wasm/', iccUrl: ASSETS + 'iccs/',
  });
  task.onPassword = (update) => {
    const pw = prompt(t('viewer.password'));
    if (pw === null) task.destroy(); else update(pw);
  };
  return task.promise;
}
