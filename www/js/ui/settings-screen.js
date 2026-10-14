// Settings screen: segmented switches (theme, language, night mode) and the version row.
import { getTheme, setTheme } from '../core/theme.js';
import { getLang, setLang } from '../core/i18n.js';
import { getNight, setNight } from '../core/night.js';
import { VERSION } from '../core/version.js';
const get = { theme: getTheme, lang: getLang, night: getNight };
const set = { theme: setTheme, lang: setLang, night: setNight };
const segs = [...document.querySelectorAll('.seg[data-setting]')];
const paint = () => segs.forEach((s) => [...s.children].forEach((b) => b.classList.toggle('on', b.dataset.value === get[s.dataset.setting]())));
segs.forEach((s) => s.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  set[s.dataset.setting](b.dataset.value);
  paint();
}));
document.getElementById('app-version').textContent = VERSION;
paint();
