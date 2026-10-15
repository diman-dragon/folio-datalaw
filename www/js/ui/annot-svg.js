// SVG nodes for annotation items (page units: x 0..1, y 0..R). Vector, so they stay crisp at any zoom and cost no bitmap memory.
const NS = 'http://www.w3.org/2000/svg';
export const HL = 0.4;
const nodes = new WeakMap();
export const nodeOf = (item) => nodes.get(item);
export const register = (item, node) => nodes.set(item, node);
export const layerOf = (item) => (item.k === 'hl' || item.k === 'th' ? 'mark' : 'ink');
const f = (v) => +v.toFixed(4);
export function pathD(pts, R) {
  const [x0, y0] = pts[0];
  let d = `M${x0} ${f(y0 * R)}`;
  if (pts.length === 1) return `${d}L${f(x0 + 0.0001)} ${f(y0 * R)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [nx, ny] = pts[i + 1];
    d += `Q${x} ${f(y * R)} ${f((x + nx) / 2)} ${f(((y + ny) / 2) * R)}`;
  }
  const l = pts.at(-1);
  return `${d}L${l[0]} ${f(l[1] * R)}`;
}
export function svgNode(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}
export function buildNode(item, R) {
  let n;
  if (item.k === 'pen' || item.k === 'hl') {
    n = svgNode('path', { d: pathD(item.p, R), fill: 'none', stroke: item.c, 'stroke-width': item.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(item.k === 'hl' ? { 'stroke-opacity': HL } : {}) });
  } else if (item.k === 'th') {
    n = svgNode('path', { d: item.r.map(([x, y, w, h]) => `M${f(x)} ${f(y * R)}h${f(w)}v${f(h * R)}h${f(-w)}z`).join(''), fill: item.c, 'fill-opacity': HL });
  } else {
    const lw = Math.max(0.003, item.r[0][3] * R * 0.08);
    n = svgNode('path', { d: item.r.map(([x, y, w, h]) => `M${f(x)} ${f((y + h) * R - lw * 1.3)}h${f(w)}`).join(''), fill: 'none', stroke: item.c, 'stroke-width': f(lw), 'stroke-linecap': 'round' });
  }
  nodes.set(item, n);
  return n;
}
