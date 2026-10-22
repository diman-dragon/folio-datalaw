// Character offsets inside a block (text nodes in order) and ranges over them; used to split a block between pages.
const rg = document.createRange(); // one shared range: probing a position must be cheap
export function textMap(block) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let total = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) { nodes.push({ node: n, start: total }); total += n.data.length; }
  return { nodes, total };
}
function point(map, off) {
  for (let i = map.nodes.length - 1; i >= 0; i--) if (off >= map.nodes[i].start) return [map.nodes[i].node, Math.min(off - map.nodes[i].start, map.nodes[i].node.data.length)];
  return [map.nodes[0].node, 0];
}
export function rangeOf(map, s, e) {
  const r = document.createRange();
  r.setStart(...point(map, s));
  r.setEnd(...point(map, e));
  return r;
}
// Left edge of the first visible rect of the char at off (skips collapsed white space).
export function leftAt(map, off) {
  for (let o = off; o < Math.min(map.total, off + 8); o++) {
    rg.setStart(...point(map, o));
    rg.setEnd(...point(map, o + 1));
    const r = rg.getBoundingClientRect();
    if (r.width || r.height) return r.left;
  }
  return null;
}
