// Two-finger gesture on the scroller (works with any tool): pinch zoom + pan follow the fingers; a plain swipe is reported.
export function attachPinch({ scroller, zoom, onSwipe, onStart = () => {} }) {
  let g = null, d0 = 0;
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1;
  const mid = (t) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
  const start = (e) => {
    if (e.touches.length !== 2 || g) return;
    d0 = dist(e.touches);
    g = zoom.begin(...mid(e.touches));
    onStart();
  };
  const move = (e) => {
    if (!g || e.touches.length !== 2) return;
    e.preventDefault();
    zoom.live(g, dist(e.touches) / d0, ...mid(e.touches));
  };
  const end = (e) => {
    if (!g || e.touches.length >= 2) return;
    const done = g;
    g = null;
    zoom.end(done);
    if (Math.abs(done.k - 1) < 0.06) onSwipe({ dx: done.x - done.x0, dy: done.y - done.y0, dt: Date.now() - done.t0 });
  };
  scroller.addEventListener('touchstart', start, { passive: true });
  scroller.addEventListener('touchmove', move, { passive: false });
  scroller.addEventListener('touchend', end, { passive: true });
  scroller.addEventListener('touchcancel', end, { passive: true });
  return () => {
    scroller.removeEventListener('touchstart', start);
    scroller.removeEventListener('touchmove', move);
    scroller.removeEventListener('touchend', end);
    scroller.removeEventListener('touchcancel', end);
  };
}
