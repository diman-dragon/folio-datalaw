// Flattens the rendered FB2 article into leaf blocks (paragraphs, headings, pictures...) that paginate independently.
// A block keeps the look of its containers through "in-<container>" classes; ids map a section / note to its first block.
const CONTAINERS = ['epigraph', 'cite', 'poem', 'stanza', 'annotation', 'notes'];
const NESTED = 'p,div,h1,h2,h3,h4,h5,h6,blockquote,table,section,header';
const isLeaf = (el) => /^(P|H[1-6]|TABLE|IMG)$/.test(el.tagName) || (el.tagName === 'DIV' && !el.querySelector(NESTED));
export function flatten(root) {
  const blocks = [], ids = new Map();
  let pending = [];
  (function walk(el, ctx) {
    for (const c of el.children) {
      const next = [...ctx, ...CONTAINERS.filter((k) => c.classList.contains(k))];
      if (c.id) pending.push(c.id);
      if (isLeaf(c)) {
        const b = c.cloneNode(true);
        next.forEach((k) => b.classList.add(`in-${k}`));
        pending.forEach((id) => ids.set(id, blocks.length));
        pending = [];
        blocks.push(b);
      } else walk(c, next);
    }
  })(root, []);
  return { blocks, ids };
}
