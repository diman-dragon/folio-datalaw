// Covers of reflowable books: the embedded picture scaled to the card size, or a generated title card.
const W = 320, H = 452;
const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
function wrap(ctx, text, max) {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 7);
}
function card({ title, author, tag }) {
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = c.getContext('2d'), h = hue(title + author);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, `hsl(${h} 45% 34%)`);
  g.addColorStop(1, `hsl(${(h + 40) % 360} 50% 18%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '600 20px Georgia, serif';
  wrap(ctx, author, W - 70).forEach((l, i) => ctx.fillText(l, W / 2, 70 + i * 26));
  ctx.font = '700 30px Georgia, serif';
  wrap(ctx, title || tag, W - 70).forEach((l, i) => ctx.fillText(l, W / 2, 190 + i * 38));
  ctx.font = '700 15px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText(tag.toUpperCase(), W / 2, H - 34);
  return c;
}
async function picture(blob) {
  const bmp = await createImageBitmap(blob);
  const c = Object.assign(document.createElement('canvas'), { width: W, height: Math.round((W * bmp.height) / bmp.width) });
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}
export async function coverBlob({ title = '', author = '', tag = '', image = null }) {
  const canvas = (image && (await picture(image).catch(() => null))) || card({ title, author, tag });
  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
}
