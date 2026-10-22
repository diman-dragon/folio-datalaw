// Safe block builders for text formats (DOM calls only: book text can never become markup).
export const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
export const para = (text, cls) => el('p', cls, text);
export const heading = (level, text) => el(`h${Math.min(6, Math.max(2, level + 1))}`, 'title', text);
export const gap = () => el('div', 'gap');
export function picture(url, alt = '') { const i = el('img', 'pic'); i.src = url; i.alt = alt; return i; }
// Inline run with the usual emphasis flags -> nested strong / em / u / s / sub / sup.
export function run(text, f = {}) {
  let node = document.createTextNode(text);
  for (const [flag, tag] of [['sup', 'sup'], ['sub', 'sub'], ['strike', 's'], ['u', 'u'], ['i', 'em'], ['b', 'strong'], ['code', 'code']]) {
    if (f[flag]) { const w = el(tag); w.append(node); node = w; }
  }
  return node;
}
