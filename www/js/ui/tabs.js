// Bottom tab bar: shows one screen at a time; Back on a non-home tab returns Home, on Home exits.
import { setBackFallback } from './back.js';
import { plugin } from '../core/platform.js';
const screens = [...document.querySelectorAll('.screen')];
const btns = [...document.querySelectorAll('#tabbar button')];
let current = 'home';
export function goTo(name) {
  current = name;
  screens.forEach((s) => { s.hidden = s.dataset.screen !== name; });
  btns.forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
}
btns.forEach((b) => b.addEventListener('click', () => goTo(b.dataset.tab)));
setBackFallback(() => (current !== 'home' ? goTo('home') : plugin('App')?.exitApp()));
goTo('home');
