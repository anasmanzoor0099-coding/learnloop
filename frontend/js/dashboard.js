import { api, getCurrentUser, initials } from './api.js';
import {
  courseCard,
  courseCode,
  escapeHtml,
  formatMinutes
} from './course-card.js';
import { showToast } from './ui.js';

const userFirstName = document.querySelector('[data-user-first]');
const userName = document.querySelector('[data-user-name]');
const userRole = document.querySelector('[data-user-role]');
const userInitials = document.querySelector('[data-user-initials]');
const subtitle = document.querySelector('[data-dashboard-subtitle]');
const continueSlot = document.querySelector('[data-continue-slot]');
const myCourses = document.querySelector('[data-my-courses]');
const coursesEmpty = document.querySelector('[data-courses-empty]');
const instructorPanel = document.querySelector('[data-instructor-panel]');
const recommended = document.querySelector('[data-recommended-courses]');
const logoutButtons = [...document.querySelectorAll('[data-dashboard-logout]')];

const statCourses = document.querySelector('[data-stat-courses]');
const statLessons = document.querySelector('[data-stat-lessons]');
const statMinutes = document.querySelector('[data-stat-minutes]');
const statProgress = document.querySelector('[data-stat-progress]');

const accents = new Set(['mint', 'sun', 'sky', 'rose', 'violet', 'sand']);
let currentUser = null;

function redirectToLogin() {
  const next = encodeURIComponent('/dashboard.html');
  window.location.replace(`/login.html?next=${next}`);
}

function learnUrl(course, lesson) {
  const base = `/learn.html?slug=${encodeURIComponent(course.slug)}`;
  return lesson ? `${base}&lesson=${encodeURIComponent(lesson.id)}` : base;
}

function completedSet(enrollment) {
  return new Set(enrollment.progress?.completedLessonIds || []);
}

function nextLesson(enrollment) {
  const completed = completedSet(enrollment);
  const lessons = enrollment.course.lessons || [];

  return (
    lessons.find((lesson) => !completed.has(lesson.id)) ||
    lessons[lessons.length - 1] ||
    null
  );
}

function renderUser(user) {
  const firstName = String(user.name || 'learner').split(/\s+/)[0];

  if (userFirstName) userFirstName.textContent = firstName;
  if (userName) userName.textContent = user.name;
  if (userRole) userRole.textContent = user.role;
  if (userInitials) userInitials.textContent = initials(user.name);
  if (instructorPanel) instructorPanel.hidden = user.role !== 'instructor';

  document.title = `Dashboard — ${user.name} — LearnLoop`;
}

function renderStats(enrollments) {
  const completedLessons = enrollments.reduce(
    (total, enrollment) => total + (enrollment.progress?.completedLessons || 0),
    0
  );
  const minutes = enrollments.reduce(
    (total, enrollment) => total + (enrollment.progress?.minutesLearned || 0),
    0
  );
  const average = enrollments.length
    ? Math.round(
        enrollments.reduce(
          (total, enrollment) => total + (enrollment.progress?.percent || 0),
          0
        ) / enrollments.length
      )
    : 0;

  if (statCourses) statCourses.textContent = String(enrollments.length);
  if (statLessons) statLessons.textContent = String(completedLessons);
  if (statMinutes) statMinutes.textContent = formatMinutes(minutes);
  if (statProgress) statProgress.textContent = `${average}%`;

  if (subtitle) {
    if (!enrollments.length) {
      subtitle.textContent =
        'Your library is empty for now. Pick a course and start your first loop.';
    } else if (enrollments.length === 1) {
      subtitle.textContent = 'You have one course in progress. One lesson today is still a win.';
    } else {
      subtitle.textContent = `You have ${enrollments.length} courses in your library. Pick up the next small step.`;
    }
  }
}

function renderContinue(enrollments) {
  if (!continueSlot) return;

  if (!enrollments.length) {
    continueSlot.innerHTML = `
      <div class="dashboard-start">
        <div>
          <p class="eyebrow">Start here</p>
          <h2>Your first loop is waiting.</h2>
          <p>Pick a course, finish one short lesson, and give yourself a place to come back to.</p>
          <a class="button button-primary" href="/courses.html">Browse the catalog</a>
        </div>
        <span class="dashboard-start-mark" aria-hidden="true">↻</span>
      </div>
    `;
    return;
  }

  const active =
    enrollments.find((enrollment) => (enrollment.progress?.percent || 0) < 100) ||
    enrollments[0];

  if (!active) {
    continueSlot.innerHTML = '';
    return;
  }

  const course = active.course;
  const accent = accents.has(course.accent) ? course.accent : 'mint';
  const code = courseCode(course.category);
  const progress = active.progress || { percent: 0 };
  const lesson = nextLesson(active);
  const isComplete = progress.percent === 100;

  continueSlot.innerHTML = `
    <article class="continue-card">
      <div class="continue-cover accent-${accent}">
        <span class="mono">${isComplete ? 'Complete' : 'Continue'}</span>
        <strong>${code}</strong>
        <span>${escapeHtml(course.category)}</span>
      </div>
      <div class="continue-body">
        <p class="eyebrow">${isComplete ? 'A course finished' : 'Pick up where you left off'}</p>
        <h2>${escapeHtml(course.title)}</h2>
        <p>${
          isComplete
            ? 'You completed every lesson. Revisit a lesson whenever you want a refresher.'
            : lesson
              ? `Next: ${escapeHtml(lesson.title)} · ${Number(lesson.duration) || 0} min`
              : 'Open the course to keep learning.'
        }</p>
        <div class="continue-progress-head">
          <span>${progress.completedLessons || 0} of ${progress.totalLessons || 0} lessons</span>
          <strong>${progress.percent || 0}%</strong>
        </div>
        <div class="progress-track"><span style="width:${Math.min(100, progress.percent || 0)}%"></span></div>
      </div>
      <div class="continue-actions">
        <a class="button button-primary" href="${learnUrl(course, lesson)}">
          ${isComplete ? 'Review course' : 'Continue learning'}
        </a>
        <a class="text-link" href="/course.html?slug=${encodeURIComponent(course.slug)}">Course details</a>
      </div>
    </article>
  `;
}

function renderMyCourses(enrollments) {
  if (!myCourses) return;

  if (!enrollments.length) {
    myCourses.innerHTML = '';
    if (coursesEmpty) coursesEmpty.hidden = false;
    return;
  }

  if (coursesEmpty) coursesEmpty.hidden = true;

  myCourses.innerHTML = enrollments
    .map((enrollment) => {
      const course = enrollment.course;
      const accent = accents.has(course.accent) ? course.accent : 'mint';
      const progress = enrollment.progress || { percent: 0 };
      const lesson = nextLesson(enrollment);
      const isComplete = progress.percent === 100;

      return `
        <article class="dashboard-course">
          <a
            class="dashboard-course-cover accent-${accent}"
            href="/course.html?slug=${encodeURIComponent(course.slug)}"
            aria-label="${escapeHtml(course.title)}"
          >
            <strong>${courseCode(course.category)}</strong>
            <span>${escapeHtml(course.category)}</span>
          </a>
          <div class="dashboard-course-body">
            <p>${escapeHtml(course.level)} · ${course.lessonCount} lessons</p>
            <h3>
              <a href="/course.html?slug=${encodeURIComponent(course.slug)}">${escapeHtml(course.title)}</a>
            </h3>
            <div class="dash-course-progress-head">
              <span>${progress.completedLessons || 0} / ${progress.totalLessons || 0}</span>
              <strong>${progress.percent || 0}%</strong>
            </div>
            <div class="progress-track"><span style="width:${Math.min(100, progress.percent || 0)}%"></span></div>
            <a class="dashboard-course-link" href="${learnUrl(course, lesson)}">
              ${isComplete ? 'Review lessons' : 'Continue'} →
            </a>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderRecommended(courses, enrollments) {
  if (!recommended) return;

  const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.course.id));
  const options = courses.filter((course) => !enrolledIds.has(course.id)).slice(0, 3);

  if (!options.length) {
    recommended.innerHTML = `
      <div class="dashboard-empty">
        <span class="dashboard-empty-mark">✓</span>
        <h3>You are enrolled in everything.</h3>
        <p>That is a good problem to have. Revisit a course or keep building.</p>
        <a class="button button-secondary" href="/courses.html">Browse the catalog</a>
      </div>
    `;
    return;
  }

  recommended.innerHTML = options.map(courseCard).join('');
}

function renderDashboardError(message) {
  if (continueSlot) {
    continueSlot.innerHTML = `
      <div class="dashboard-error">
        <span class="dashboard-error-mark">!</span>
        <div>
          <strong>Your dashboard could not load.</strong>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  if (myCourses) myCourses.innerHTML = '';
  if (coursesEmpty) coursesEmpty.hidden = true;
  if (subtitle) subtitle.textContent = 'We could not load your learning data right now.';
}

async function loadDashboard() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    redirectToLogin();
    return;
  }

  renderUser(currentUser);

  const [enrollmentResult, courseResult] = await Promise.allSettled([
    api('/api/enrollments/me'),
    api('/api/courses')
  ]);

  if (
    enrollmentResult.status === 'rejected' &&
    enrollmentResult.reason?.status === 401
  ) {
    redirectToLogin();
    return;
  }

  let enrollments = [];

  if (enrollmentResult.status === 'fulfilled') {
    enrollments = Array.isArray(enrollmentResult.value.enrollments)
      ? enrollmentResult.value.enrollments
      : [];
  } else {
    renderDashboardError(
      enrollmentResult.reason?.status === 503
        ? 'The database is not connected yet. Add MONGODB_URI to backend/.env and run npm run seed.'
        : enrollmentResult.reason?.message || 'Please refresh the page and try again.'
    );
  }

  if (enrollmentResult.status === 'fulfilled') {
    renderStats(enrollments);
    renderContinue(enrollments);
    renderMyCourses(enrollments);
  }

  let courses = [];

  if (courseResult.status === 'fulfilled') {
    courses = Array.isArray(courseResult.value.courses)
      ? courseResult.value.courses
      : [];
    renderRecommended(courses, enrollments);
  } else if (recommended) {
    recommended.innerHTML = `
      <div class="dashboard-empty">
        <span class="dashboard-empty-mark">↻</span>
        <h3>The catalog is taking a short break.</h3>
        <p>${escapeHtml(
          courseResult.reason?.status === 503
            ? 'Connect MongoDB and run npm run seed to load course recommendations.'
            : courseResult.reason?.message || 'Please try again in a moment.'
        )}</p>
      </div>
    `;
  }
}

logoutButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Logging out…';

    try {
      await api('/api/auth/logout', { method: 'POST' });
      window.location.assign('/index.html');
    } catch {
      button.disabled = false;
      button.textContent = 'Log out';
      showToast('Could not log out. Please try again.', { tone: 'error' });
    }
  });
});

loadDashboard();
