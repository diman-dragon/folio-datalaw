// Plain text -> blocks: blank lines separate paragraphs; hard-wrapped lines are joined; short "Chapter..." lines become headings.
import { para, heading } from '../reflow/blocks.js';
const HEAD = /^(глава|часть|раздел|книга|пролог|эпилог|chapter|part|prologue|epilogue|capitolo|parte|poglavlje|glava)\b/i;
export function txtBlocks(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''));
  const filled = lines.filter((l) => l.trim());
  const wrapped = filled.length > 5 && lines.length > filled.length && filled.reduce((n, l) => n + l.length, 0) / filled.length < 85;
  const blocks = [];
  let buf = [];
  const flush = () => { if (buf.length) { blocks.push(para(buf.join(' ').replace(/\s+/g, ' '))); buf = []; } };
  for (const l of lines) {
    const t = l.trim();
    if (!t) { flush(); continue; }
    if (t.length < 70 && HEAD.test(t)) { flush(); blocks.push(heading(1, t)); continue; }
    if (wrapped) buf.push(t); else blocks.push(para(t));
  }
  flush();
  return { blocks, ids: new Map() };
}
