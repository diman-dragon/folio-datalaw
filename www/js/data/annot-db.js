// Marks and drawings per document and layout signature: key "<docId>|<signature>", value [[pageIndex, items[]]..].
import { tx, wait, finish } from './db.js';
export async function saveAnnots(id, sig, data) {
  const t = await tx(['annots'], 'readwrite');
  t.objectStore('annots').put(data, `${id}|${sig}`);
  await finish(t);
}
export async function loadAnnots(id, sig) {
  const t = await tx(['annots']);
  return (await wait(t.objectStore('annots').get(`${id}|${sig}`))) ?? [];
}
// Used inside the transaction that deletes a document.
export const dropAnnotsIn = (t, id) => t.objectStore('annots').delete(IDBKeyRange.bound(`${id}|`, `${id}}`));
