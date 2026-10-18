import { api } from './api.js';
import { courseCard } from './course-card.js';

const grid = document.querySelector('[data-course-grid]');
const resultsCount = document.querySelector('[data-results-count]');
const emptyState = document.querySelector('[data-catalog-empty]');
const emptyCopy = document.querySelector('[data-catalog-empty-copy]');
const searchForm = document.querySelector('[data-search-form]');
const searchInput = document.querySelector('[data-search-input]');
const levelFilter = document.querySelector('[data-level-filter]');
const categoryChips = [...document.querySelectorAll('[data-category]')];
const clearButtons = [...document.querySelectorAll('[data-clear-filters]')];

const categories = new Set([
  'JavaScript',
  'Web Development',
  'Backend',
  'Design',
  'Data',
  'Career'
]);

const levels = new Set(['Beginner', 'Intermediate', 'Advanced']);
const params = new URLSearchParams(window.location.search);

const state = {
  search: params.get('search')?.trim() || '',
  category: categories.has(params.get('category')) ? params.get('category') : '',
  level: levels.has(params.get('level')) ? params.get('level') : ''
};

let debounceTimer = null;
let controller = null;

function skeletons() {
  return Array.from(
    { length: 6 },
    () => '<article class="course-card skeleton-card" aria-hidden="true"></article>'
  ).join('');
}

function syncControls() {
  if (searchInput) searchInput.value = state.search;
  if (levelFilter) levelFilter.value = state.level;

  categoryChips.forEach((chip) => {
    const active = chip.dataset.category === state.category;
    chip.classList.toggle('is-active', active);
    chip.setAttribute('aria-pressed', String(active));
  });

  const hasFilters = Boolean(state.search || state.category || state.level);
  clearButtons.forEach((button) => {
    button.hidden = !hasFilters;
  });
}

function syncUrl() {
  const query = new URLSearchParams();

  if (state.search) query.set('search', state.search);
  if (state.category) query.set('category', state.category);
  if (state.level) query.set('level', state.level);

  const search = query.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function setEmpty(message) {
  if (emptyCopy) emptyCopy.textContent = message;
  if (emptyState) emptyState.hidden = false;
}

async function loadCourses() {
  if (!grid) return;

  controller?.abort();
  controller = new AbortController();

  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = skeletons();
  if (emptyState) emptyState.hidden = true;
  if (resultsCount) resultsCount.textContent = 'Loading courses…';

  const query = new URLSearchParams();
  if (state.search) query.set('search', state.search);
  if (state.category) query.set('category', state.category);
  if (state.level) query.set('level', state.level);

  try {
    const data = await api(`/api/courses${query.size ? `?${query}` : ''}`, {
      signal: controller.signal
    });
    const courses = Array.isArray(data.courses) ? data.courses : [];

    grid.innerHTML = courses.map(courseCard).join('');

    if (resultsCount) {
      resultsCount.innerHTML = `<strong>${courses.length}</strong> ${
        courses.length === 1 ? 'course' : 'courses'
      } found`;
    }

    if (!courses.length) {
      setEmpty(
        state.search
          ? `Nothing matched “${state.search}”. Try a broader search or clear the filters.`
          : 'No courses are published in this filter yet. Try another category or level.'
      );
    }
  } catch (error) {
    if (controller.signal.aborted) return;

    grid.innerHTML = '';
    if (resultsCount) resultsCount.textContent = 'Catalog unavailable';

    setEmpty(
      error.status === 503
        ? 'The course catalog is waiting for its database connection. Add MONGODB_URI to backend/.env and run npm run seed.'
        : error.message || 'The course catalog could not be loaded. Please try again.'
    );
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

function updateAndLoad() {
  syncControls();
  syncUrl();
  loadCourses();
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  window.clearTimeout(debounceTimer);
  state.search = searchInput?.value.trim() || '';
  updateAndLoad();
});

searchInput?.addEventListener('input', () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    state.search = searchInput.value.trim();
    updateAndLoad();
  }, 320);
});

levelFilter?.addEventListener('change', () => {
  state.level = levelFilter.value;
  updateAndLoad();
});

categoryChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    state.category = chip.dataset.category || '';
    updateAndLoad();
  });
});

clearButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.search = '';
    state.category = '';
    state.level = '';
    syncControls();
    syncUrl();
    loadCourses();
  });
});

syncControls();
syncUrl();
loadCourses();
