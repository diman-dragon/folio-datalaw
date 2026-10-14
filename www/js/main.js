// Entry point: wires core services, format modules, screens and launch intents.
import { applyTheme } from './core/theme.js';
import { applyLang, t } from './core/i18n.js';
import './formats/index.js';
import './ui/tabs.js';
import './ui/settings-screen.js';
import './ui/home-screen.js';
import './ui/viewer-night.js';
import { toast } from './ui/toast.js';
import { openFile } from './app/open-file.js';
import { watchIntents } from './io/launch-intent.js';
applyTheme();
applyLang();
watchIntents(openFile, () => toast(t('home.pickFail')));
