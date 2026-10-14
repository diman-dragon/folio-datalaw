// Tracks which page occupies most of the viewport and reports it (1-based).
export function trackPages({ scroller, els, onPage }) {
  const visible = new Map();
  let current = -1;
  const io = new IntersectionObserver((list) => {
    list.forEach((x) => {
      const i = Number(x.target.dataset.i);
      if (x.isIntersecting) visible.set(i, x.intersectionRect.height); else visible.delete(i);
    });
    let best = current, bestH = -1;
    visible.forEach((h, i) => { if (h > bestH) { bestH = h; best = i; } });
    if (best !== current && best >= 0) { current = best; onPage(best + 1); }
  }, { root: scroller, threshold: Array.from({ length: 21 }, (_, k) => k / 20) });
  els.forEach((el) => io.observe(el));
  return { destroy: () => io.disconnect() };
}
