/**
 * UNIVERSE — Main Public App
 * Handles intro, navigation, portals, search/filter, announcements
 */

import UniverseCanvas from './canvas.js';
import {
  onAuthChange,
  getPublishedWebsites,
  getPublishedProjects,
  getPublishedAnnouncements,
} from './firebase-service.js';

// ── Reduced Motion ────────────────────────────────────────────────
const REDUCE_KEY = 'cls_reduce_motion';
const reduceBtn  = document.getElementById('reduce-motion-btn');
let motionReduced = localStorage.getItem(REDUCE_KEY) === '1';

function applyMotion() {
  if (motionReduced) {
    document.body.classList.add('reduce-motion');
    UniverseCanvas.disable();
    reduceBtn && reduceBtn.classList.add('active');
    reduceBtn && (reduceBtn.textContent = 'Motion: Off');
  } else {
    document.body.classList.remove('reduce-motion');
    UniverseCanvas.enable();
    reduceBtn && reduceBtn.classList.remove('active');
    reduceBtn && (reduceBtn.textContent = 'Reduce Motion');
  }
}

reduceBtn && reduceBtn.addEventListener('click', () => {
  motionReduced = !motionReduced;
  localStorage.setItem(REDUCE_KEY, motionReduced ? '1' : '0');
  applyMotion();
});

// ── Intro Screen ─────────────────────────────────────────────────
const INTRO_KEY = 'cls_intro_seen';
const introScreen = document.getElementById('intro-screen');
const enterBtn    = document.getElementById('enter-universe-btn');

function dismissIntro() {
  introScreen.classList.add('fade-out');
  setTimeout(() => {
    introScreen.classList.add('hidden');
    introScreen.setAttribute('aria-hidden', 'true');
  }, 900);
  sessionStorage.setItem(INTRO_KEY, '1');
}

if (introScreen) {
  if (sessionStorage.getItem(INTRO_KEY)) {
    introScreen.classList.add('hidden');
  } else {
    enterBtn && enterBtn.addEventListener('click', dismissIntro);
    // Auto-dismiss after 12s to not be annoying
    setTimeout(dismissIntro, 12000);
  }
}

// ── Canvas ────────────────────────────────────────────────────────
UniverseCanvas.init();
applyMotion();

// ── Header scroll effect ──────────────────────────────────────────
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header && header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Mobile nav ────────────────────────────────────────────────────
const navToggle  = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');

navToggle && navToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle && navToggle.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── Active nav link on scroll ─────────────────────────────────────
const sections = document.querySelectorAll('[data-section]');
const navLinks  = document.querySelectorAll('[data-nav]');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`[data-nav="${e.target.dataset.section}"]`);
      active && active.classList.add('active');
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => sectionObserver.observe(s));

// ── Portal transition overlay ─────────────────────────────────────
const portalOverlay = document.getElementById('portal-transition');
const portalText    = document.getElementById('portal-transition-text');

function triggerPortalTransition(name, url, newTab) {
  if (!url || url === '#') return;
  portalText && (portalText.textContent = `ENTERING ${name.toUpperCase()}…`);
  portalOverlay && portalOverlay.classList.add('active');
  setTimeout(() => {
    portalOverlay && portalOverlay.classList.remove('active');
    newTab ? window.open(url, '_blank', 'noopener,noreferrer') : (window.location.href = url);
  }, 900);
}

// ── Sanitize URL (only allow http/https) ──────────────────────────
function safeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch { return null; }
}

// ── Render portals ────────────────────────────────────────────────
const portalsGrid    = document.getElementById('portals-grid');
const portalsLoading = document.getElementById('portals-loading');
const portalsEmpty   = document.getElementById('portals-empty');
const searchInput    = document.getElementById('portal-search');
const filterChips    = document.querySelectorAll('.filter-chip');

let allPortals = [];
let activeFilter = 'all';
let searchQuery  = '';

function renderPortals(list) {
  if (!portalsGrid) return;
  portalsGrid.innerHTML = '';

  if (!list.length) {
    portalsEmpty && (portalsEmpty.style.display = 'block');
    return;
  }
  portalsEmpty && (portalsEmpty.style.display = 'none');

  list.forEach(w => {
    const url     = safeUrl(w.url);
    const isLive  = w.status === 'live' && url;
    const card    = document.createElement('article');
    card.className = `portal-card${isLive ? '' : ' coming-soon'}`;
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', w.name);

    const bgImg = w.bgImage
      ? `<img src="${escHtml(w.bgImage)}" alt="" class="portal-bg-img" loading="lazy">`
      : `<div class="portal-bg-placeholder" aria-hidden="true">${w.icon || '🌐'}</div>`;

    card.innerHTML = `
      ${bgImg}
      <div class="portal-body">
        <span class="portal-category-badge">${escHtml(w.category || 'Universe')}</span>
        <h3 class="portal-name">${escHtml(w.name)}</h3>
        <p class="portal-description">${escHtml(w.description || '')}</p>
      </div>
      <div class="portal-footer">
        <span class="portal-status ${isLive ? 'live' : 'soon'}">
          ${isLive ? '◉ LIVE' : '🔒 COMING SOON'}
        </span>
        ${isLive ? `
          <button class="btn-enter-portal" data-name="${escHtml(w.name)}" data-url="${escHtml(url)}" aria-label="Enter ${escHtml(w.name)}">
            ENTER WORLD <span class="arrow" aria-hidden="true">→</span>
          </button>` : ''}
      </div>
    `;

    portalsGrid.appendChild(card);
  });

  // Attach portal click listeners
  portalsGrid.querySelectorAll('.btn-enter-portal').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      triggerPortalTransition(btn.dataset.name, btn.dataset.url, true);
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

function filterPortals() {
  let list = allPortals;
  if (activeFilter !== 'all') {
    list = list.filter(w => (w.category || '').toLowerCase() === activeFilter.toLowerCase());
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(w =>
      w.name.toLowerCase().includes(q) ||
      (w.description || '').toLowerCase().includes(q) ||
      (w.category || '').toLowerCase().includes(q)
    );
  }
  renderPortals(list);
}

searchInput && searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  filterPortals();
});

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter || 'all';
    filterPortals();
  });
});

// ── Load public data ─────────────────────────────────────────────
async function loadPublicData() {
  try {
    // Portals
    portalsLoading && (portalsLoading.style.display = 'grid');
    const [websites, projects] = await Promise.all([
      getPublishedWebsites(),
      getPublishedProjects(),
    ]);

    allPortals = [
      ...websites.map(w => ({ ...w, _type: 'website' })),
      ...projects.map(p => ({ ...p, _type: 'project' })),
    ].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    portalsLoading && (portalsLoading.style.display = 'none');
    renderPortals(allPortals);

    // Announcements ticker
    const announcements = await getPublishedAnnouncements();
    if (announcements.length) renderTicker(announcements);

    // Stats counter
    document.getElementById('stat-worlds') && (
      document.getElementById('stat-worlds').textContent = websites.filter(w => w.status === 'live').length
    );
    document.getElementById('stat-projects') && (
      document.getElementById('stat-projects').textContent = projects.length
    );

  } catch (err) {
    console.warn('Firebase load error:', err.message);
    portalsLoading && (portalsLoading.style.display = 'none');
    if (err.message.includes('not configured')) {
      showDemoPortals();
    } else {
      portalsEmpty && (portalsEmpty.style.display = 'block');
    }
  }
}

// Demo portals shown before Firebase is connected
function showDemoPortals() {
  portalsLoading && (portalsLoading.style.display = 'none');
  allPortals = [
    {
      id: 'demo-1',
      name: 'Aurenix',
      description: 'Music · Entertainment · Digital World',
      category: 'Music',
      status: 'live',
      url: '#',
      icon: '🎵',
      order: 1,
    },
    {
      id: 'demo-2',
      name: 'Shadow Nexus Social',
      description: 'The social platform of the shadows.',
      category: 'Social',
      status: 'live',
      url: '#',
      icon: '🌐',
      order: 2,
    },
    {
      id: 'demo-3',
      name: 'Midnight Orbit Media',
      description: 'Video · Streaming · Creative Media',
      category: 'Media',
      status: 'live',
      url: '#',
      icon: '🎬',
      order: 3,
    },
    {
      id: 'demo-4',
      name: 'Unknown Project',
      description: 'Something is coming from the shadows…',
      category: 'Future',
      status: 'soon',
      url: null,
      icon: '🔒',
      order: 4,
    },
  ];
  renderPortals(allPortals);

  // Demo stats
  document.getElementById('stat-worlds')   && (document.getElementById('stat-worlds').textContent   = '3');
  document.getElementById('stat-projects') && (document.getElementById('stat-projects').textContent = '4');

  // Demo ticker
  renderTicker([
    { text: 'Welcome to the Chris Legend of Shadows Universe — Connect Firebase to go live' },
    { text: 'Add your first website portal from the Admin Dashboard' },
  ]);
}

// ── Announcements Ticker ──────────────────────────────────────────
function renderTicker(items) {
  const bar  = document.getElementById('announcements-bar');
  const wrap = document.getElementById('ticker-wrap');
  if (!bar || !wrap) return;
  bar.style.display = '';

  // Duplicate for seamless loop
  const all = [...items, ...items];
  wrap.innerHTML = all
    .map(a => `<span class="ticker-item">${escHtml(a.text || a.name || '')}</span>`)
    .join('');
}

// ── HTML Escape ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Auth state — show/hide admin link ────────────────────────────
try {
  onAuthChange(user => {
    const adminLink = document.getElementById('admin-nav-link');
    if (adminLink) adminLink.style.display = user ? 'inline-flex' : 'none';
  });
} catch (e) {
  // Firebase not configured yet — suppress
}

// ── PWA Install prompt ────────────────────────────────────────────
let deferredPrompt = null;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn && (installBtn.style.display = 'inline-flex');
});

installBtn && installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (outcome === 'accepted') installBtn.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
  installBtn && (installBtn.style.display = 'none');
});

// ── Boot ──────────────────────────────────────────────────────────
loadPublicData();
