// Viewer toolbar: zoom buttons and the page indicator (tap = go to page) bound to the active handle.
import { t } from '../core/i18n.js';
const pageBtn = document.getElementById('viewer-page');
let handle = null;
let total = 0;
export const setHandle = (h) => { handle = h; if (!h) pageBtn.textContent = ''; };
export function showPage(n, count) { total = count; pageBtn.textContent = `${n} / ${count}`; }
document.getElementById('zoom-in').addEventListener('click', () => handle?.zoomBy(1.25));
document.getElementById('zoom-out').addEventListener('click', () => handle?.zoomBy(0.8));
pageBtn.addEventListener('click', () => {
  const n = parseInt(prompt(`${t('viewer.goto')} (1-${total})`) ?? '', 10);
  if (n) handle?.goTo(n);
});
