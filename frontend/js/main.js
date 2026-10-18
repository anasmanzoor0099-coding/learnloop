import { api, getCurrentUser, initials } from './api.js';
import { courseCard, escapeHtml } from './course-card.js';
import { showToast } from './ui.js';

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const navActions = document.querySelector('[data-nav-actions]');
const studioLink = document.querySelector('[data-studio-link]');

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function closeMenu() {
  if (!menuToggle || !header) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  header.classList.remove('nav-open');
  document.body.classList.remove('nav-open');
}

function toggleMenu() {
  if (!menuToggle || !header) return;
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  header.classList.toggle('nav-open', !isOpen);
  document.body.classList.toggle('nav-open', !isOpen);
}

if (menuToggle) {
  menuToggle.addEventListener('click', toggleMenu);
}

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 920) closeMenu();
});

function setHeaderState() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

/* -------------------------------------------------------------------------- */
/* Active navigation link                                                     */
/* -------------------------------------------------------------------------- */

const currentFile = window.location.pathname.split('/').pop() || 'index.html';

document.querySelectorAll('[data-nav] a').forEach((link) => {
  const href = link.getAttribute('href');
  if (!href) return;

  const target = new URL(href, window.location.href);
  const file = target.pathname.split('/').pop() || 'index.html';

  if (file === currentFile && target.hash === window.location.hash) {
    link.setAttribute('aria-current', 'page');
  }
});

/* -------------------------------------------------------------------------- */
/* Footer year and newsletter                                                 */
/* -------------------------------------------------------------------------- */

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelector('[data-newsletter-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = new FormData(form).get('email');
  const input = form.querySelector('input[type="email"]');
  const value = String(email || input?.value || '').trim();

  if (!value) {
    showToast('Enter your email address first.', { tone: 'error' });
    input?.focus();
    return;
  }

  showToast('You are on the list. One useful email a month.');
  form.reset();
});

/* -------------------------------------------------------------------------- */
/* Authentication-aware navigation                                            */
/* -------------------------------------------------------------------------- */

function renderGuestActions() {
  if (!navActions) return;

  navActions.innerHTML = `
    <a class="button button-ghost button-sm nav-login" href="/login.html">Log in</a>
    <a class="button button-primary button-sm" href="/register.html">Get started</a>
  `;
}

function renderUserActions(user) {
  if (!navActions) return;

  const fullName = escapeHtml(user.name || 'Learner');
  const firstName = escapeHtml(String(user.name || 'Learner').split(/\s+/)[0]);

  navActions.innerHTML = `
    <a class="button button-ghost button-sm nav-dashboard" href="/dashboard.html">Dashboard</a>
    <a class="user-chip" href="/dashboard.html" title="${fullName}">
      <span class="avatar avatar-1">${escapeHtml(initials(user.name))}</span>
      <span>${firstName}</span>
    </a>
    <button class="button button-ghost button-sm nav-logout" type="button" data-logout>
      Log out
    </button>
  `;
}

async function initAuthNavigation() {
  const user = await getCurrentUser();

  if (studioLink) {
    studioLink.hidden = user?.role !== 'instructor';
  }

  if (user) renderUserActions(user);
  else renderGuestActions();
}

navActions?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-logout]');
  if (!button) return;

  button.disabled = true;
  button.textContent = 'Logging out…';

  try {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
  } catch {
    button.disabled = false;
    button.textContent = 'Log out';
    showToast('Could not log out. Please try again.', { tone: 'error' });
  }
});

initAuthNavigation();

/* -------------------------------------------------------------------------- */
/* Featured courses                                                           */
/* -------------------------------------------------------------------------- */

const courseGrid = document.querySelector('[data-featured-courses]');

async function loadFeaturedCourses() {
  if (!courseGrid) return;

  try {
    const response = await fetch('/api/courses', {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const courses = Array.isArray(data.courses) ? data.courses.slice(0, 3) : [];

    if (!courses.length) {
      courseGrid.innerHTML = `
        <div class="empty-state">
          <p class="eyebrow">Fresh courses are on the way</p>
          <h3>The catalog is being prepared.</h3>
          <p>Create an account and we will keep you posted when the first course opens.</p>
        </div>
      `;
      return;
    }

    courseGrid.innerHTML = courses.map(courseCard).join('');
  } catch {
    // During the frontend-first build, the API is not wired yet.
    // Keep the hand-written cards already present in the HTML.
  }
}

async function loadStats() {
  if (!document.querySelector('[data-stat="courses"]')) return;

  try {
    const response = await fetch('/api/stats', {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const stats = await response.json();
    const courseStat = document.querySelector('[data-stat="courses"]');
    const lessonStat = document.querySelector('[data-stat="lessons"]');
    const studentStat = document.querySelector('[data-stat="students"]');

    if (courseStat && Number.isFinite(stats.courses)) {
      courseStat.textContent = String(stats.courses);
    }
    if (lessonStat && Number.isFinite(stats.lessons)) {
      lessonStat.textContent = String(stats.lessons);
    }
    if (studentStat && Number.isFinite(stats.students)) {
      studentStat.textContent = stats.students > 999 ? '2k+' : String(stats.students);
    }
  } catch {
    // Keep the fallback numbers until the API exists.
  }
}

loadFeaturedCourses();
loadStats();
