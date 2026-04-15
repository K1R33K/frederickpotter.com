/**
 * Case Studies page — filter, search, URL hash routing
 */
import {
  CASE_STUDIES, SECTOR_LABELS, SECTOR_COUNTS, SKILL_FREQUENCIES,
  ENGAGEMENT_LABELS, ENGAGEMENT_COUNTS,
  PROJECT_TYPE_LABELS, PROJECT_TYPE_COUNTS,
  COMPANY_SIZE_LABELS, COMPANY_SIZE_COUNTS,
  TOTAL_PROJECTS
} from './data.js';
import { initNav, renderCard, initScrollAnimations, initHeroAnimation, expandCardByNum } from './app.js';

/* ── State ─────────────────────────────────────── */
const state = {
  query: '',
  sectors: new Set(),
  skills: new Set(),
  engagements: new Set(),
  projectTypes: new Set(),
  companySizes: new Set(),
};

let allCards = [];
let observer = null;

/* ── Initialise ────────────────────────────────── */
function init() {
  initNav(true);
  initHeroAnimation();
  renderSectorDropdown();
  renderEngagementDropdown();
  renderProjectTypeDropdown();
  renderCompanySizeDropdown();
  renderSkillsDropdown();
  renderCards();
  parseHash();
  bindEvents();
  observer = initScrollAnimations();
}

/* ── Render Sector Dropdown ────────────────────── */
function renderSectorDropdown() {
  const panel = document.getElementById('sector-filters');
  if (!panel) return;

  const sorted = Object.entries(SECTOR_COUNTS).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    const label = SECTOR_LABELS[key]?.name || key;
    const item = document.createElement('div');
    item.className = 'filter-dropdown__item';
    item.dataset.sector = key;
    item.innerHTML = `
      <span class="filter-dropdown__checkbox"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span>${label}</span>
      <span class="filter-dropdown__count">${count}</span>
    `;
    panel.appendChild(item);
  }
}

/* ── Render Engagement Dropdown ──────────────── */
function renderEngagementDropdown() {
  const panel = document.getElementById('engagement-filters');
  if (!panel) return;

  const sorted = Object.entries(ENGAGEMENT_COUNTS).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    const label = ENGAGEMENT_LABELS[key]?.name || key;
    const item = document.createElement('div');
    item.className = 'filter-dropdown__item';
    item.dataset.engagement = key;
    item.innerHTML = `
      <span class="filter-dropdown__checkbox"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span>${label}</span>
      <span class="filter-dropdown__count">${count}</span>
    `;
    panel.appendChild(item);
  }
}

/* ── Render Project Type Dropdown ────────────── */
function renderProjectTypeDropdown() {
  const panel = document.getElementById('project-type-filters');
  if (!panel) return;

  const order = ['ai-ml', 'build', 'strategy', 'data'];
  for (const key of order) {
    const count = PROJECT_TYPE_COUNTS[key] || 0;
    const label = PROJECT_TYPE_LABELS[key]?.name || key;
    const item = document.createElement('div');
    item.className = 'filter-dropdown__item';
    item.dataset.projectType = key;
    item.innerHTML = `
      <span class="filter-dropdown__checkbox"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span>${label}</span>
      <span class="filter-dropdown__count">${count}</span>
    `;
    panel.appendChild(item);
  }
}

/* ── Render Company Size Dropdown ─────────────── */
function renderCompanySizeDropdown() {
  const panel = document.getElementById('company-size-filters');
  if (!panel) return;

  const order = ['enterprise', 'sme', 'startup', 'public-sector', 'charity', 'freelance'];
  for (const key of order) {
    const count = COMPANY_SIZE_COUNTS[key] || 0;
    const label = COMPANY_SIZE_LABELS[key]?.name || key;
    const item = document.createElement('div');
    item.className = 'filter-dropdown__item';
    item.dataset.companySize = key;
    item.innerHTML = `
      <span class="filter-dropdown__checkbox"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span>${label}</span>
      <span class="filter-dropdown__count">${count}</span>
    `;
    panel.appendChild(item);
  }
}

/* ── Render Skills Dropdown ────────────────────── */
function renderSkillsDropdown() {
  const list = document.getElementById('skills-list');
  if (!list) return;

  const sorted = Object.entries(SKILL_FREQUENCIES).sort((a, b) => b[1] - a[1]);
  for (const [skill, count] of sorted) {
    const item = document.createElement('div');
    item.className = 'filter-dropdown__item';
    item.dataset.skill = skill;
    item.innerHTML = `
      <span class="filter-dropdown__checkbox"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span>${skill}</span>
      <span class="filter-dropdown__count">${count}</span>
    `;
    list.appendChild(item);
  }
}

/* ── Render All Cards ──────────────────────────── */
function renderCards() {
  const grid = document.getElementById('card-grid');
  if (!grid) return;

  CASE_STUDIES.forEach((cs, i) => {
    const card = renderCard(cs, { linkSkills: false, staggerIndex: i % 12 });
    card.dataset.engagement = cs.engagementType;
    card.dataset.projectTypes = (cs.projectTypes || []).join('|');
    card.dataset.companySize = cs.companySize;
    card.querySelectorAll('.card__skill-tag').forEach(tag => {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const skill = tag.textContent;
        state.skills.add(skill);
        applyFilters();
        updateHash();
        updateUI();
      });
    });
    grid.appendChild(card);
    allCards.push(card);
  });
}

/* ── Filter Logic ──────────────────────────────── */
function applyFilters() {
  const q = state.query.toLowerCase();
  let visibleCount = 0;

  allCards.forEach(card => {
    const matchesSector = state.sectors.size === 0 || state.sectors.has(card.dataset.sector);
    const matchesQuery = !q || card.dataset.searchable.includes(q);

    let matchesSkills = true;
    if (state.skills.size > 0) {
      const cardSkills = card.dataset.skills;
      for (const skill of state.skills) {
        if (!cardSkills.includes(skill.toLowerCase())) {
          matchesSkills = false;
          break;
        }
      }
    }

    const matchesEngagement = state.engagements.size === 0 ||
      state.engagements.has(card.dataset.engagement);

    let matchesProjectType = state.projectTypes.size === 0;
    if (!matchesProjectType) {
      const cardTypes = card.dataset.projectTypes.split('|');
      for (const pt of state.projectTypes) {
        if (cardTypes.includes(pt)) {
          matchesProjectType = true;
          break;
        }
      }
    }

    const matchesCompanySize = state.companySizes.size === 0 ||
      state.companySizes.has(card.dataset.companySize);

    const visible = matchesSector && matchesQuery && matchesSkills &&
      matchesEngagement && matchesProjectType && matchesCompanySize;
    card.classList.toggle('card--hidden', !visible);
    if (visible) visibleCount++;
  });

  const countEl = document.getElementById('result-count');
  if (countEl) {
    countEl.textContent = visibleCount === TOTAL_PROJECTS
      ? `${TOTAL_PROJECTS} case studies`
      : `Showing ${visibleCount} of ${TOTAL_PROJECTS}`;
  }

  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  if (observer) {
    allCards.forEach(card => {
      if (!card.classList.contains('card--hidden') && !card.classList.contains('animate-in--visible')) {
        observer.observe(card);
      }
    });
  }
}

/* ── Update UI state (pills, chips, dropdowns) ── */
function updateUI() {
  // Sector dropdown items + trigger label
  document.querySelectorAll('#sector-filters .filter-dropdown__item').forEach(item => {
    item.classList.toggle('filter-dropdown__item--selected', state.sectors.has(item.dataset.sector));
  });
  updateDropdownTrigger('sector-dropdown', 'Sector', state.sectors.size);

  // Engagement dropdown items + trigger label
  document.querySelectorAll('#engagement-filters .filter-dropdown__item').forEach(item => {
    item.classList.toggle('filter-dropdown__item--selected', state.engagements.has(item.dataset.engagement));
  });
  updateDropdownTrigger('engagement-dropdown', 'Engagement Type', state.engagements.size);

  // Project type dropdown items + trigger label
  document.querySelectorAll('#project-type-filters .filter-dropdown__item').forEach(item => {
    item.classList.toggle('filter-dropdown__item--selected', state.projectTypes.has(item.dataset.projectType));
  });
  updateDropdownTrigger('type-dropdown', 'Project Type', state.projectTypes.size);

  // Company size dropdown items + trigger label
  document.querySelectorAll('#company-size-filters .filter-dropdown__item').forEach(item => {
    item.classList.toggle('filter-dropdown__item--selected', state.companySizes.has(item.dataset.companySize));
  });
  updateDropdownTrigger('size-dropdown', 'Company Size', state.companySizes.size);

  // Skills dropdown items + trigger label
  document.querySelectorAll('#skills-list .filter-dropdown__item').forEach(item => {
    item.classList.toggle('filter-dropdown__item--selected', state.skills.has(item.dataset.skill));
  });
  updateDropdownTrigger('skills-dropdown-wrap', 'Skills', state.skills.size);

  // Active filter chips
  const chipsContainer = document.getElementById('active-filters');
  if (chipsContainer) {
    chipsContainer.innerHTML = '';

    state.sectors.forEach(s => {
      const label = SECTOR_LABELS[s]?.name || s;
      addChip(chipsContainer, label, () => {
        state.sectors.delete(s);
        applyFilters(); updateHash(); updateUI();
      });
    });

    state.engagements.forEach(e => {
      const label = ENGAGEMENT_LABELS[e]?.name || e;
      addChip(chipsContainer, label, () => {
        state.engagements.delete(e);
        applyFilters(); updateHash(); updateUI();
      });
    });

    state.projectTypes.forEach(pt => {
      const label = PROJECT_TYPE_LABELS[pt]?.name || pt;
      addChip(chipsContainer, label, () => {
        state.projectTypes.delete(pt);
        applyFilters(); updateHash(); updateUI();
      });
    });

    state.companySizes.forEach(sz => {
      const label = COMPANY_SIZE_LABELS[sz]?.name || sz;
      addChip(chipsContainer, label, () => {
        state.companySizes.delete(sz);
        applyFilters(); updateHash(); updateUI();
      });
    });

    state.skills.forEach(skill => {
      addChip(chipsContainer, skill, () => {
        state.skills.delete(skill);
        applyFilters(); updateHash(); updateUI();
      });
    });
  }

  // Clear all button
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    const hasFilters = state.query || state.sectors.size || state.skills.size ||
      state.engagements.size || state.projectTypes.size || state.companySizes.size;
    clearBtn.style.display = hasFilters ? 'inline' : 'none';
  }
}

function updateDropdownTrigger(dropdownId, baseName, count) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  const trigger = dropdown.querySelector('.filter-dropdown__trigger');
  if (!trigger) return;
  trigger.querySelector('span').textContent = count > 0 ? `${baseName} (${count})` : baseName;
  trigger.classList.toggle('filter-dropdown__trigger--active', count > 0);
}

function addChip(container, label, onRemove) {
  const chip = document.createElement('span');
  chip.className = 'active-filter-chip';
  chip.innerHTML = `${label} <button class="active-filter-chip__remove" aria-label="Remove ${label} filter">&times;</button>`;
  chip.querySelector('button').addEventListener('click', onRemove);
  container.appendChild(chip);
}

/* ── Dropdown open/close management ────────────── */
function setupDropdown(wrapperId, onItemClick) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const trigger = wrapper.querySelector('.filter-dropdown__trigger');
  trigger.addEventListener('click', () => {
    // Close other open dropdowns
    document.querySelectorAll('.filter-dropdown--open').forEach(d => {
      if (d !== wrapper) d.classList.remove('filter-dropdown--open');
    });
    wrapper.classList.toggle('filter-dropdown--open');
  });

  // Item clicks
  wrapper.querySelector('.filter-dropdown__panel').addEventListener('click', e => {
    const item = e.target.closest('.filter-dropdown__item');
    if (!item) return;
    onItemClick(item);
    applyFilters();
    updateHash();
    updateUI();
  });
}

/* ── Event Binding ─────────────────────────────── */
function bindEvents() {
  const searchInput = document.getElementById('search-input');
  let searchTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = searchInput.value.trim();
        applyFilters();
        updateHash();
      }, 300);
    });
  }

  // Sector dropdown
  setupDropdown('sector-dropdown', (item) => {
    const key = item.dataset.sector;
    if (state.sectors.has(key)) {
      state.sectors.delete(key);
    } else {
      state.sectors.add(key);
    }
  });

  // Engagement dropdown
  setupDropdown('engagement-dropdown', (item) => {
    const key = item.dataset.engagement;
    if (state.engagements.has(key)) {
      state.engagements.delete(key);
    } else {
      state.engagements.add(key);
    }
  });

  // Project type dropdown
  setupDropdown('type-dropdown', (item) => {
    const key = item.dataset.projectType;
    if (state.projectTypes.has(key)) {
      state.projectTypes.delete(key);
    } else {
      state.projectTypes.add(key);
    }
  });

  // Company size dropdown
  setupDropdown('size-dropdown', (item) => {
    const key = item.dataset.companySize;
    if (state.companySizes.has(key)) {
      state.companySizes.delete(key);
    } else {
      state.companySizes.add(key);
    }
  });

  // Skills dropdown
  setupDropdown('skills-dropdown-wrap', (item) => {
    const skill = item.dataset.skill;
    if (state.skills.has(skill)) {
      state.skills.delete(skill);
    } else {
      state.skills.add(skill);
    }
  });

  // Skills search within dropdown
  const skillsSearch = document.querySelector('#skills-dropdown-wrap .filter-dropdown__search-input');
  if (skillsSearch) {
    skillsSearch.addEventListener('input', () => {
      const q = skillsSearch.value.toLowerCase();
      document.querySelectorAll('#skills-list .filter-dropdown__item').forEach(item => {
        item.style.display = item.dataset.skill.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // Click outside to close all dropdowns
  document.addEventListener('click', e => {
    if (!e.target.closest('.filter-dropdown')) {
      document.querySelectorAll('.filter-dropdown--open').forEach(d => {
        d.classList.remove('filter-dropdown--open');
      });
    }
  });

  // Clear all
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    state.query = '';
    state.sectors.clear();
    state.skills.clear();
    state.engagements.clear();
    state.projectTypes.clear();
    state.companySizes.clear();
    if (searchInput) searchInput.value = '';
    applyFilters();
    updateHash();
    updateUI();
  });

  window.addEventListener('hashchange', parseHash);
}

/* ── URL Hash ──────────────────────────────────── */
function updateHash() {
  const parts = [];
  if (state.query) parts.push(`q=${encodeURIComponent(state.query)}`);
  if (state.sectors.size) parts.push(`sector=${[...state.sectors].map(encodeURIComponent).join(',')}`);
  if (state.skills.size) parts.push(`skill=${[...state.skills].map(encodeURIComponent).join(',')}`);
  if (state.engagements.size) parts.push(`engagement=${[...state.engagements].map(encodeURIComponent).join(',')}`);
  if (state.projectTypes.size) parts.push(`type=${[...state.projectTypes].map(encodeURIComponent).join(',')}`);
  if (state.companySizes.size) parts.push(`size=${[...state.companySizes].map(encodeURIComponent).join(',')}`);
  const hash = parts.length ? `#${parts.join('&')}` : '';
  history.replaceState(null, '', hash || window.location.pathname);
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const searchInput = document.getElementById('search-input');

  state.query = params.get('q') || '';
  state.sectors = params.has('sector')
    ? new Set(params.get('sector').split(',').map(decodeURIComponent))
    : new Set();
  state.skills = params.has('skill')
    ? new Set(params.get('skill').split(',').map(decodeURIComponent))
    : new Set();
  state.engagements = params.has('engagement')
    ? new Set(params.get('engagement').split(',').map(decodeURIComponent))
    : new Set();
  state.projectTypes = params.has('type')
    ? new Set(params.get('type').split(',').map(decodeURIComponent))
    : new Set();
  state.companySizes = params.has('size')
    ? new Set(params.get('size').split(',').map(decodeURIComponent))
    : new Set();

  if (searchInput) searchInput.value = state.query;

  if (params.has('project')) {
    const num = params.get('project');
    requestAnimationFrame(() => expandCardByNum(num));
  }

  applyFilters();
  updateUI();
}

/* ── Boot ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
