import { api, initials } from './api.js';
import {
  courseCode,
  escapeHtml,
  formatMinutes
} from './course-card.js';
import { setButtonLoading, showToast } from './ui.js';

const page = document.querySelector('[data-course-page]');
const slug = new URLSearchParams(window.location.search).get('slug');
const accents = new Set(['mint', 'sun', 'sky', 'rose', 'violet', 'sand']);

function formatReviews(count) {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(Number(count) || 0);
}

function learnUrl(course, lessonId) {
  const base = `/learn.html?slug=${encodeURIComponent(course.slug)}`;
  return lessonId ? `${base}&lesson=${encodeURIComponent(lessonId)}` : base;
}

function renderError(title, message, status = 0) {
  if (!page) return;

  page.innerHTML = `
    <div class="course-error">
      <p class="eyebrow">${status === 404 ? 'Course not found' : 'Something interrupted the loop'}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <div class="course-error-actions">
        <a class="button button-primary" href="/courses.html">Browse courses</a>
        <a class="button button-secondary" href="/index.html">Return home</a>
      </div>
    </div>
  `;
}

function renderCourse(course) {
  if (!page) return;

  document.title = `${course.title} — LearnLoop`;

  const accent = accents.has(course.accent) ? course.accent : 'mint';
  const code = courseCode(course.category);
  const instructor = course.instructor || {
    name: 'LearnLoop instructor',
    headline: ''
  };
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const progress = course.progress || {
    percent: 0,
    completedLessons: 0,
    totalLessons: lessons.length,
    completedLessonIds: []
  };
  const completed = new Set(progress.completedLessonIds || []);
  const isFree = !course.price || Number(course.price) === 0;
  const level = escapeHtml(course.level);
  const category = escapeHtml(course.category);
  const title = escapeHtml(course.title);
  const tagline = escapeHtml(course.tagline);
  const description = escapeHtml(course.description);
  const rating = Number(course.rating || 0).toFixed(1);
  const reviewCount = formatReviews(course.reviewCount);
  const firstIncomplete = lessons.find((lesson) => !completed.has(lesson.id));
  const lastLesson = lessons.find((lesson) => lesson.id === course.lastLessonId);
  const resumeLesson = firstIncomplete || lastLesson || lessons[0];
  const canOpenLessons = course.enrolled || course.isOwner;

  const outcomes = (course.outcomes || [])
    .map(
      (outcome) => `
        <li>
          <span class="outcome-check" aria-hidden="true">✓</span>
          <span>${escapeHtml(outcome)}</span>
        </li>
      `
    )
    .join('');

  const requirements = (course.requirements || [])
    .map((requirement) => `<li>${escapeHtml(requirement)}</li>`)
    .join('');

  const curriculum = lessons
    .map((lesson) => {
      const isComplete = completed.has(lesson.id);
      const content = `
        <span class="lesson-number">${isComplete ? '✓' : String(lesson.number).padStart(2, '0')}</span>
        <span>
          <span class="lesson-item-title">${escapeHtml(lesson.title)}</span>
          <span class="lesson-item-summary">${escapeHtml(lesson.summary || '')}</span>
        </span>
        <span class="lesson-item-duration">${Number(lesson.duration) || 0} min</span>
      `;

      if (!canOpenLessons) {
        return `<div class="curriculum-item${isComplete ? ' is-complete' : ''}">${content}</div>`;
      }

      return `
        <a class="curriculum-item${isComplete ? ' is-complete' : ''}" href="${learnUrl(course, lesson.id)}">
          ${content}
        </a>
      `;
    })
    .join('');

  const progressBlock = course.enrolled
    ? `
      <div class="enroll-progress">
        <div class="enroll-progress-head">
          <span>Your progress</span>
          <strong>${progress.percent}%</strong>
        </div>
        <div class="progress-track"><span class="progress-value" style="width:${Math.min(100, progress.percent)}%"></span></div>
      </div>
    `
    : '';

  const primaryAction = course.isOwner
    ? `
      <a class="button button-primary" href="/studio.html">Open instructor studio</a>
      <span class="enroll-owner">You teach this course. Lessons open without enrolling.</span>
    `
    : course.enrolled
      ? `
        <a class="button button-primary" href="${learnUrl(course, resumeLesson?.id)}">
          ${progress.percent === 100 ? 'Review course' : 'Continue learning'}
        </a>
        <p class="enroll-note">Your progress is saved automatically.</p>
      `
      : `
        <button class="button button-primary" type="button" data-enroll>
          ${isFree ? 'Enroll free' : `Enroll — $${Number(course.price)}`}
        </button>
        <p class="enroll-note">No payment is taken in this student project.</p>
      `;

  page.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/courses.html">Courses</a>
      <span class="breadcrumb-separator" aria-hidden="true">/</span>
      <span aria-current="page">${category}</span>
    </nav>

    <div class="course-hero-grid">
      <div class="course-main">
        <div class="detail-cover accent-${accent}">
          <span class="detail-cover-tag">${category}</span>
          <span class="detail-cover-code">${code}</span>
          <span class="detail-cover-bottom">${level} · ${lessons.length} lessons</span>
        </div>

        <div class="course-title-block">
          <div class="course-kicker">
            <span class="pill">${category}</span>
            <span class="pill">${level}</span>
            <span class="pill">${isFree ? 'Free' : `$${Number(course.price)}`}</span>
          </div>
          <h1>${title}</h1>
          <p class="course-tagline">${tagline}</p>
          <div class="detail-meta">
            <span class="meta-rating"><span aria-hidden="true">★</span> ${rating} <span>(${reviewCount} reviews)</span></span>
            <span>${lessons.length} lessons</span>
            <span>${formatMinutes(course.totalMinutes)}</span>
            <span>Created by ${escapeHtml(instructor.name)}</span>
          </div>
        </div>

        <div class="course-description course-content-section">
          <h2>About this course</h2>
          <p>${description}</p>
        </div>

        ${
          outcomes
            ? `<section class="course-content-section">
                <h2>What you will learn</h2>
                <ul class="outcomes-grid">${outcomes}</ul>
              </section>`
            : ''
        }

        ${
          requirements
            ? `<section class="course-content-section">
                <h2>Before you start</h2>
                <ul class="requirements-list">${requirements}</ul>
              </section>`
            : ''
        }

        <section class="course-content-section">
          <div class="curriculum-head">
            <h2>Curriculum</h2>
            <span>${lessons.length} lessons · ${formatMinutes(course.totalMinutes)}</span>
          </div>
          <div class="curriculum-list">${curriculum}</div>
        </section>

        <section class="instructor-panel">
          <span class="instructor-avatar-lg">${escapeHtml(initials(instructor.name))}</span>
          <div>
            <span class="mono">Your instructor</span>
            <h3>${escapeHtml(instructor.name)}</h3>
            <p>${escapeHtml(instructor.headline || 'LearnLoop instructor')}</p>
          </div>
        </section>
      </div>

      <aside class="course-sidebar" aria-label="Enrollment">
        <div class="enroll-card">
          <div class="enroll-price">
            <strong>${isFree ? 'Free' : `$${Number(course.price)}`}</strong>
            <span>${isFree ? 'Full course access' : 'One-time payment'}</span>
          </div>

          ${primaryAction}
          ${progressBlock}

          <ul class="includes-list">
            <li><span>Lessons</span><strong>${lessons.length}</strong></li>
            <li><span>Total time</span><strong>${formatMinutes(course.totalMinutes)}</strong></li>
            <li><span>Level</span><strong>${level}</strong></li>
            <li><span>Access</span><strong>Learn at your pace</strong></li>
            <li><span>Progress</span><strong>Saved automatically</strong></li>
          </ul>
        </div>
      </aside>
    </div>
  `;

  const enrollButton = page.querySelector('[data-enroll]');

  enrollButton?.addEventListener('click', async () => {
    setButtonLoading(enrollButton, true, 'Enrolling…');

    try {
      const data = await api(`/api/courses/${course.id}/enroll`, {
        method: 'POST'
      });

      showToast('You are enrolled. Your first lesson is ready.');
      window.setTimeout(() => {
        window.location.assign(learnUrl(data.course, resumeLesson?.id));
      }, 350);
    } catch (error) {
      setButtonLoading(enrollButton, false);

      if (error.status === 401) {
        const next = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        );
        window.location.assign(`/login.html?next=${next}`);
        return;
      }

      showToast(error.message || 'Enrollment failed. Please try again.', {
        tone: 'error'
      });
    }
  });
}

async function loadCourse() {
  if (!slug) {
    window.location.replace('/courses.html');
    return;
  }

  try {
    const data = await api(`/api/courses/${encodeURIComponent(slug)}`);
    renderCourse(data.course);
  } catch (error) {
    if (error.status === 404) {
      renderError(
        'That course is not here.',
        'It may have been moved, unpublished, or never existed. Browse the catalog for something else.',
        404
      );
      return;
    }

    if (error.status === 503) {
      renderError(
        'The catalog is taking a short break.',
        'The database is not connected yet. Add MONGODB_URI to backend/.env and run npm run seed.',
        503
      );
      return;
    }

    renderError(
      'We could not open this course.',
      error.message || 'Please refresh the page or try again in a moment.'
    );
  }
}

loadCourse();
