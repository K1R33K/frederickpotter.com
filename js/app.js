/**
 * Shared utilities — card rendering, navigation, scroll animations, detail panel
 */
import { CASE_STUDIES, SECTOR_LABELS } from './data.js';

/* ── Navigation ────────────────────────────────── */
export function initNav(darkMode = false) {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  if (darkMode) nav.classList.add('nav--dark');

  // Scroll: add background once past hero
  const threshold = 60;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('nav--scrolled', window.scrollY > threshold);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  const hamburger = nav.querySelector('.nav__hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
      document.body.style.overflow = nav.classList.contains('nav--open') ? 'hidden' : '';
    });
  }

  // Close mobile nav on link click
  nav.querySelectorAll('.nav__mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Card Rendering ────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatText(text) {
  if (!text) return '';
  return text.split('\n').filter(p => p.trim())
    .map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

export function renderCard(cs, { linkSkills = false, staggerIndex = 0 } = {}) {
  const sector = SECTOR_LABELS[cs.sector] || { name: cs.sector };
  const card = document.createElement('article');
  card.className = 'card animate-in animate-in--stagger';
  card.style.setProperty('--stagger', staggerIndex);
  card.dataset.num = cs.num;
  card.dataset.sector = cs.sector;
  card.dataset.skills = (cs.skills || []).join('|').toLowerCase();
  card.dataset.searchable = [
    cs.client, cs.project, cs.about, cs.challenge, cs.solution, cs.outcome
  ].join(' ').toLowerCase();

  // Show first 5 skills on card face
  const previewSkills = (cs.skills || []).slice(0, 5);
  const previewSkillTags = previewSkills.map(skill =>
    `<span class="card__skill-tag">${escapeHtml(skill)}</span>`
  ).join('');
  const moreCount = (cs.skills || []).length - previewSkills.length;

  card.innerHTML = `
    <div class="card__header" role="button" tabindex="0" aria-label="View details for ${escapeHtml(cs.client)}">
      <div class="card__meta">
        <span class="card__sector-tag">${escapeHtml(sector.name)}</span>
        <span class="card__number">#${cs.num}</span>
      </div>
      <h3 class="card__client">${escapeHtml(cs.client)}</h3>
      ${cs.project ? `<p class="card__project">${escapeHtml(cs.project)}</p>` : ''}
      ${cs.about ? `<p class="card__about">${escapeHtml(cs.about)}</p>` : ''}
      <p class="card__outcome">${escapeHtml(cs.outcome)}</p>
      ${cs.relationship ? `<p class="card__relationship">${escapeHtml(cs.relationship)}</p>` : ''}
      <div class="card__preview-skills">
        ${previewSkillTags}
        ${moreCount > 0 ? `<span class="card__skill-more">+${moreCount}</span>` : ''}
      </div>
      <button class="card__toggle" aria-label="View details">
        <span>View details</span>
        <span class="card__toggle-icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8.5 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
    </div>
  `;

  // Open detail panel on click
  const header = card.querySelector('.card__header');
  function openPanel() {
    openDetailPanel(cs.num);
  }

  header.addEventListener('click', openPanel);
  header.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel();
    }
  });

  return card;
}

/* ── Detail Panel ──────────────────────────────── */
let panelEl = null;
let backdropEl = null;
let currentCsNum = null;

function getVisibleNums() {
  return Array.from(document.querySelectorAll('.card:not(.card--hidden)'))
    .map(c => parseInt(c.dataset.num, 10));
}

function createPanelDOM() {
  if (panelEl) return;

  backdropEl = document.createElement('div');
  backdropEl.className = 'detail-panel-backdrop';
  backdropEl.addEventListener('click', closeDetailPanel);

  panelEl = document.createElement('aside');
  panelEl.className = 'detail-panel';
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('aria-label', 'Case study details');

  document.body.appendChild(backdropEl);
  document.body.appendChild(panelEl);
}

export function openDetailPanel(num) {
  createPanelDOM();

  const cs = CASE_STUDIES.find(c => c.num === num);
  if (!cs) return;

  currentCsNum = num;
  const sector = SECTOR_LABELS[cs.sector] || { name: cs.sector };

  // Build skill tags (link to filter on case studies page)
  const skillTags = (cs.skills || []).map(skill =>
    `<a href="case-studies.html#skill=${encodeURIComponent(skill)}" class="card__skill-tag">${escapeHtml(skill)}</a>`
  ).join('');

  // Determine prev/next from visible cards
  const visible = getVisibleNums();
  const idx = visible.indexOf(num);
  const prevNum = idx > 0 ? visible[idx - 1] : null;
  const nextNum = idx < visible.length - 1 ? visible[idx + 1] : null;

  panelEl.innerHTML = `
    <div class="detail-panel__header">
      <button class="detail-panel__close" aria-label="Close panel">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>Close</span>
      </button>
      <div class="detail-panel__nav">
        <button class="detail-panel__nav-btn" data-dir="prev" aria-label="Previous case study" ${prevNum === null ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="detail-panel__nav-btn" data-dir="next" aria-label="Next case study" ${nextNum === null ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
    <div class="detail-panel__body">
      <div class="detail-panel__meta">
        <span class="card__sector-tag">${escapeHtml(sector.name)}</span>
        <span class="card__number">#${cs.num}</span>
      </div>
      <h2 class="detail-panel__client">${escapeHtml(cs.client)}</h2>
      ${cs.project ? `<p class="detail-panel__project">${escapeHtml(cs.project)}</p>` : ''}
      ${cs.relationship ? `<p class="detail-panel__relationship">${escapeHtml(cs.relationship)}</p>` : ''}

      ${cs.about ? `
        <div class="detail-panel__section">
          <div class="detail-panel__section-label">About</div>
          <div class="detail-panel__section-text">${formatText(cs.about)}</div>
        </div>
      ` : ''}

      ${cs.challenge ? `
        <div class="detail-panel__section">
          <div class="detail-panel__section-label">The Challenge</div>
          <div class="detail-panel__section-text">${formatText(cs.challenge)}</div>
        </div>
      ` : ''}

      ${cs.solution ? `
        <div class="detail-panel__section">
          <div class="detail-panel__section-label">The Solution</div>
          <div class="detail-panel__section-text">${formatText(cs.solution)}</div>
        </div>
      ` : ''}

      ${cs.outcome ? `
        <div class="detail-panel__section">
          <div class="detail-panel__section-label">Outcome</div>
          <div class="detail-panel__outcome">${escapeHtml(cs.outcome)}</div>
        </div>
      ` : ''}

      ${cs.skills && cs.skills.length > 0 ? `
        <div class="detail-panel__section">
          <div class="detail-panel__section-label">Skills</div>
          <div class="detail-panel__skills">${skillTags}</div>
        </div>
      ` : ''}
    </div>
  `;

  // Bind close
  panelEl.querySelector('.detail-panel__close').addEventListener('click', closeDetailPanel);

  // Bind prev/next
  panelEl.querySelectorAll('.detail-panel__nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const targetNum = dir === 'prev' ? prevNum : nextNum;
      if (targetNum !== null) {
        panelEl.querySelector('.detail-panel__body').style.opacity = '0';
        setTimeout(() => {
          openDetailPanel(targetNum);
          panelEl.querySelector('.detail-panel__body').style.opacity = '1';
        }, 150);
      }
    });
  });

  // Open with animation
  requestAnimationFrame(() => {
    backdropEl.classList.add('detail-panel-backdrop--open');
    panelEl.classList.add('detail-panel--open');
  });

  document.body.style.overflow = 'hidden';

  // Keyboard: Escape to close, arrows to navigate
  panelEl._keyHandler = (e) => {
    if (e.key === 'Escape') closeDetailPanel();
    if (e.key === 'ArrowLeft' && prevNum !== null) openDetailPanel(prevNum);
    if (e.key === 'ArrowRight' && nextNum !== null) openDetailPanel(nextNum);
  };
  document.addEventListener('keydown', panelEl._keyHandler);
}

export function closeDetailPanel() {
  if (!panelEl || !backdropEl) return;

  panelEl.classList.remove('detail-panel--open');
  backdropEl.classList.remove('detail-panel-backdrop--open');
  document.body.style.overflow = '';

  if (panelEl._keyHandler) {
    document.removeEventListener('keydown', panelEl._keyHandler);
    panelEl._keyHandler = null;
  }

  currentCsNum = null;
}

/* ── Scroll Animations (Intersection Observer) ── */
export function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
  return observer;
}

/* ── Hero Entrance Animation ───────────────────── */
export function initHeroAnimation() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero-animate').forEach(el => {
      el.classList.add('hero-animate--visible');
    });
  });
}

/* ── Counter Animation ─────────────────────────── */
export function animateCounter(el, target, duration = 1500) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    // Ease-out quart
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ── Open Panel by Number (for deep links) ────── */
export function expandCardByNum(num) {
  const parsedNum = parseInt(num, 10);
  // Small delay to let cards render first
  setTimeout(() => openDetailPanel(parsedNum), 300);
}
