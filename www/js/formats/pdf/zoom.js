// Zoom state (0.5x-5x), pinch gesture on the scroller; keeps the viewport center stable.
const MIN = 0.5, MAX = 5;
export function createZoom({ scroller, onChange }) {
  let scale = 1, d0 = 0, s0 = 1;
  function set(next) {
    next = Math.min(MAX, Math.max(MIN, next));
    if (next === scale) return;
    const cx = (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth;
    const cy = (scroller.scrollTop + scroller.clientHeight / 2) / scroller.scrollHeight;
    scale = next;
    onChange(scale);
    scroller.scrollLeft = cx * scroller.scrollWidth - scroller.clientWidth / 2;
    scroller.scrollTop = cy * scroller.scrollHeight - scroller.clientHeight / 2;
  }
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const start = (e) => { if (e.touches.length === 2) { d0 = dist(e.touches); s0 = scale; } };
  const move = (e) => { if (e.touches.length === 2 && d0) { e.preventDefault(); set((s0 * dist(e.touches)) / d0); } };
  const end = (e) => { if (e.touches.length < 2) d0 = 0; };
  scroller.addEventListener('touchstart', start, { passive: true });
  scroller.addEventListener('touchmove', move, { passive: false });
  scroller.addEventListener('touchend', end, { passive: true });
  return {
    get: () => scale,
    by: (f) => set(scale * f),
    destroy() {
      scroller.removeEventListener('touchstart', start);
      scroller.removeEventListener('touchmove', move);
      scroller.removeEventListener('touchend', end);
    },
  };
}
