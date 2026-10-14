// Handles text tap selection, range expansion and copy bubble menu.
import { toast } from './toast.js';
import { t } from '../core/i18n.js';
const menu = document.getElementById('text-menu');
const copyBtn = document.getElementById('text-copy-btn');
export function hideTextMenu() {
  if (menu) menu.hidden = true;
}
function showMenuForRange(range) {
  const r = range.getBoundingClientRect();
  if (!r || (r.width === 0 && r.height === 0)) return;
  menu.hidden = false;
  const top = Math.max(52, r.top - 8);
  const left = Math.min(window.innerWidth - 70, Math.max(70, r.left + r.width / 2));
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}
function selectWordAt(e) {
  let range = null;
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) {
      range = getWordRange(pos.offsetNode, pos.offset);
    }
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (r?.startContainer?.nodeType === Node.TEXT_NODE) {
      range = getWordRange(r.startContainer, r.startOffset);
    }
  }
  if (range) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    showMenuForRange(range);
  }
}
function getWordRange(node, offset) {
  const s = node.textContent;
  if (!s) return null;
  let i0 = offset, i1 = offset;
  while (i0 > 0 && /\S/.test(s[i0 - 1])) i0--;
  while (i1 < s.length && /\S/.test(s[i1])) i1++;
  if (i0 >= i1) return null;
  const r = document.createRange();
  r.setStart(node, i0);
  r.setEnd(node, i1);
  return r;
}
copyBtn?.addEventListener('click', async () => {
  const text = window.getSelection()?.toString() || '';
  if (text) {
    try { await navigator.clipboard.writeText(text); } catch { document.execCommand('copy'); }
    toast(t('viewer.copied'));
  }
  hideTextMenu();
  window.getSelection()?.removeAllRanges();
});
document.addEventListener('pointerup', (e) => {
  if (e.target.closest('#text-menu')) return;
  const inText = e.target.closest('.textLayer');
  if (!inText) { hideTextMenu(); return; }
  setTimeout(() => {
    const sel = window.getSelection();
    const str = sel?.toString()?.trim();
    if (str && sel.rangeCount > 0) {
      showMenuForRange(sel.getRangeAt(0));
    } else if (inText) {
      selectWordAt(e);
    }
  }, 20);
});
