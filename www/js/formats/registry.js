// Registry of format modules. Module contract: { id, extensions[], mimes[], mount(ctx) -> handle, cover?(blob, opts) -> {blob, pages} }.
const mods = [];
export const register = (m) => { mods.push(m); };
export function find(name = '', type = '') {
  const ext = name.toLowerCase().split('.').pop();
  return mods.find((m) => m.extensions.includes(ext) || m.mimes.includes(type)) ?? null;
}
export const acceptExts = () => mods.flatMap((m) => m.extensions);
export const acceptList = () => mods.flatMap((m) => [...m.extensions.map((e) => '.' + e), ...m.mimes]).join(',');
