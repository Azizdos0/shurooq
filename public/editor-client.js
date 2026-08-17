// Shurooq editor — client logic. Talks only to our own /api routes
// (never to Supabase directly), so no keys ever reach the browser.

const data = JSON.parse(document.getElementById('editor-data').textContent);
const SECTIONS = new Map(data.sections.map((s) => [s.id, s]));

const el = {
  issue: document.getElementById('issue-select'),
  section: document.getElementById('section-select'),
  title: document.getElementById('title-input'),
  body: document.getElementById('body-input'),
  sourcesList: document.getElementById('sources-list'),
  addSource: document.getElementById('add-source'),
  save: document.getElementById('save-btn'),
  ready: document.getElementById('ready-toggle'),
  status: document.getElementById('status-note'),
  // preview nodes
  pvOrdinal: document.querySelector('[data-ordinal]'),
  pvOrnSlot: document.querySelector('[data-orn-slot]'),
  pvTitle: document.querySelector('[data-title]'),
  pvEn: document.querySelector('[data-en]'),
  pvTagline: document.querySelector('[data-tagline]'),
  pvBody: document.querySelector('[data-body]'),
};

let state = { status: 'draft' }; // status of the current piece
let dirty = false;
let saving = false;
let saveTimer = null;

// ---- status line ---------------------------------------------------------
function setStatus(text, cls = '') {
  el.status.textContent = text;
  el.status.className = 'status-note' + (cls ? ' ' + cls : '');
}

function markDirty() {
  dirty = true;
  setStatus('تغييرات غير محفوظة', 'dirty');
  scheduleAutosave();
}

function scheduleAutosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save({ auto: true }), 2500);
}

// ---- preview -------------------------------------------------------------
function renderPreview() {
  const sec = SECTIONS.get(el.section.value);
  if (!sec) return;
  el.pvOrdinal.textContent = sec.ordinal;
  el.pvEn.textContent = sec.english;
  el.pvTagline.textContent = sec.tagline;

  const title = el.title.value.trim();
  el.pvTitle.textContent = title || sec.title;

  // swap in the active section's ornament (cloned from the hidden store)
  const orn = document.querySelector(`.orn-store [data-orn="${sec.id}"]`);
  el.pvOrnSlot.innerHTML = orn ? orn.innerHTML : '';

  // body → paragraphs split on blank lines
  const text = el.body.value;
  el.pvBody.innerHTML = '';
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) {
    const p = document.createElement('p');
    p.className = 'pv-empty';
    p.textContent = 'يظهر النص هنا وأنت تكتب…';
    el.pvBody.appendChild(p);
    return;
  }
  for (const para of paras) {
    const p = document.createElement('p');
    p.textContent = para; // textContent — never inject HTML from input
    el.pvBody.appendChild(p);
  }
}

// ---- source rows ---------------------------------------------------------
function makeSourceRow(src = { note: '', url: '', tag: 'verified' }) {
  const li = document.createElement('li');
  li.className = 'source-row';

  const note = document.createElement('textarea');
  note.placeholder = 'المصدر أو الوصف';
  note.value = src.note || '';
  note.addEventListener('input', markDirty);

  const url = document.createElement('input');
  url.type = 'url';
  url.dir = 'ltr';
  url.placeholder = 'رابط (اختياري)';
  url.value = src.url || '';
  url.addEventListener('input', markDirty);

  const tag = document.createElement('select');
  for (const t of data.tags) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = data.tagLabels[t];
    if (t === src.tag) opt.selected = true;
    tag.appendChild(opt);
  }
  tag.addEventListener('change', markDirty);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'src-remove';
  remove.textContent = '×';
  remove.title = 'حذف المصدر';
  remove.addEventListener('click', () => {
    li.remove();
    markDirty();
  });

  li.append(note, url, tag, remove);
  li._get = () => ({ note: note.value, url: url.value, tag: tag.value });
  return li;
}

function readSources() {
  return [...el.sourcesList.querySelectorAll('.source-row')].map((li) => li._get());
}

function setSources(list) {
  el.sourcesList.innerHTML = '';
  for (const s of list) el.sourcesList.appendChild(makeSourceRow(s));
}

// ---- ready toggle --------------------------------------------------------
function reflectStatus() {
  const ready = state.status === 'ready';
  el.ready.classList.toggle('is-ready', ready);
  el.ready.textContent = ready ? '✓ جاهز — للنشر' : 'وضع «جاهز»';
}

// ---- load / save ---------------------------------------------------------
async function loadIssues() {
  try {
    const res = await fetch('/api/issues');
    const j = await res.json();
    if (j.error) throw new Error(j.error);
    el.issue.innerHTML = '';
    for (const it of j.issues) {
      const opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = it.title || `العدد ${it.number ?? ''}`;
      el.issue.appendChild(opt);
    }
  } catch (e) {
    setStatus('تعذّر تحميل الأعداد: ' + e.message, 'dirty');
  }
}

async function loadPiece() {
  if (!el.issue.value) return;
  setStatus('يُحمّل…');
  try {
    const url = `/api/piece?issueId=${encodeURIComponent(el.issue.value)}&section=${encodeURIComponent(el.section.value)}`;
    const res = await fetch(url);
    const j = await res.json();
    if (j.error) throw new Error(j.error);
    el.title.value = j.piece?.title || '';
    el.body.value = j.piece?.body || '';
    state.status = j.piece?.status || 'draft';
    setSources(j.sources || []);
    reflectStatus();
    renderPreview();
    dirty = false;
    setStatus(j.piece ? 'محفوظ' : 'مسودة جديدة', 'saved');
  } catch (e) {
    renderPreview(); // keep the preview coherent even if the load failed
    setStatus('تعذّر التحميل: ' + e.message, 'dirty');
  }
}

async function save({ auto = false } = {}) {
  if (saving || !el.issue.value) return;
  clearTimeout(saveTimer);
  saving = true;
  if (!auto) setStatus('يحفظ…');
  try {
    const res = await fetch('/api/piece', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issueId: el.issue.value,
        section: el.section.value,
        title: el.title.value,
        body: el.body.value,
        status: state.status,
        sources: readSources(),
      }),
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error);
    dirty = false;
    const t = new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    setStatus(`محفوظ ${t}`, 'saved');
  } catch (e) {
    setStatus('تعذّر الحفظ: ' + e.message, 'dirty');
  } finally {
    saving = false;
  }
}

// ---- wire up -------------------------------------------------------------
el.title.addEventListener('input', () => { renderPreview(); markDirty(); });
el.body.addEventListener('input', () => { renderPreview(); markDirty(); });
el.section.addEventListener('change', async () => {
  renderPreview();            // flip section meta (ordinal/tagline/ornament) instantly
  if (dirty) await save();
  await loadPiece();
});
el.issue.addEventListener('change', async () => { if (dirty) await save(); await loadPiece(); });
el.addSource.addEventListener('click', () => { el.sourcesList.appendChild(makeSourceRow()); markDirty(); });
el.save.addEventListener('click', () => save());
el.ready.addEventListener('click', () => {
  state.status = state.status === 'ready' ? 'draft' : 'ready';
  reflectStatus();
  markDirty();
  save();
});

// save on the way out
window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

(async function init() {
  await loadIssues();
  await loadPiece();
})();
