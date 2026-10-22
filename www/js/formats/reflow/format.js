// Builds a format descriptor for a reflowable format from one loader: load(blob, name) -> { blocks, ids, title, author, image }.
import { mountReflow } from './mount.js';
import { coverBlob } from './cover.js';
const CHARS_PER_PAGE = 1800;
const length = (blocks) => blocks.reduce((n, b) => n + b.textContent.length, 0);
export function reflowFormat({ id, extensions, mimes, load, tag = id }) {
  return {
    id, extensions, mimes,
    async mount(ctx) {
      const book = await load(ctx.blob, ctx.name);
      return mountReflow({ ...ctx, ...book, id, pagesHint: Math.max(1, Math.ceil(length(book.blocks) / CHARS_PER_PAGE)) });
    },
    async cover(blob, { name = '' } = {}) {
      const book = await load(blob, name);
      book.dispose?.();
      return { blob: await coverBlob({ title: book.title || name.replace(/\.[^.]+$/, ''), author: book.author ?? '', tag, image: book.image }), pages: Math.max(1, Math.ceil(length(book.blocks) / CHARS_PER_PAGE)) };
    },
  };
}
