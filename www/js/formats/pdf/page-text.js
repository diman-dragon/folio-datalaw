// Lazy text layer of one page: built on demand (long press / text tools), dropped when the page is re-rendered.
import { renderTextLayer } from './render-text.js';
export function ensureText(e) {
  const w = e.drawnAt;
  if (!w || !e.page) return Promise.resolve(null);
  if (e.text?.w === w) return Promise.resolve(e.text.div);
  if (e.textJob?.w === w) return e.textJob.p;
  const div = document.createElement('div');
  div.className = 'textLayer';
  const vp = e.page.getViewport({ scale: w / e.page.getViewport({ scale: 1 }).width });
  const p = renderTextLayer(e.page, div, vp)
    .then(() => {
      if (e.drawnAt !== w) return null;
      e.el.append(div);
      e.text = { div, w };
      return div;
    })
    .catch((err) => { console.error('text layer', err); return null; })
    .finally(() => { if (e.textJob?.p === p) e.textJob = null; });
  e.textJob = { w, p };
  return p;
}
