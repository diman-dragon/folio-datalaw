// IndexedDB connection (stores "meta" = records, "blobs" = file bytes) and promise helpers.
let opening;
export function db() {
  opening ??= new Promise((res, rej) => {
    const r = indexedDB.open('folio', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('meta', { keyPath: 'id' });
      r.result.createObjectStore('blobs');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return opening;
}
export const tx = async (stores, mode = 'readonly') => (await db()).transaction(stores, mode);
export const wait = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
export const finish = (t) => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
