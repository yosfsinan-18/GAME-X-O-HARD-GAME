/* SONIC VIP — ADMIN PANEL (server-backed) */

const els = {
  loginView: document.getElementById('loginView'),
  dashView: document.getElementById('dashView'),
  loginForm: document.getElementById('loginForm'),
  pw: document.getElementById('pw'),
  loginHint: document.getElementById('loginHint'),
  logoutBtn: document.getElementById('logoutBtn'),

  addBtn: document.getElementById('addBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  changePwBtn: document.getElementById('changePwBtn'),

  statDl: document.getElementById('stat_downloads'),
  statUsers: document.getElementById('stat_users'),
  statRating: document.getElementById('stat_rating'),
  statLast: document.getElementById('stat_lastUpdate'),
  saveStatsBtn: document.getElementById('saveStatsBtn'),

  rlBody: document.getElementById('rlBody'),
  rlEmpty: document.getElementById('rlEmpty'),
  adminSearch: document.getElementById('adminSearch'),

  filesBody: document.getElementById('filesBody'),
  filesEmpty: document.getElementById('filesEmpty'),
  bulkUpload: document.getElementById('bulkUpload'),
  bulkProgress: document.getElementById('bulkProgress'),

  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalClose: document.getElementById('modalClose'),
  cancelBtn: document.getElementById('cancelBtn'),
  editForm: document.getElementById('editForm'),
  uploadPick: document.getElementById('uploadPick'),
  fUpload: document.getElementById('f_upload'),
  uploadInfo: document.getElementById('uploadInfo'),
  uploadProgress: document.getElementById('uploadProgress'),
  f: {
    id: document.getElementById('f_id'),
    title: document.getElementById('f_title'),
    subtitle: document.getElementById('f_subtitle'),
    region: document.getElementById('f_region'),
    version: document.getElementById('f_version'),
    size: document.getElementById('f_size'),
    date: document.getElementById('f_date'),
    ios: document.getElementById('f_ios'),
    file: document.getElementById('f_file'),
    description: document.getElementById('f_description'),
    tags: document.getElementById('f_tags'),
    featured: document.getElementById('f_featured')
  },

  pwModal: document.getElementById('pwModal'),
  pwClose: document.getElementById('pwClose'),
  pwCancel: document.getElementById('pwCancel'),
  pwForm: document.getElementById('pwForm'),
  pwNew: document.getElementById('pw_new'),
  pwConfirm: document.getElementById('pw_confirm'),
  pwHint: document.getElementById('pwHint'),

  toast: document.getElementById('toast')
};

let state = {
  data: { stats: {}, releases: [] },
  files: [],
  query: ''
};

/* ---------- API ---------- */
async function api(method, url, body, isForm) {
  const opts = { method, credentials: 'same-origin' };
  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(url, opts);
  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error((json && json.error) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/* ---------- AUTH ---------- */
async function checkAuth() {
  try {
    const r = await api('GET', '/api/auth/check');
    return !!r.authenticated;
  } catch { return false; }
}

async function login(pw) {
  await api('POST', '/api/auth/login', { password: pw });
}

async function logout() {
  try { await api('POST', '/api/auth/logout'); } catch {}
  showLogin();
}

function showLogin() {
  els.loginView.hidden = false;
  els.dashView.hidden = true;
  els.pw.value = '';
  els.pw.focus();
}

async function showDash() {
  els.loginView.hidden = true;
  els.dashView.hidden = false;
  await refreshAll();
}

/* ---------- DATA ---------- */
async function refreshAll() {
  await Promise.all([refreshReleases(), refreshFiles()]);
}

async function refreshReleases() {
  state.data = await api('GET', '/api/releases');
  if (!state.data.stats) state.data.stats = {};
  if (!state.data.releases) state.data.releases = [];
  renderStats();
  renderReleases();
}

async function refreshFiles() {
  try {
    const r = await api('GET', '/api/files');
    state.files = r.files || [];
  } catch { state.files = []; }
  renderFiles();
}

/* ---------- RENDER ---------- */
function renderStats() {
  const s = state.data.stats || {};
  els.statDl.value = s.downloads || '';
  els.statUsers.value = s.users || '';
  els.statRating.value = s.rating || '';
  els.statLast.value = s.lastUpdate || '';
}

function renderReleases() {
  const q = state.query.toLowerCase();
  const list = (state.data.releases || []).filter(r => {
    if (!q) return true;
    return `${r.title} ${r.subtitle || ''} ${r.region} ${r.version}`.toLowerCase().includes(q);
  });
  els.rlBody.innerHTML = '';
  els.rlEmpty.hidden = list.length > 0;
  list.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="name">${esc(r.title)}<small>${esc(r.subtitle || '')}</small></div></td>
      <td><span class="badge">${esc(r.region)}</span></td>
      <td>v${esc(r.version || '')}</td>
      <td>${esc(r.size || '')}</td>
      <td>${esc(r.date || '—')}</td>
      <td>${r.featured ? '<span class="star">★</span>' : ''}</td>
      <td>
        <div class="actions">
          <button class="icon-btn" title="گۆڕین" data-act="edit" data-id="${esc(r.id)}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75l11-11-3.75-3.75-11 11zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="icon-btn danger" title="سڕینەوە" data-act="delete" data-id="${esc(r.id)}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 7v13a2 2 0 002 2h8a2 2 0 002-2V7H6zm3-4h6l1 2h4v2H4V5h4z"/></svg>
          </button>
        </div>
      </td>
    `;
    els.rlBody.appendChild(tr);
  });
}

function renderFiles() {
  els.filesBody.innerHTML = '';
  els.filesEmpty.hidden = state.files.length > 0;
  state.files.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="name">${esc(f.name)}<small>${esc(f.path)}</small></div></td>
      <td>${humanSize(f.size)}</td>
      <td>${new Date(f.mtime).toLocaleDateString('ar')}</td>
      <td>
        <div class="actions">
          <a class="icon-btn" title="دابەزاندن" href="/${esc(f.path)}" download>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>
          </a>
          <button class="icon-btn" title="بەکارهێنان لە وەشانێکدا" data-fact="use" data-name="${esc(f.path)}" data-size="${humanSize(f.size)}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button class="icon-btn danger" title="سڕینەوە" data-fact="delete" data-name="${esc(f.name)}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 7v13a2 2 0 002 2h8a2 2 0 002-2V7H6zm3-4h6l1 2h4v2H4V5h4z"/></svg>
          </button>
        </div>
      </td>
    `;
    els.filesBody.appendChild(tr);
  });
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function humanSize(b) {
  if (!b && b !== 0) return '—';
  if (b > 1024 * 1024 * 1024) return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
  if (b > 1024) return (b / 1024).toFixed(1) + ' KB';
  return b + ' B';
}

/* ---------- UPLOAD ---------- */
function uploadFile(file, progressEls) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);
    xhr.open('POST', '/api/upload');
    xhr.withCredentials = true;
    if (progressEls) {
      progressEls.box.hidden = false;
      progressEls.bar.style.width = '0%';
      progressEls.pct.textContent = '0%';
    }
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || !progressEls) return;
      const p = Math.round((e.loaded / e.total) * 100);
      progressEls.bar.style.width = p + '%';
      progressEls.pct.textContent = p + '%';
    };
    xhr.onload = () => {
      if (progressEls) setTimeout(() => { progressEls.box.hidden = true; }, 600);
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new Error(json.error || `HTTP ${xhr.status}`));
      } catch (e) {
        reject(new Error('پارسکردنی وەڵام شکستی هێنا'));
      }
    };
    xhr.onerror = () => reject(new Error('پەیوەندی شکستی هێنا'));
    xhr.send(fd);
  });
}

/* ---------- MODAL ---------- */
function openModal(release) {
  els.modal.hidden = false;
  resetUploadInfo();
  if (release) {
    els.modalTitle.textContent = 'گۆڕینی وەشان';
    els.f.id.value = release.id;
    els.f.title.value = release.title || '';
    els.f.subtitle.value = release.subtitle || '';
    els.f.region.value = release.region || 'KR';
    els.f.version.value = release.version || '';
    els.f.size.value = release.size || '';
    els.f.date.value = release.date || '';
    els.f.ios.value = release.ios || 'iOS 13+';
    els.f.file.value = release.file || '';
    els.f.description.value = release.description || '';
    els.f.tags.value = (release.tags || []).join(', ');
    els.f.featured.checked = !!release.featured;
  } else {
    els.modalTitle.textContent = 'زیادکردنی وەشانێکی نوێ';
    els.editForm.reset();
    els.f.id.value = '';
    els.f.ios.value = 'iOS 13+';
    els.f.date.value = new Date().toISOString().slice(0, 10);
  }
  setTimeout(() => els.f.title.focus(), 50);
}

function closeModal() { els.modal.hidden = true; resetUploadInfo(); }

function resetUploadInfo() {
  els.uploadInfo.textContent = 'هیچ فایلێک هەڵنەبژێردراوە';
  els.uploadInfo.className = 'upload-info';
  els.uploadProgress.hidden = true;
  if (els.fUpload) els.fUpload.value = '';
}

async function submitForm(e) {
  e.preventDefault();
  const tags = els.f.tags.value.split(',').map(t => t.trim()).filter(Boolean);
  const item = {
    id: els.f.id.value || undefined,
    title: els.f.title.value.trim(),
    subtitle: els.f.subtitle.value.trim(),
    region: els.f.region.value,
    version: els.f.version.value.trim(),
    size: els.f.size.value.trim(),
    date: els.f.date.value || '',
    ios: els.f.ios.value.trim(),
    file: els.f.file.value.trim(),
    description: els.f.description.value.trim(),
    tags,
    featured: els.f.featured.checked
  };
  try {
    await api('POST', '/api/releases', item);
    await refreshReleases();
    closeModal();
    toast(item.id ? 'وەشانەکە نوێکرایەوە ✓' : 'وەشانێکی نوێ زیادکرا ✓');
  } catch (e) {
    toast('هەڵە: ' + e.message, true);
  }
}

async function deleteRelease(id) {
  const r = (state.data.releases || []).find(x => x.id === id);
  if (!r) return;
  if (!confirm(`دڵنیایت لە سڕینەوەی «${r.title} v${r.version}»؟ (فایلی پەیوەندیداریشی دەسڕێتەوە)`)) return;
  try {
    await api('DELETE', '/api/releases/' + encodeURIComponent(id));
    await refreshAll();
    toast('سڕایەوە ✓');
  } catch (e) {
    toast('هەڵە: ' + e.message, true);
  }
}

async function deleteFile(name) {
  if (!confirm(`دڵنیایت لە سڕینەوەی فایلی «${name}»؟`)) return;
  try {
    await api('DELETE', '/api/files/' + encodeURIComponent(name));
    await refreshFiles();
    toast('فایلەکە سڕایەوە ✓');
  } catch (e) {
    toast('هەڵە: ' + e.message, true);
  }
}

/* ---------- IMPORT/EXPORT ---------- */
function exportJson() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sonic-vip-data-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  toast('داگیرا ✓');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj || !Array.isArray(obj.releases)) throw new Error('فۆڕماتی نادروست');
      if (!confirm('ئەمە هەموو زانیاری ئێستات دەگۆڕێت. درێژە بدەم؟')) return;
      const stats = obj.stats || {};
      await api('PUT', '/api/stats', stats);
      const existing = (await api('GET', '/api/releases')).releases || [];
      for (const r of existing) {
        try { await api('DELETE', '/api/releases/' + encodeURIComponent(r.id)); } catch {}
      }
      for (const item of obj.releases) {
        try { await api('POST', '/api/releases', item); } catch {}
      }
      await refreshAll();
      toast('فایلەکە هاتەوە ✓');
    } catch (err) {
      toast('فایلی JSON نادروستە', true);
    }
  };
  reader.readAsText(file);
}

/* ---------- STATS ---------- */
async function saveStats() {
  try {
    await api('PUT', '/api/stats', {
      downloads: els.statDl.value.trim(),
      users: els.statUsers.value.trim(),
      rating: els.statRating.value.trim(),
      lastUpdate: els.statLast.value || ''
    });
    toast('ستاتیستیک پاشەکەوت کرا ✓');
  } catch (e) {
    toast('هەڵە: ' + e.message, true);
  }
}

/* ---------- PASSWORD ---------- */
function openPwModal() { els.pwModal.hidden = false; els.pwNew.value=''; els.pwConfirm.value=''; els.pwHint.textContent=''; els.pwHint.className='hint'; els.pwNew.focus(); }
function closePwModal() { els.pwModal.hidden = true; }

async function changePassword(e) {
  e.preventDefault();
  const a = els.pwNew.value, b = els.pwConfirm.value;
  if (a.length < 4) { els.pwHint.textContent = 'دەبێت لانیکەم 4 پیت بێت.'; els.pwHint.className = 'hint error'; return; }
  if (a !== b) { els.pwHint.textContent = 'وشە نهێنیەکان وەک یەک نین.'; els.pwHint.className = 'hint error'; return; }
  try {
    await api('POST', '/api/auth/password', { password: a });
    els.pwHint.textContent = 'گۆڕدرا، تکایە لۆگین بکەرەوە ✓';
    els.pwHint.className = 'hint ok';
    setTimeout(() => { closePwModal(); toast('وشەی نهێنی گۆڕدرا، تکایە لۆگین بکەرەوە'); showLogin(); }, 1000);
  } catch (e) {
    els.pwHint.textContent = 'هەڵە: ' + e.message;
    els.pwHint.className = 'hint error';
  }
}

/* ---------- TOAST ---------- */
function toast(msg, isError) {
  els.toast.textContent = msg;
  els.toast.style.borderColor = isError ? 'rgba(255,100,120,.6)' : '';
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

/* ---------- EVENTS ---------- */
const pwToggle = document.getElementById('pwToggle');
if (pwToggle) {
  pwToggle.addEventListener('click', () => {
    els.pw.type = els.pw.type === 'password' ? 'text' : 'password';
    els.pw.focus();
  });
}

els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const val = els.pw.value;
  try {
    await login(val);
    els.loginHint.innerHTML = '';
    showDash();
  } catch (err) {
    els.loginHint.innerHTML = 'وشەی نهێنی هەڵەیە. وشەی نهێنی بنەڕەتی: <code>sonic2026</code>';
    els.loginHint.className = 'hint error';
    els.pw.value = '';
    els.pw.focus();
  }
});

els.logoutBtn.addEventListener('click', logout);
els.addBtn.addEventListener('click', () => openModal(null));
els.modalClose.addEventListener('click', closeModal);
els.cancelBtn.addEventListener('click', closeModal);
els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
els.editForm.addEventListener('submit', submitForm);

els.exportBtn.addEventListener('click', exportJson);
els.importFile.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) importJson(f);
  e.target.value = '';
});

els.saveStatsBtn.addEventListener('click', saveStats);

els.rlBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.act === 'edit') {
    const r = state.data.releases.find(x => x.id === id);
    if (r) openModal(r);
  } else if (btn.dataset.act === 'delete') {
    deleteRelease(id);
  }
});

els.filesBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-fact]');
  if (!btn) return;
  const act = btn.dataset.fact;
  if (act === 'delete') deleteFile(btn.dataset.name);
  else if (act === 'use') {
    openModal(null);
    els.f.file.value = btn.dataset.name;
    els.f.size.value = btn.dataset.size;
    toast('لینکی فایل پڕکرایەوە لە فۆڕم');
  }
});

els.adminSearch.addEventListener('input', (e) => {
  state.query = e.target.value.trim();
  renderReleases();
});

els.changePwBtn.addEventListener('click', openPwModal);
els.pwClose.addEventListener('click', closePwModal);
els.pwCancel.addEventListener('click', closePwModal);
els.pwModal.addEventListener('click', (e) => { if (e.target === els.pwModal) closePwModal(); });
els.pwForm.addEventListener('submit', changePassword);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!els.modal.hidden) closeModal();
    if (!els.pwModal.hidden) closePwModal();
  }
});

/* Upload from inside the form */
els.uploadPick.addEventListener('click', () => els.fUpload.click());
els.fUpload.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  els.uploadInfo.textContent = `بارکردنی ${f.name}…`;
  els.uploadInfo.className = 'upload-info';
  try {
    const r = await uploadFile(f, {
      box: els.uploadProgress,
      bar: els.uploadProgress.querySelector('.bar i'),
      pct: els.uploadProgress.querySelector('.pct')
    });
    els.f.file.value = r.file;
    els.f.size.value = r.sizeStr;
    els.uploadInfo.textContent = `✓ بارکرا: ${r.originalName} (${r.sizeStr})`;
    els.uploadInfo.className = 'upload-info ok';
    refreshFiles();
  } catch (err) {
    els.uploadInfo.textContent = 'هەڵە: ' + err.message;
    els.uploadInfo.className = 'upload-info err';
  }
  e.target.value = '';
});

/* Bulk upload from files panel */
els.bulkUpload.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    await uploadFile(f, {
      box: els.bulkProgress,
      bar: els.bulkProgress.querySelector('.bar i'),
      pct: els.bulkProgress.querySelector('.pct')
    });
    toast('فایلەکە بارکرا ✓');
    refreshFiles();
  } catch (err) {
    toast('هەڵە: ' + err.message, true);
  }
  e.target.value = '';
});

/* ---------- INIT ---------- */
(async () => {
  if (await checkAuth()) showDash();
  else showLogin();
})();
