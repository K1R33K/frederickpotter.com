/**
 * Landing page — hero animation, stat counters, spotlight grid, skills cloud
 */
import { CASE_STUDIES, SECTOR_LABELS, SECTOR_COUNTS, SKILL_FREQUENCIES, TOTAL_PROJECTS, TOTAL_SKILLS, TOTAL_SECTORS } from './data.js';
import { initNav, renderCard, initScrollAnimations, initHeroAnimation, animateCounter } from './app.js';

function init() {
  initNav(true);
  initHeroAnimation();
  renderStats();
  renderSectorBar();
  renderSpotlights();
  renderSkillsCloud();
  initScrollAnimations();
}

/* ── Animated Stat Counters ────────────────────── */
function renderStats() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => {
    el.textContent = '0';
    observer.observe(el);
  });
}

/* ── Sector Bar ────────────────────────────────── */
function renderSectorBar() {
  const container = document.getElementById('sector-bar');
  if (!container) return;

  const sorted = Object.entries(SECTOR_COUNTS).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    const label = SECTOR_LABELS[key]?.name || key;
    const pill = document.createElement('a');
    pill.className = 'sector-pill animate-in animate-in--stagger';
    pill.style.setProperty('--stagger', sorted.indexOf([key, count]));
    pill.href = `case-studies.html#sector=${encodeURIComponent(key)}`;
    pill.innerHTML = `${label} <span class="sector-pill__count">${count}</span>`;
    container.appendChild(pill);
  }
}

/* ── Spotlight Grid ────────────────────────────── */
function renderSpotlights() {
  const grid = document.getElementById('spotlight-grid');
  if (!grid) return;

  const spotlights = CASE_STUDIES.filter(cs => cs.spotlight);
  spotlights.forEach((cs, i) => {
    const card = renderCard(cs, { linkSkills: true, staggerIndex: i });
    grid.appendChild(card);
  });
}

/* ── Skills Cloud ──────────────────────────────── */
function renderSkillsCloud() {
  const cloud = document.getElementById('skills-cloud');
  if (!cloud) return;

  const entries = Object.entries(SKILL_FREQUENCIES);
  const maxFreq = Math.max(...entries.map(e => e[1]));

  // Bucket into 5 tiers by frequency
  entries.forEach(([skill, freq]) => {
    const ratio = freq / maxFreq;
    let size;
    if (ratio > 0.75) size = 'xl';
    else if (ratio > 0.5) size = 'lg';
    else if (ratio > 0.3) size = 'md';
    else if (ratio > 0.15) size = 'sm';
    else size = 'xs';

    const el = document.createElement('a');
    el.className = `skills-cloud__item skills-cloud__item--${size} animate-in`;
    el.href = `case-studies.html#skill=${encodeURIComponent(skill)}`;
    el.textContent = skill;
    el.title = `${freq} project${freq > 1 ? 's' : ''}`;
    cloud.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', init);
