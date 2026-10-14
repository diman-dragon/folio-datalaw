// Paints annotation items onto a page's ink / mark canvases (items use 0..1 page coordinates).
export const HL_ALPHA = 0.4;
function strokePath(ctx, pts, cw, ch) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * cw, pts[0][1] * ch);
  if (pts.length === 1) { ctx.lineTo(pts[0][0] * cw + 0.01, pts[0][1] * ch); return; }
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [nx, ny] = pts[i + 1];
    ctx.quadraticCurveTo(x * cw, y * ch, ((x + nx) / 2) * cw, ((y + ny) / 2) * ch);
  }
  ctx.lineTo(pts.at(-1)[0] * cw, pts.at(-1)[1] * ch);
}
function line(ctx, item, cw, ch, alpha, op = 'source-over') {
  ctx.save();
  Object.assign(ctx, { lineCap: 'round', lineJoin: 'round', lineWidth: item.w * cw, strokeStyle: item.c, globalAlpha: alpha, globalCompositeOperation: op });
  strokePath(ctx, item.p, cw, ch);
  ctx.stroke();
  ctx.restore();
}
function fillRects(ctx, item, cw, ch) {
  ctx.save();
  ctx.globalAlpha = HL_ALPHA;
  ctx.fillStyle = item.c;
  ctx.beginPath();
  item.r.forEach(([x, y, w, h]) => ctx.rect(x * cw, y * ch, w * cw, h * ch));
  ctx.fill();
  ctx.restore();
}
function underline(ctx, item, cw, ch) {
  ctx.save();
  ctx.strokeStyle = item.c;
  ctx.lineCap = 'round';
  item.r.forEach(([x, y, w, h]) => {
    ctx.lineWidth = Math.max(1.2, h * ch * 0.08);
    const yy = (y + h) * ch - ctx.lineWidth * 1.3;
    ctx.beginPath();
    ctx.moveTo(x * cw, yy);
    ctx.lineTo((x + w) * cw, yy);
    ctx.stroke();
  });
  ctx.restore();
}
export function paintItem(item, ink, mark) {
  const cw = ink.width, ch = ink.height;
  const ic = ink.getContext('2d'), mc = mark.getContext('2d');
  if (item.k === 'er') { line(ic, item, cw, ch, 1, 'destination-out'); line(mc, item, cw, ch, 1, 'destination-out'); }
  else if (item.k === 'pen') line(ic, item, cw, ch, 1);
  else if (item.k === 'hl') line(mc, item, cw, ch, HL_ALPHA);
  else if (item.k === 'th') fillRects(mc, item, cw, ch);
  else if (item.k === 'tu') underline(ic, item, cw, ch);
}
