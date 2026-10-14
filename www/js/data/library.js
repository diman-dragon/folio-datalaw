// Document library: records + bytes stored inside the app (IndexedDB).
import { tx, wait, finish } from './db.js';
export async function listDocs() {
  const t = await tx('meta');
  const all = await wait(t.objectStore('meta').getAll());
  return all.sort((a, b) => b.openedAt - a.openedAt);
}
export async function getDoc(id) {
  const t = await tx(['meta', 'blobs']);
  const [meta, blob] = await Promise.all([wait(t.objectStore('meta').get(id)), wait(t.objectStore('blobs').get(id))]);
  return meta && blob ? { meta, blob } : null;
}
export async function addDoc(file) {
  const existing = (await listDocs()).find((d) => d.name === file.name && d.size === file.size);
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
  const t = await tx(['meta', 'blobs'], 'readwrite');
  t.objectStore('meta').delete(id);
  t.objectStore('blobs').delete(id);
  await finish(t);
}
