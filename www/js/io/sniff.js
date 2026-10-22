// Format of a file without a usable name (content:// links): decided from the first bytes (and the zip entry names).
import { zipList } from '../formats/shared/zip.js';
export async function sniffExt(blob) {
  const buf = await blob.slice(0, 1 << 20).arrayBuffer(), head = new Uint8Array(buf, 0, 16);
  const ascii = new TextDecoder('latin1').decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 512)));
  if (ascii.startsWith('%PDF')) return 'pdf';
  if (head[0] === 0x89 && head[1] === 0x50) return 'png';
  if (head[0] === 0xff && head[1] === 0xd8) return 'jpg';
  if (ascii.startsWith('GIF8')) return 'gif';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'webp';
  if (head[0] === 0x50 && head[1] === 0x4b) {
    try {
      const names = zipList(await blob.arrayBuffer()).map((e) => e.name);
      if (names.includes('META-INF/container.xml')) return 'epub';
      if (names.includes('word/document.xml')) return 'docx';
      if (names.some((n) => /\.fb2$/i.test(n))) return 'fb2.zip';
      if (names.some((n) => /\.(jpe?g|png|webp)$/i.test(n))) return 'cbz';
    } catch { /* not a readable zip */ }
    return 'zip';
  }
  if (/<FictionBook/i.test(ascii)) return 'fb2';
  if (/^\s*(<!doctype html|<html)/i.test(ascii)) return 'html';
  return /[\x00-\x08]/.test(ascii) ? 'pdf' : 'txt';
}
