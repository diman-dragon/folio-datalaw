// Tracks which page occupies most of the viewport and reports it (1-based).
export function trackPages({ scroller, els, onPage }) {
  const visible = new Map();
  let current = -1;
  const io = new IntersectionObserver((list) => {
    list.forEach((x) => {
      const i = Number(x.target.dataset.i);
      if (x.isIntersecting) visible.set(i, x.intersectionRect.width * x.intersectionRect.height); else visible.delete(i);
    });
    let best = current, bestA = -1;
    visible.forEach((a, i) => { if (a > bestA) { bestA = a; best = i; } });
    if (best !== current && best >= 0) { current = best; onPage(best + 1); }
  }, { root: scroller, threshold: [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1] });
  els.forEach((el) => io.observe(el));
  return { destroy: () => io.disconnect() };
}
