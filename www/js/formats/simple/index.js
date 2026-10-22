// Simple text formats: TXT, Markdown, HTML. Each is a loader for the shared reflow engine.
import { reflowFormat } from '../reflow/format.js';
import { htmlBlocks } from '../reflow/html-blocks.js';
import { decodeText } from './decode.js';
import { txtBlocks } from './txt.js';
import { mdBlocks } from './md.js';
const text = async (blob) => decodeText(await blob.arrayBuffer());
export const txt = reflowFormat({ id: 'txt', extensions: ['txt', 'text'], mimes: ['text/plain'], load: async (b) => txtBlocks(await text(b)) });
export const md = reflowFormat({ id: 'md', extensions: ['md', 'markdown'], mimes: ['text/markdown', 'text/x-markdown'], load: async (b) => mdBlocks(await text(b)) });
export const html = reflowFormat({
  id: 'html', extensions: ['html', 'htm', 'xhtml'], mimes: ['text/html', 'application/xhtml+xml'],
  async load(blob) {
    const doc = new DOMParser().parseFromString(await text(blob), 'text/html');
    return { ...htmlBlocks(doc.body), title: doc.title };
  },
});
