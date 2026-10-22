// EPUB: container -> OPF (manifest + spine) -> XHTML chapters -> blocks (shared HTML converter) with pictures from the archive.
import { reflowFormat } from '../reflow/format.js';
import { htmlBlocks } from '../reflow/html-blocks.js';
import { zipList, zipRead } from '../shared/zip.js';
import { decodeText } from '../simple/decode.js';
const abs = (file, src) => { try { return new URL(src, `http://x/${file}`).pathname.slice(1).split('/').map(decodeURIComponent).join('/'); } catch { return src; } };
const IMG = /\.(png|jpe?g|gif|webp|svg)$/i;
async function load(blob) {
  const buf = await blob.arrayBuffer();
  const entries = new Map(zipList(buf).map((e) => [e.name, e]));
  const bytes = async (name) => (entries.has(name) ? zipRead(buf, entries.get(name)) : null);
  const text = async (name) => { const b = await bytes(name); return b ? decodeText(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) : ''; };
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const opfPath = xml(await text('META-INF/container.xml')).querySelector('rootfile')?.getAttribute('full-path');
  if (!opfPath) throw new Error('not an epub');
  const opf = xml(await text(opfPath)), dir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const manifest = new Map([...opf.querySelectorAll('manifest > item')].map((i) => [i.getAttribute('id'), { href: abs(dir, i.getAttribute('href')), type: i.getAttribute('media-type') ?? '', props: i.getAttribute('properties') ?? '' }]));
  const coverId = opf.querySelector('meta[name="cover"]')?.getAttribute('content');
  const coverItem = [...manifest.values()].find((m) => m.props.includes('cover-image')) ?? manifest.get(coverId);
  const urls = new Map(), blocks = [], ids = new Map();
  const imageUrl = async (path) => {
    if (urls.has(path)) return urls.get(path);
    const b = await bytes(path);
    const type = /\.png$/i.test(path) ? 'image/png' : /\.gif$/i.test(path) ? 'image/gif' : /\.svg$/i.test(path) ? 'image/svg+xml' : /\.webp$/i.test(path) ? 'image/webp' : 'image/jpeg';
    const url = b ? URL.createObjectURL(new Blob([b], { type })) : null;
    urls.set(path, url);
    return url;
  };
  for (const ref of opf.querySelectorAll('spine > itemref')) {
    const item = manifest.get(ref.getAttribute('idref'));
    if (!item || !/x?html/.test(item.type)) continue;
    const src = await text(item.href);
    let doc = new DOMParser().parseFromString(src, 'application/xhtml+xml');
    if (doc.querySelector('parsererror')) doc = new DOMParser().parseFromString(src, 'text/html');
    const body = doc.body ?? doc.querySelector('body');
    if (!body) continue;
    for (const im of body.querySelectorAll('img')) { const p = abs(item.href, im.getAttribute('src') ?? ''); if (IMG.test(p)) await imageUrl(p); }
    const part = htmlBlocks(body, { file: item.href, img: (s) => urls.get(abs(item.href, s)) ?? null });
    if (!part.blocks.length) continue;
    part.blocks[0].classList.add('chapter-start');
    ids.set(item.href, blocks.length);
    part.ids.forEach((v, k) => ids.set(k, v + blocks.length));
    blocks.push(...part.blocks);
  }
  const image = coverItem && IMG.test(coverItem.href) ? new Blob([await bytes(coverItem.href)]) : null;
  return { blocks, ids, title: opf.querySelector('metadata > title')?.textContent.trim() ?? '', author: opf.querySelector('metadata > creator')?.textContent.trim() ?? '', image, dispose: () => urls.forEach((u) => u && URL.revokeObjectURL(u)) };
}
export const epub = reflowFormat({ id: 'epub', extensions: ['epub'], mimes: ['application/epub+zip'], load });
