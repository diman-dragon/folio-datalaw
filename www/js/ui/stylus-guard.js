// While stylus mode is on the pen must not scroll or flip pages: its touches are cancelled for scrolling (pointer events still work).
import { stylusOnly } from './stylus.js';
const scroller = document.getElementById('viewer-scroll');
let lastPen = -1e9;
const mark = (e) => { if (e.pointerType === 'pen') lastPen = performance.now(); };
// touchType says it directly; the pen pointer event that fires right before the touch event is the fallback for WebViews without it.
const isPen = (e) => [...e.changedTouches].some((t) => t.touchType === 'stylus') || performance.now() - lastPen < 250;
const guard = (e) => { if (stylusOnly() && isPen(e) && e.cancelable) e.preventDefault(); };
scroller.addEventListener('pointerdown', mark, { capture: true, passive: true });
scroller.addEventListener('pointermove', mark, { capture: true, passive: true });
scroller.addEventListener('touchstart', guard, { passive: false });
scroller.addEventListener('touchmove', guard, { passive: false });
