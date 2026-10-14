// "Open with Folio": reads the launch / new-intent URL (content://, file://) into a File.
import { plugin, nativeUrl } from '../core/platform.js';
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
function nameOf(url) {
  const last = decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
  return /\.\w{2,5}$/.test(last) ? last : `Document ${stamp()}.pdf`;
}
async function load(url, onFile) {
  const blob = await (await fetch(nativeUrl(url))).blob();
  onFile(new File([blob], nameOf(url), { type: blob.type || 'application/pdf' }));
}
export async function watchIntents(onFile, onError) {
  const App = plugin('App');
  if (!App) return;
  App.addListener('appUrlOpen', ({ url }) => load(url, onFile).catch(onError));
  const launch = await App.getLaunchUrl();
  if (launch?.url) load(launch.url, onFile).catch(onError);
}
