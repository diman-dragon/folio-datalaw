// FictionBook (FB2, FB2.zip) format: parse, render to HTML, flatten to blocks, then the shared reflow engine.
import { reflowFormat } from '../reflow/format.js';
import { loadBook } from './load.js';
import { createRenderer } from './render.js';
import { flatten } from './flatten.js';
async function load(blob) {
  const book = await loadBook(blob);
  const r = createRenderer(book);
  const { blocks, ids } = flatten(r.render());
  const cover = book.binaries.get(book.coverId);
  const image = cover ? new Blob([Uint8Array.from(atob(cover.b64), (c) => c.charCodeAt(0))], { type: cover.type }) : null;
  return { blocks, ids, title: book.title, author: book.authors.join(', '), image, dispose: r.dispose };
}
export const fb2 = reflowFormat({ id: 'fb2', extensions: ['fb2', 'fb2.zip', 'fbz'], mimes: ['application/x-fictionbook+xml', 'application/fb2', 'application/x-fb2', 'application/fb2+zip'], load });
