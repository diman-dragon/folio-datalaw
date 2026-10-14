// Document library: records (+ bytes for files opened with "Open"; folder files are only referenced by uri).
import { tx, wait, finish } from './db.js';
export async function listDocs() {
  const t = await tx('meta');
  const all = await wait(t.objectStore('meta').getAll());
  return all.sort((a, b) => (b.openedAt - a.openedAt) || a.name.localeCompare(b.name));
}
export async function getMeta(id) {
  const t = await tx('meta');
  return (await wait(t.objectStore('meta').get(id))) ?? null;
}
export async function getBlob(id) {
  const t = await tx('blobs');
  return (await wait(t.objectStore('blobs').get(id))) ?? null;
}
export async function addDoc(file) {
  const existing = (await listDocs()).find((d) => d.src !== 'folder' && d.name === file.name && d.size === file.size);
  if (existing) return updateDoc(existing.id, { openedAt: Date.now() });
  const now = Date.now();
  const meta = { id: crypto.randomUUID(), name: file.name, size: file.size, addedAt: now, openedAt: now, lastPage: 1 };
  const t = await tx(['meta', 'blobs'], 'readwrite');
  t.objectStore('meta').put(meta);
  t.objectStore('blobs').put(file, meta.id);
  await finish(t);
  return meta;
}
export async function updateDoc(id, patch) {
  const t = await tx('meta', 'readwrite');
  const store = t.objectStore('meta');
  const meta = { ...(await wait(store.get(id))), ...patch };
  store.put(meta);
  await finish(t);
  return meta;
}
export async function removeDoc(id) {
  const t = await tx(['meta', 'blobs', 'covers'], 'readwrite');
  t.objectStore('meta').delete(id);
  t.objectStore('blobs').delete(id);
  t.objectStore('covers').delete(id);
  await finish(t);
}
