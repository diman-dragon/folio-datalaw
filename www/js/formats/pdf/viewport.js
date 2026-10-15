// Scroll-driven virtualization: mounts pages near the viewport, frees far ones, reports the current page, refreshes zoom details.
export function createViewport({ scroller, lay, entries, views, getMode, onPage }) {
  let raf = 0, idle = 0, cur = -1;
  const geo = () => (getMode() === 'paged' ? [scroller.scrollLeft, scroller.clientWidth] : [scroller.scrollTop, scroller.clientHeight]);
  function details() {
    const [pos, len] = geo();
    const view = scroller.getBoundingClientRect();
    const [a, b] = lay.range(pos, len, 0);
    for (let i = a; i <= b; i++) if (entries[i].mounted) views.detail(entries[i], view, Math.abs(i - cur));
  }
  function sync() {
    raf = 0;
    const [pos, len] = geo();
    const mid = pos + len / 2;
    const [a, b] = lay.range(pos, len, len * 0.6);
    for (let i = a; i <= b; i++) views.show(entries[i], Math.abs(lay.start(i) + lay.size(i) / 2 - mid) / len);
    const [ka, kb] = lay.range(pos, len, len * 1.6);
    views.mounted.forEach((e) => { if (e.i < ka || e.i > kb) views.hide(e); });
    const c = lay.indexAt(mid);
    if (c !== cur) { cur = c; onPage(c + 1); }
    clearTimeout(idle);
    idle = setTimeout(details, 140);
  }
  const schedule = () => { raf ||= requestAnimationFrame(sync); };
  scroller.addEventListener('scroll', schedule, { passive: true });
  return {
    sync,
    destroy() { cancelAnimationFrame(raf); clearTimeout(idle); scroller.removeEventListener('scroll', schedule); },
  };
}
