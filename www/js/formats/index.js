// The ONE place where format modules are plugged in. Add a module = one import + one register.
import { register } from './registry.js';
import { pdf } from './pdf/index.js';
import { fb2 } from './fb2/index.js';
import { txt, md, html } from './simple/index.js';
import { epub } from './epub/index.js';
import { docx } from './docx/index.js';
import { cbz, image } from './pics/index.js';
register(pdf);
[fb2, epub, docx, txt, md, html, cbz, image].forEach(register);
