// "Open with Folio": reads the launch / new-intent URL (content://, file://) into a File.
import { plugin, nativeUrl } from '../core/platform.js';
import { isOpenable } from '../formats/registry.js';
import { sniffExt } from './sniff.js';
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
async function nameOf(url, blob) {
  const last = decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
  return isOpenable(last) ? last : `Document ${stamp()}.${await sniffExt(blob)}`;
}
async function load(url, onFile) {
  const blob = await (await fetch(nativeUrl(url))).blob();
  onFile(new File([blob], await nameOf(url, blob), { type: blob.type || '' }));
}
export async function watchIntents(onFile, onError) {
  const App = plugin('App');
  if (!App) return;
  App.addListener('appUrlOpen', ({ url }) => load(url, onFile).catch(onError));
  const launch = await App.getLaunchUrl();
  if (launch?.url) load(launch.url, onFile).catch(onError);
}
