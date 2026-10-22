// Schematic thumbnail of a reflowed page: grey bars where the text lines are, boxes for pictures (no layout pass needed).
const HEAD = /^H\d$/;
export function drawThumb(canvas, segs, blocks, geo) {
  canvas.height = Math.round((canvas.width * geo.ph) / geo.pw);
  const ctx = canvas.getContext('2d'), k = canvas.width / geo.pw;
  ctx.fillStyle = '#fbf5e6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const lh = geo.fs * 1.55, perLine = geo.w / (geo.fs * 0.5);
  let y = geo.py;
  for (const s of segs) {
    const b = blocks[s.b], total = b.textContent.length, len = s.n ? total / s.n : total; // a crossing block is estimated as an equal share
    if (b.tagName === 'IMG') {
      const w = Math.min(geo.w, (b.naturalWidth || 300) * 0.8), h = Math.min(geo.h * 0.7, w * ((b.naturalHeight || 200) / (b.naturalWidth || 300)));
      ctx.fillStyle = '#c9d3df';
      ctx.fillRect((geo.pw - w) / 2 * k, y * k, w * k, h * k);
      y += h + lh * 0.6;
      continue;
    }
    if (!len) { y += lh; continue; }
    const head = HEAD.test(b.tagName) || b.classList.contains('title');
    const lines = Math.max(1, Math.ceil(len / perLine));
    ctx.fillStyle = head ? '#4a3a28' : 'rgba(70,55,40,.55)';
    for (let i = 0; i < lines; i++) {
      const last = i === lines - 1 ? Math.min(1, (len - i * perLine) / perLine) : 1, w = geo.w * (head ? Math.min(.7, last) : last);
      ctx.fillRect((head ? (geo.pw - w) / 2 : geo.px) * k, (y + lh * 0.3) * k, w * k, Math.max(1, lh * 0.34 * k));
      y += lh;
    }
    if (head) y += lh * 0.8;
  }
}
