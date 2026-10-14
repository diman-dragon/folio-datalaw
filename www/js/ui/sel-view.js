// Selection overlay inside a page: translucent line boxes plus two drag handles (the text underneath stays visible).
let layer = null, boxes = null, h0 = null, h1 = null;
const handle = (side) => Object.assign(document.createElement('div'), { className: `sel-handle ${side}` });
function build(pageEl) {
  layer = Object.assign(document.createElement('div'), { className: 'sel-layer' });
  boxes = document.createElement('div');
  h0 = handle('start');
  h1 = handle('end');
  h0.dataset.side = 'start';
  h1.dataset.side = 'end';
  layer.append(boxes, h0, h1);
  pageEl.append(layer);
}
const place = (h, x, y) => { h.style.transform = `translate(${x}px,${y}px)`; };
export function paintSel(pageEl, lines, { handles = true } = {}) {
  if (!layer || layer.parentNode !== pageEl) { removeSel(); build(pageEl); }
  boxes.replaceChildren(...lines.map((l) => {
    const d = document.createElement('div');
    d.className = 'sel-box';
    d.style.cssText = `left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px`;
    return d;
  }));
  const f = lines[0], l = lines.at(-1);
  place(h0, f.x, f.y + f.h);
  place(h1, l.x + l.w, l.y + l.h);
  h0.hidden = h1.hidden = !handles;
}
export function removeSel() { layer?.remove(); layer = boxes = h0 = h1 = null; }
export const handleSide = (el) => el.closest?.('.sel-handle')?.dataset.side ?? null;
