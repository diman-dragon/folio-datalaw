// Home screen: document list (open / delete) and the "Open" button.
import { listDocs, removeDoc } from '../data/library.js';
import { openFile, openStored } from '../app/open-file.js';
import { pickFile } from '../io/pick-file.js';
import { icon } from './icon.js';
import { toast } from './toast.js';
import { t } from '../core/i18n.js';
import { on } from '../core/bus.js';
import { fmtSize, fmtDate } from '../core/format.js';
const list = document.getElementById('doc-list');
const empty = document.getElementById('doc-empty');
function row(d) {
  const li = document.createElement('li');
  li.className = 'doc';
  li.dataset.id = d.id;
  li.innerHTML = `<div class="doc-ico">${icon('file')}</div><button class="doc-main"><div class="doc-name"></div><div class="small muted"></div></button><button class="icon-btn doc-del">${icon('trash')}</button>`;
  li.querySelector('.doc-name').textContent = d.name;
  li.querySelector('.small').textContent = `${fmtSize(d.size)} · ${fmtDate(d.openedAt)}`;
  li.querySelector('.doc-del').setAttribute('aria-label', t('home.delete'));
  return li;
}
async function refresh() {
  const docs = await listDocs();
  list.replaceChildren(...docs.map(row));
  empty.hidden = docs.length > 0;
}
list.addEventListener('click', async (e) => {
  const li = e.target.closest('.doc');
  if (!li) return;
  if (e.target.closest('.doc-del')) {
    if (confirm(t('home.deleteQ'))) { await removeDoc(li.dataset.id); refresh(); }
  } else if (e.target.closest('.doc-main')) {
    openStored(li.dataset.id).catch(() => toast(t('home.pickFail')));
  }
});
document.getElementById('open-btn').addEventListener('click', async () => {
  const file = await pickFile();
  if (file) openFile(file).catch(() => toast(t('home.pickFail')));
});
on('libchange', refresh);
on('langchange', refresh);
refresh();
