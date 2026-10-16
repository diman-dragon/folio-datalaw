// Stylus mode: once a pen is seen (or chosen) only the pen draws, fingers navigate and a resting palm never ruins a stroke.
import { getPref, setPref } from '../core/prefs.js';
import { emit } from '../core/bus.js';
let only = getPref('stylus', false), chosen = getPref('stylusSet', false);
export const stylusOnly = () => only;
export function setStylusOnly(v, byUser = true) {
  only = v;
  setPref('stylus', v);
  if (byUser) { chosen = true; setPref('stylusSet', true); }
  emit('stylus', v);
}
// Called on any pen event: switches stylus mode on by itself unless the reader made the choice.
export function penSeen() { if (!only && !chosen) setStylusOnly(true, false); }
