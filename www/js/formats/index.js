// The ONE place where format modules are plugged in. Add a module = one import + one register.
import { register } from './registry.js';
import { pdf } from './pdf/index.js';
register(pdf);
