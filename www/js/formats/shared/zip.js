// Tiny ZIP reader (stored + deflate): list entries, read one. Enough for FB2.zip, EPUB, DOCX and CBZ.
const u16 = (dv, o) => dv.getUint16(o, true);
const u32 = (dv, o) => dv.getUint32(o, true);
async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
export function zipList(buf) {
  const dv = new DataView(buf);
  let end = buf.byteLength - 22;
  while (end >= 0 && u32(dv, end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('not a zip');
  const out = [];
  let p = u32(dv, end + 16);
  for (let n = u16(dv, end + 10); n > 0; n--) {
    if (u32(dv, p) !== 0x02014b50) break;
    const nameLen = u16(dv, p + 28);
    out.push({ method: u16(dv, p + 10), size: u32(dv, p + 20), local: u32(dv, p + 42), name: new TextDecoder().decode(new Uint8Array(buf, p + 46, nameLen)) });
    p += 46 + nameLen + u16(dv, p + 30) + u16(dv, p + 32);
  }
  return out;
}
export async function zipRead(buf, entry) {
  const dv = new DataView(buf);
  const start = entry.local + 30 + u16(dv, entry.local + 26) + u16(dv, entry.local + 28);
  const data = new Uint8Array(buf, start, entry.size);
  return entry.method === 0 ? data : inflate(data);
}
export async function firstEntry(buf, match) {
  const e = zipList(buf).find((x) => match(x.name));
  if (!e) throw new Error('no matching entry');
  return zipRead(buf, e);
}
export const isZip = (buf) => { const h = new Uint8Array(buf, 0, 2); return h[0] === 0x50 && h[1] === 0x4b; };
