// Picture formats: CBZ (a zip of pages) and single images; both open in the picture engine (zoom, thumbnails, text recognition).
import { mountPics, firstRatio, coverOf } from './engine.js';
import { zipList, zipRead } from '../shared/zip.js';
const IMG = /\.(jpe?g|png|webp|gif|bmp)$/i;
const MIME = (n) => (/\.png$/i.test(n) ? 'image/png' : /\.webp$/i.test(n) ? 'image/webp' : /\.gif$/i.test(n) ? 'image/gif' : /\.bmp$/i.test(n) ? 'image/bmp' : 'image/jpeg');
async function cbzItems(blob) {
  const buf = await blob.arrayBuffer();
  const list = zipList(buf).filter((e) => IMG.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (!list.length) throw new Error('no pictures in the archive');
  return list.map((e) => ({ blob: async () => new Blob([await zipRead(buf, e)], { type: MIME(e.name) }) }));
}
export const cbz = {
  id: 'cbz', extensions: ['cbz'], mimes: ['application/vnd.comicbook+zip', 'application/x-cbz'],
  async mount(ctx) { const items = await cbzItems(ctx.blob); return mountPics({ ...ctx, items, ratio: await firstRatio(await items[0].blob()) }); },
  async cover(blob) { const items = await cbzItems(blob); return { blob: await coverOf(await items[0].blob()), pages: items.length }; },
};
export const image = {
  id: 'image', scan: false, // single pictures are opened by hand; a gallery folder must not flood the library
  extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'], mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
  async mount(ctx) { return mountPics({ ...ctx, items: [{ blob: async () => ctx.blob }], ratio: await firstRatio(ctx.blob) }); },
  async cover(blob) { return { blob: await coverOf(blob), pages: 1 }; },
};
