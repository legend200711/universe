/**
 * ADMIN DASHBOARD — Owner Control Center
 * Handles login, authentication guard, full CRUD for all content types.
 * Security enforced server-side via Firestore Rules.
 */

import {
  login,
  logout,
  onAuthChange,
  getAllWebsites,
  saveWebsite,
  publishWebsite,
  deleteWebsite,
  getAllProjects,
  saveProject,
  publishProject,
  deleteProject,
  getAllAnnouncements,
  saveAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
  getSettings,
  saveSettings,
} from '../js/firebase-service.js';

// ── Pages ─────────────────────────────────────────────────────────
const loginPage  = document.getElementById('admin-login-page');
const adminApp   = document.getElementById('admin-app');

// ── Toast system ──────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── HTML escape ────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── URL validation ────────────────────────────────────────────────
function validateUrl(url) {
  if (!url) return true; // optional
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch { return false; }
}

// ── Login flow ────────────────────────────────────────────────────
const loginForm   = document.getElementById('login-form');
const loginEmail  = document.getElementById('login-email');
const loginPass   = document.getElementById('login-password');
const loginBtn    = document.getElementById('login-btn');
const loginError  = document.getElementById('login-error');

loginForm && loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const pass  = loginPass.value;
  loginBtn.disabled = true;
  loginBtn.textContent = 'AUTHENTICATING…';
  loginError.classList.remove('visible');

  try {
    await login(email, pass);
    // onAuthChange handles the rest
  } catch (err) {
    loginError.textContent = err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
      ? 'Invalid credentials.'
      : err.message || 'Login failed.';
    loginError.classList.add('visible');
    loginBtn.disabled = false;
    loginBtn.textContent = 'ACCESS THE UNIVERSE';
  }
});

// ── Auth guard ────────────────────────────────────────────────────
onAuthChange(user => {
  if (user) {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  loginPage && (loginPage.style.display = 'flex');
  adminApp  && (adminApp.style.display  = 'none');
  loginBtn  && (loginBtn.disabled = false);
  loginBtn  && (loginBtn.textContent = 'ACCESS THE UNIVERSE');
}

function showDashboard() {
  loginPage && (loginPage.style.display = 'none');
  adminApp  && (adminApp.style.display  = 'flex');
  loadDashboard();
}

// ── Logout ────────────────────────────────────────────────────────
document.getElementById('logout-btn') && document.getElementById('logout-btn')
  .addEventListener('click', async () => {
    await logout();
  });

// ── Sidebar navigation ────────────────────────────────────────────
const sidebarLinks  = document.querySelectorAll('.sidebar-link[data-panel]');
const panelSections = document.querySelectorAll('.admin-panel-section');
const topbarTitle   = document.getElementById('topbar-section-title');

sidebarLinks.forEach(link => {
  link.addEventListener('click', () => {
    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const target = link.dataset.panel;
    panelSections.forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));
    topbarTitle && (topbarTitle.textContent = link.querySelector('.s-label')?.textContent || '');
    // Close sidebar on mobile
    document.getElementById('admin-sidebar')?.classList.remove('open');
  });
});

// Mobile sidebar toggle
document.getElementById('sidebar-toggle') && document.getElementById('sidebar-toggle')
  .addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('open');
  });

// ── Load dashboard ────────────────────────────────────────────────
async function loadDashboard() {
  loadWebsites();
  loadProjects();
  loadAnnouncements();
  loadSettings();
}

// ══════════════════════════════════════════════════════════════════
// WEBSITES
// ══════════════════════════════════════════════════════════════════
let websitesData = [];

async function loadWebsites() {
  try {
    websitesData = await getAllWebsites();
    renderWebsitesTable();
    updateStatTiles();
  } catch (e) { toast(e.message, 'error'); }
}

function renderWebsitesTable() {
  const tbody = document.getElementById('websites-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!websitesData.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">
      No websites yet. Click + Add Website to begin.
    </td></tr>`;
    return;
  }
  websitesData.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="table-name">${esc(w.name)}</td>
      <td><span class="badge badge-${w.status === 'live' ? 'live' : 'soon'}">${esc(w.status || 'soon')}</span></td>
      <td>${esc(w.category || '—')}</td>
      <td><span class="badge badge-${w.published ? 'pub' : 'unpub'}">${w.published ? 'Published' : 'Draft'}</span></td>
      <td>${w.order ?? '—'}</td>
      <td class="row-actions">
        <button class="btn-row btn-row-edit"   data-id="${esc(w.id)}" data-type="website">Edit</button>
        ${w.published
          ? `<button class="btn-row btn-row-unpub" data-id="${esc(w.id)}" data-type="website" data-action="unpublish">Unpublish</button>`
          : `<button class="btn-row btn-row-pub"   data-id="${esc(w.id)}" data-type="website" data-action="publish">Publish</button>`
        }
        <button class="btn-row btn-row-delete" data-id="${esc(w.id)}" data-type="website" data-action="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachTableListeners(tbody, 'website');
}

// ══════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════
let projectsData = [];

async function loadProjects() {
  try {
    projectsData = await getAllProjects();
    renderProjectsTable();
  } catch (e) { toast(e.message, 'error'); }
}

function renderProjectsTable() {
  const tbody = document.getElementById('projects-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!projectsData.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No projects yet.</td></tr>`;
    return;
  }
  projectsData.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="table-name">${esc(p.name)}</td>
      <td><span class="badge badge-${p.status === 'live' ? 'live' : 'soon'}">${esc(p.status || 'soon')}</span></td>
      <td>${esc(p.category || '—')}</td>
      <td><span class="badge badge-${p.published ? 'pub' : 'unpub'}">${p.published ? 'Published' : 'Draft'}</span></td>
      <td class="row-actions">
        <button class="btn-row btn-row-edit"   data-id="${esc(p.id)}" data-type="project">Edit</button>
        ${p.published
          ? `<button class="btn-row btn-row-unpub" data-id="${esc(p.id)}" data-type="project" data-action="unpublish">Unpublish</button>`
          : `<button class="btn-row btn-row-pub"   data-id="${esc(p.id)}" data-type="project" data-action="publish">Publish</button>`
        }
        <button class="btn-row btn-row-delete" data-id="${esc(p.id)}" data-type="project" data-action="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachTableListeners(tbody, 'project');
}

// ══════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════
let announcementsData = [];

async function loadAnnouncements() {
  try {
    announcementsData = await getAllAnnouncements();
    renderAnnouncementsTable();
  } catch (e) { toast(e.message, 'error'); }
}

function renderAnnouncementsTable() {
  const tbody = document.getElementById('announcements-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!announcementsData.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem">No announcements yet.</td></tr>`;
    return;
  }
  announcementsData.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="table-name">${esc(a.text || a.name || '')}</td>
      <td><span class="badge badge-${a.published ? 'pub' : 'unpub'}">${a.published ? 'Published' : 'Draft'}</span></td>
      <td class="row-actions">
        <button class="btn-row btn-row-edit"   data-id="${esc(a.id)}" data-type="announcement">Edit</button>
        ${a.published
          ? `<button class="btn-row btn-row-unpub" data-id="${esc(a.id)}" data-type="announcement" data-action="unpublish">Unpublish</button>`
          : `<button class="btn-row btn-row-pub"   data-id="${esc(a.id)}" data-type="announcement" data-action="publish">Publish</button>`
        }
        <button class="btn-row btn-row-delete" data-id="${esc(a.id)}" data-type="announcement" data-action="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachTableListeners(tbody, 'announcement');
}

// ── Table action listeners ─────────────────────────────────────────
function attachTableListeners(tbody, type) {
  tbody.querySelectorAll('.btn-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id     = btn.dataset.id;
      const action = btn.dataset.action;

      if (!action) {
        // Edit
        openModal(id, type);
        return;
      }

      if (action === 'delete') {
        openConfirm(`Delete this ${type}? This cannot be undone.`, async () => {
          try {
            if (type === 'website')      await deleteWebsite(id);
            if (type === 'project')      await deleteProject(id);
            if (type === 'announcement') await deleteAnnouncement(id);
            toast(`${type} deleted.`, 'success');
            if (type === 'website')      loadWebsites();
            if (type === 'project')      loadProjects();
            if (type === 'announcement') loadAnnouncements();
          } catch (e) { toast(e.message, 'error'); }
        });
        return;
      }

      if (action === 'publish' || action === 'unpublish') {
        const pub = action === 'publish';
        try {
          if (type === 'website')      await publishWebsite(id, pub);
          if (type === 'project')      await publishProject(id, pub);
          if (type === 'announcement') await publishAnnouncement(id, pub);
          toast(`${type} ${pub ? 'published' : 'unpublished'}.`, 'success');
          if (type === 'website')      loadWebsites();
          if (type === 'project')      loadProjects();
          if (type === 'announcement') loadAnnouncements();
        } catch (e) { toast(e.message, 'error'); }
      }
    });
  });
}

// ── Stats ──────────────────────────────────────────────────────────
function updateStatTiles() {
  const live = websitesData.filter(w => w.status === 'live' && w.published).length;
  const draft = websitesData.filter(w => !w.published).length;
  document.getElementById('tile-live')     && (document.getElementById('tile-live').textContent     = live);
  document.getElementById('tile-draft')    && (document.getElementById('tile-draft').textContent    = draft);
  document.getElementById('tile-websites') && (document.getElementById('tile-websites').textContent = websitesData.length);
  document.getElementById('tile-projects') && (document.getElementById('tile-projects').textContent = projectsData.length);
}

// ══════════════════════════════════════════════════════════════════
// MODAL / FORM
// ══════════════════════════════════════════════════════════════════
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const modalForm    = document.getElementById('modal-form');
const modalClose   = document.getElementById('modal-close');
const btnCancel    = document.getElementById('btn-modal-cancel');
const btnSave      = document.getElementById('btn-modal-save');

let editingId   = null;
let editingType = null;

function openModal(id, type) {
  editingId   = id || null;
  editingType = type;

  modalTitle.textContent = `${id ? 'Edit' : 'Add'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  renderModalFields(type);
  populateModal(id, type);

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Trap focus
  setTimeout(() => modalForm.querySelector('input, textarea, select')?.focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  editingId = editingType = null;
  modalForm.innerHTML = '';
}

modalClose && modalClose.addEventListener('click', closeModal);
btnCancel  && btnCancel.addEventListener('click', closeModal);
modalOverlay && modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay?.classList.contains('open')) closeModal();
  if (e.key === 'Escape' && confirmDialog?.classList.contains('open')) closeConfirm();
});

function renderModalFields(type) {
  if (!modalForm) return;
  if (type === 'website') {
    modalForm.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="f-name">Website Name *</label>
          <input id="f-name" name="name" type="text" class="form-input" required placeholder="e.g. Aurenix">
        </div>
        <div class="form-group">
          <label class="form-label" for="f-category">Category</label>
          <select id="f-category" name="category" class="form-input">
            <option value="">— Select —</option>
            <option value="Music">Music</option>
            <option value="Social">Social</option>
            <option value="Media">Media</option>
            <option value="Creative">Creative</option>
            <option value="Future">Future</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label" for="f-url">Website URL</label>
        <input id="f-url" name="url" type="url" class="form-input" placeholder="https://yourwebsite.com">
        <p class="form-hint">Must start with https:// — Leave blank for Coming Soon portals.</p>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label" for="f-description">Description</label>
        <textarea id="f-description" name="description" class="form-input" placeholder="Short description shown on the portal card…"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="f-icon">Emoji Icon</label>
          <input id="f-icon" name="icon" type="text" class="form-input" placeholder="🌐" maxlength="4">
        </div>
        <div class="form-group">
          <label class="form-label" for="f-order">Display Order</label>
          <input id="f-order" name="order" type="number" class="form-input" min="0" placeholder="1">
        </div>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label" for="f-bgImage">Background Image URL</label>
        <input id="f-bgImage" name="bgImage" type="url" class="form-input" placeholder="https://… (optional)">
        <p class="form-hint">Landscape image shown as portal background. Use https:// links only.</p>
      </div>
      <div class="form-row">
        <div class="toggle-group">
          <label class="toggle-switch">
            <input id="f-status" name="statusLive" type="checkbox">
            <span class="toggle-track"></span>
          </label>
          <span class="toggle-label">Mark as Live (has working URL)</span>
        </div>
        <div class="toggle-group">
          <label class="toggle-switch">
            <input id="f-featured" name="featured" type="checkbox">
            <span class="toggle-track"></span>
          </label>
          <span class="toggle-label">Featured Portal</span>
        </div>
      </div>
    `;
  } else if (type === 'project') {
    modalForm.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="f-name">Project Name *</label>
          <input id="f-name" name="name" type="text" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="f-category">Category</label>
          <select id="f-category" name="category" class="form-input">
            <option value="">— Select —</option>
            <option value="Music">Music Realm</option>
            <option value="Social">Social Realm</option>
            <option value="Media">Media Realm</option>
            <option value="Creative">Creative Realm</option>
            <option value="Future">Future Projects</option>
            <option value="Experimental">Experimental</option>
          </select>
        </div>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label" for="f-url">Project URL</label>
        <input id="f-url" name="url" type="url" class="form-input" placeholder="https://… (optional for Coming Soon)">
      </div>
      <div class="form-group form-group-full">
        <label class="form-label" for="f-description">Description</label>
        <textarea id="f-description" name="description" class="form-input"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="f-icon">Emoji Icon</label>
          <input id="f-icon" name="icon" type="text" class="form-input" placeholder="🔒" maxlength="4">
        </div>
        <div class="form-group">
          <label class="form-label" for="f-order">Display Order</label>
          <input id="f-order" name="order" type="number" class="form-input" min="0">
        </div>
      </div>
      <div class="toggle-group">
        <label class="toggle-switch">
          <input id="f-status" name="statusLive" type="checkbox">
          <span class="toggle-track"></span>
        </label>
        <span class="toggle-label">Mark as Live</span>
      </div>
    `;
  } else if (type === 'announcement') {
    modalForm.innerHTML = `
      <div class="form-group form-group-full">
        <label class="form-label" for="f-text">Announcement Text *</label>
        <textarea id="f-text" name="text" class="form-input" required placeholder="Short ticker message…" style="min-height:80px"></textarea>
        <p class="form-hint">This appears in the scrolling ticker on the public homepage.</p>
      </div>
    `;
  }
}

function populateModal(id, type) {
  if (!id) return;
  let item;
  if (type === 'website')      item = websitesData.find(w => w.id === id);
  if (type === 'project')      item = projectsData.find(p => p.id === id);
  if (type === 'announcement') item = announcementsData.find(a => a.id === id);
  if (!item) return;

  modalForm.querySelectorAll('[name]').forEach(el => {
    const name = el.name;
    if (name === 'statusLive') {
      el.checked = item.status === 'live';
    } else if (el.type === 'checkbox') {
      el.checked = !!item[name];
    } else {
      el.value = item[name] ?? '';
    }
  });
}

// ── Save handler ──────────────────────────────────────────────────
btnSave && btnSave.addEventListener('click', async () => {
  if (!editingType) return;
  const data = collectFormData();
  if (!data) return;

  btnSave.disabled = true;
  btnSave.textContent = 'Saving…';

  try {
    if (editingType === 'website')      await saveWebsite(data, editingId);
    if (editingType === 'project')      await saveProject(data, editingId);
    if (editingType === 'announcement') await saveAnnouncement(data, editingId);

    toast(`${editingType} ${editingId ? 'updated' : 'created'} successfully!`, 'success');
    closeModal();

    if (editingType === 'website')      loadWebsites();
    if (editingType === 'project')      loadProjects();
    if (editingType === 'announcement') loadAnnouncements();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Save';
  }
});

function collectFormData() {
  const data = {};
  let valid = true;

  modalForm.querySelectorAll('[name]').forEach(el => {
    const name = el.name;
    if (name === 'statusLive') {
      data.status = el.checked ? 'live' : 'soon';
    } else if (el.type === 'checkbox') {
      data[name] = el.checked;
    } else if (el.type === 'number') {
      data[name] = el.value !== '' ? Number(el.value) : null;
    } else {
      data[name] = el.value.trim();
    }
  });

  // Validate required name
  if (!data.name && !data.text) {
    toast('Name / text is required.', 'error');
    valid = false;
  }

  // Validate URL
  if (data.url && !validateUrl(data.url)) {
    toast('Invalid URL — must start with https:// or http://', 'error');
    valid = false;
  }

  if (data.bgImage && !validateUrl(data.bgImage)) {
    toast('Invalid background image URL.', 'error');
    valid = false;
  }

  return valid ? data : null;
}

// ── Add buttons ────────────────────────────────────────────────────
document.getElementById('btn-add-website')      && document.getElementById('btn-add-website')
  .addEventListener('click', () => openModal(null, 'website'));
document.getElementById('btn-add-project')      && document.getElementById('btn-add-project')
  .addEventListener('click', () => openModal(null, 'project'));
document.getElementById('btn-add-announcement') && document.getElementById('btn-add-announcement')
  .addEventListener('click', () => openModal(null, 'announcement'));

// ══════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════
async function loadSettings() {
  try {
    const s = await getSettings();
    const siteTitle = document.getElementById('s-site-title');
    const siteTagline = document.getElementById('s-tagline');
    const openNewTab = document.getElementById('s-new-tab');
    if (siteTitle)    siteTitle.value   = s.siteTitle   || '';
    if (siteTagline)  siteTagline.value = s.tagline      || '';
    if (openNewTab)   openNewTab.checked = s.openNewTab !== false;
  } catch (e) { console.warn('Settings load:', e.message); }
}

document.getElementById('btn-save-settings') && document.getElementById('btn-save-settings')
  .addEventListener('click', async () => {
    const data = {
      siteTitle:  document.getElementById('s-site-title')?.value.trim() || '',
      tagline:    document.getElementById('s-tagline')?.value.trim()    || '',
      openNewTab: document.getElementById('s-new-tab')?.checked ?? true,
    };
    try {
      await saveSettings(data);
      toast('Settings saved!', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });

// ══════════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════════════════════════════════════════
const confirmDialog = document.getElementById('confirm-dialog');
const confirmMsg    = document.getElementById('confirm-msg');
const confirmOk     = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel-btn');
const confirmCloseX = document.getElementById('confirm-close-x');
let confirmCallback = null;

function openConfirm(msg, onConfirm) {
  confirmMsg.textContent = msg;
  confirmCallback = onConfirm;
  confirmDialog.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  confirmDialog.classList.remove('open');
  document.body.style.overflow = '';
  confirmCallback = null;
}

confirmOk && confirmOk.addEventListener('click', async () => {
  if (confirmCallback) await confirmCallback();
  closeConfirm();
});

confirmCancel  && confirmCancel.addEventListener('click', closeConfirm);
confirmCloseX  && confirmCloseX.addEventListener('click', closeConfirm);
confirmDialog  && confirmDialog.addEventListener('click', e => {
  if (e.target === confirmDialog) closeConfirm();
});
