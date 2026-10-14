// Zoom state (0.5x-5x). Live gestures use a CSS transform (no layout); release commits one relayout anchored to the finger point.
const MIN = 0.5, MAX = 5;
export function createZoom({ scroller, content, els, onChange }) {
  let scale = 1;
  function anchorAt(x, y) {
    let best = null, bd = Infinity;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = { el, r }; if (!d) break; }
    }
    const { el, r } = best;
    return { el, fx: (x - r.left) / (r.width || 1), fy: (y - r.top) / (r.height || 1) };
  }
  function apply(next, a, x, y) {
    next = Math.min(MAX, Math.max(MIN, next));
    if (next !== scale) { scale = next; onChange(scale); }
    const r = a.el.getBoundingClientRect();
    scroller.scrollLeft += r.left + a.fx * r.width - x;
    scroller.scrollTop += r.top + a.fy * r.height - y;
  }
  const viewCenter = () => { const r = scroller.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  return {
    get: () => scale,
    begin(x, y) {
      const r = content.getBoundingClientRect();
      content.style.willChange = 'transform';
      return { x0: x, y0: y, x, y, k: 1, ox: r.left, oy: r.top, s0: scale, anchor: anchorAt(x, y) };
    },
    live(g, k, x, y) {
      g.k = Math.min(MAX / g.s0, Math.max(MIN / g.s0, k));
      g.x = x; g.y = y;
      content.style.transformOrigin = '0 0';
      content.style.transform = `translate(${x - g.ox - g.k * (g.x0 - g.ox)}px,${y - g.oy - g.k * (g.y0 - g.oy)}px) scale(${g.k})`;
    },
    end(g) {
      content.style.transform = '';
      content.style.willChange = '';
      apply(g.s0 * g.k, g.anchor, g.x, g.y);
    },
    by(f) { const [x, y] = viewCenter(); apply(scale * f, anchorAt(x, y), x, y); },
    toggleAt(x, y) { apply(scale > 1.2 ? 1 : 2.5, anchorAt(x, y), x, y); },
    reset() { if (scale !== 1) { scale = 1; onChange(1); } },
  };
}
