// DOCX: word/document.xml -> headings, paragraphs with bold / italic / underline runs, list items, tables as rows, pictures.
import { reflowFormat } from '../reflow/format.js';
import { para, heading, run, picture } from '../reflow/blocks.js';
import { zipList, zipRead } from '../shared/zip.js';
const xml = (b) => new DOMParser().parseFromString(new TextDecoder().decode(b), 'application/xml');
const on = (el, sel) => { const x = el.querySelector(sel); return x && x.getAttribute('w:val') !== 'false' && x.getAttribute('w:val') !== '0'; };
async function load(blob) {
  const buf = await blob.arrayBuffer();
  const entries = new Map(zipList(buf).map((e) => [e.name, e]));
  const read = (n) => (entries.has(n) ? zipRead(buf, entries.get(n)) : null);
  const doc = xml(await read('word/document.xml'));
  const rels = new Map([...xml((await read('word/_rels/document.xml.rels')) ?? new Uint8Array()).querySelectorAll('Relationship')].map((r) => [r.getAttribute('Id'), r.getAttribute('Target')]));
  const core = (await read('docProps/core.xml')) ? xml(await read('docProps/core.xml')) : null;
  const urls = [], blocks = [];
  async function image(embed) {
    const target = rels.get(embed);
    const b = target && (await read(`word/${target}`.replace('word//', '')));
    if (!b) return null;
    const url = URL.createObjectURL(new Blob([b]));
    urls.push(url);
    return url;
  }
  for (const el of doc.querySelectorAll('body > p, body > tbl')) {
    if (el.localName === 'tbl') {
      el.querySelectorAll('tr').forEach((tr) => { const t = [...tr.querySelectorAll('tc')].map((c) => c.textContent.trim()).join(' | '); if (t.replace(/[ |]/g, '')) blocks.push(para(t)); });
      continue;
    }
    const style = el.querySelector('pPr > pStyle')?.getAttribute('w:val') ?? '';
    const lvl = /^(?:Heading|Заголовок)\s*(\d)/i.exec(style)?.[1], isTitle = /^(Title|Название)$/i.test(style);
    const p = lvl || isTitle ? heading(isTitle ? 1 : +lvl, '') : para(el.querySelector('pPr > numPr') ? '• ' : '', el.querySelector('pPr > numPr') ? 'in-list' : '');
    let cur = p;
    for (const r of el.querySelectorAll('r')) {
      const f = { b: on(r, 'rPr > b'), i: on(r, 'rPr > i'), u: on(r, 'rPr > u'), strike: on(r, 'rPr > strike'), sup: r.querySelector('rPr > vertAlign')?.getAttribute('w:val') === 'superscript', sub: r.querySelector('rPr > vertAlign')?.getAttribute('w:val') === 'subscript' };
      for (const c of r.children) {
        if (c.localName === 't') cur.append(run(c.textContent, f));
        else if (c.localName === 'tab') cur.append(document.createTextNode('    '));
        else if (c.localName === 'br') cur.append(document.createElement('br'));
        else if (c.localName === 'drawing') {
          const url = await image(c.querySelector('blip')?.getAttribute('r:embed'));
          if (url) { if (cur.textContent.trim()) blocks.push(cur); blocks.push(picture(url)); cur = para(''); }
        }
      }
    }
    if (cur.textContent.trim()) blocks.push(cur);
  }
  return { blocks, ids: new Map(), title: core?.querySelector('title')?.textContent ?? '', author: core?.querySelector('creator')?.textContent ?? '', dispose: () => urls.forEach(URL.revokeObjectURL) };
}
export const docx = reflowFormat({ id: 'docx', extensions: ['docx'], mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], load });
