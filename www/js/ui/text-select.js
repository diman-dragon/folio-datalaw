// Text selection controller: owns the selection (page + char range), paints it and runs the menu actions.
import { lineBoxes, normRects, textOf } from './sel-chars.js';
import { paintSel, removeSel } from './sel-view.js';
import { showMenu, hideMenu, onMenuAction } from './text-menu.js';
import { addItem } from './annot-store.js';
import { repaintPage } from './annot-layers.js';
import { getDrawColor } from './viewer-draw.js';
import { copyText } from './clipboard.js';
import { pushBack } from './back.js';
import { toast } from './toast.js';
import { t } from '../core/i18n.js';
const scroller = document.getElementById('viewer-scroll');
let S = null, popBack = null;
export const getSel = () => S;
export function clearSel() {
  S = null;
  removeSel();
  hideMenu();
  popBack?.();
  popBack = null;
}
export function placeMenu() {
  if (!S) return;
  if (!S.el.dataset.ready) { clearSel(); return; }
  const pr = S.el.getBoundingClientRect(), b = scroller.getBoundingClientRect();
  const f = S.lines[0], l = S.lines.at(-1);
  const anchor = { left: pr.left + Math.min(...S.lines.map((x) => x.x)), right: pr.left + Math.max(...S.lines.map((x) => x.x + x.w)), top: pr.top + f.y, bottom: pr.top + l.y + l.h };
  if (anchor.bottom < b.top || anchor.top > b.bottom) hideMenu(); else showMenu(anchor, b);
}
export function select(el, chars, a, b, { menu = true } = {}) {
  S = { el, chars, a, b, lines: lineBoxes(chars, a, b) };
  popBack ??= pushBack(clearSel);
  paintSel(el, S.lines);
  if (menu) placeMenu(); else hideMenu();
}
// Marks a char range as highlight ('th') or underline ('tu') annotation.
export function applyMark(kind, el, chars, a, b) {
  const c = getDrawColor();
  addItem(Number(el.dataset.i), { k: kind, c: kind === 'th' && c === '#1e293b' ? '#facc15' : c, r: normRects(lineBoxes(chars, a, b), el) });
  repaintPage(el);
}
onMenuAction(async (act) => {
  if (!S) return;
  const { el, chars, a, b } = S;
  if (act === 'copy') { if (await copyText(textOf(chars, a, b))) toast(t('viewer.copied')); }
  else applyMark(act === 'hl' ? 'th' : 'tu', el, chars, a, b);
  clearSel();
});
