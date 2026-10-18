import { api } from './api.js';
import { escapeHtml } from './course-card.js';
import { showToast } from './ui.js';

const shell = document.querySelector('[data-learn-shell]');
const sidebar = document.querySelector('[data-learn-sidebar]');
const lessonList = document.querySelector('[data-lesson-list]');
const article = document.querySelector('[data-lesson-article]');
const courseTitle = document.querySelector('[data-learn-title]');
const progressLabel = document.querySelector('[data-learn-progress-label]');
const progressCount = document.querySelector('[data-learn-progress-count]');
const progressBar = document.querySelector('[data-learn-progress-bar]');
const courseLink = document.querySelector('[data-learn-course-link]');
const lessonToggle = document.querySelector('[data-lesson-toggle]');

const slug = new URLSearchParams(window.location.search).get('slug');

let course = null;
let activeLessonId = null;
let initialRender = true;

function currentProgress() {
  return (
    course?.progress || {
      percent: 0,
      completedLessons: 0,
      totalLessons: course?.lessons?.length || 0,
      completedLessonIds: []
    }
  );
}

function completedSet() {
  return new Set(currentProgress().completedLessonIds || []);
}

function courseUrl() {
  return `/course.html?slug=${encodeURIComponent(course.slug)}`;
}

function closeLessonList() {
  lessonList?.classList.remove('is-open');
  lessonToggle?.setAttribute('aria-expanded', 'false');
  if (lessonToggle) lessonToggle.textContent = 'Show lessons';
}

function renderEmpty(title, message, actions = '') {
  shell?.classList.add('is-single');

  if (article) {
    article.innerHTML = `
      <div class="learn-empty">
        <p class="eyebrow">Learning pause</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <div class="learn-empty-actions">${actions}</div>
      </div>
    `;
  }
}

function updateProgressDisplay() {
  const progress = currentProgress();
  const percent = Math.min(100, Math.max(0, Number(progress.percent) || 0));

  if (progressLabel) progressLabel.textContent = `${percent}% complete`;
  if (progressCount) {
    progressCount.textContent = `${progress.completedLessons} / ${progress.totalLessons}`;
  }
  if (progressBar) progressBar.style.width = `${percent}%`;
}

function renderSidebar() {
  if (!course || !lessonList) return;

  const completed = completedSet();

  if (courseTitle) courseTitle.textContent = course.title;
  if (courseLink) courseLink.href = courseUrl();

  lessonList.innerHTML = course.lessons
    .map((lesson) => {
      const isComplete = completed.has(lesson.id);
      const isActive = lesson.id === activeLessonId;

      return `
        <button
          class="lesson-nav-item${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}"
          type="button"
          data-lesson-id="${escapeHtml(lesson.id)}"
          ${isActive ? 'aria-current="true"' : ''}
        >
          <span class="lesson-nav-index">${isComplete ? '✓' : String(lesson.number).padStart(2, '0')}</span>
          <span class="lesson-nav-title">${escapeHtml(lesson.title)}</span>
          <span class="lesson-nav-duration">${Number(lesson.duration) || 0}m</span>
        </button>
      `;
    })
    .join('');

  lessonList.querySelectorAll('[data-lesson-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectLesson(button.dataset.lessonId);
    });
  });

  updateProgressDisplay();
}

function currentLesson() {
  return course?.lessons?.find((lesson) => lesson.id === activeLessonId) || null;
}

function renderLesson(options = {}) {
  const lesson = currentLesson();
  if (!lesson || !article) return;

  const progress = currentProgress();
  const completed = completedSet();
  const isComplete = completed.has(lesson.id);
  const index = course.lessons.findIndex((item) => item.id === lesson.id);
  const previous = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const canTrack = course.enrolled && !course.isOwner;

  document.title = `${lesson.title} — ${course.title} — LearnLoop`;

  article.innerHTML = `
    <p class="lesson-kicker"><span aria-hidden="true"></span> Lesson ${lesson.number} of ${course.lessons.length}</p>
    <h1>${escapeHtml(lesson.title)}</h1>
    <p class="lesson-summary">${escapeHtml(lesson.summary || '')}</p>

    <div class="lesson-meta-row">
      <span>${Number(lesson.duration) || 0} min read</span>
      <span>${escapeHtml(course.category)}</span>
      <span>${escapeHtml(course.level)}</span>
      <span class="pill">${isComplete ? 'Completed' : 'In progress'}</span>
    </div>

    <div class="lesson-content" data-lesson-content></div>

    <div class="lesson-actions">
      ${
        canTrack
          ? `<button
               class="button complete-button${isComplete ? ' is-complete' : ' button-primary'}"
               type="button"
               data-complete
             >
               ${isComplete ? '✓ Completed — click to undo' : 'Mark lesson complete'}
             </button>`
          : `<span class="pill">${course.isOwner ? 'Instructor preview' : 'Enrolled learners only'}</span>`
      }

      <div class="lesson-nav-buttons">
        <button class="button button-secondary" type="button" data-prev ${previous ? '' : 'disabled'}>
          ← Previous
        </button>
        <button class="button button-secondary" type="button" data-next ${next ? '' : 'disabled'}>
          Next →
        </button>
      </div>
    </div>

    ${
      progress.percent === 100 && canTrack
        ? `<div class="completion-banner">
             <strong aria-hidden="true">✓</strong>
             <span>You finished every lesson in this course. That is a real win — go build something with it.</span>
           </div>`
        : ''
    }
  `;

  const content = article.querySelector('[data-lesson-content]');
  if (content) {
    const paragraphs = Array.isArray(lesson.content) ? lesson.content : [];
    if (paragraphs.length) {
      for (const paragraph of paragraphs) {
        const element = document.createElement('p');
        element.textContent = paragraph;
        content.append(element);
      }
    } else {
      const element = document.createElement('p');
      element.textContent = 'The lesson content is being prepared.';
      content.append(element);
    }
  }

  article.querySelector('[data-prev]')?.addEventListener('click', () => {
    if (previous) selectLesson(previous.id);
  });

  article.querySelector('[data-next]')?.addEventListener('click', () => {
    if (next) selectLesson(next.id);
  });

  article.querySelector('[data-complete]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Saving…';

    try {
      const data = await api(
        `/api/enrollments/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(
          lesson.id
        )}`,
        {
          method: 'PUT',
          body: { completed: !isComplete }
        }
      );

      course.progress = data.progress;
      renderSidebar();
      renderLesson({ replace: true });
      showToast(data.completed ? 'Lesson complete. Keep the loop going.' : 'Lesson marked as incomplete.');
    } catch (error) {
      button.disabled = false;
      button.textContent = isComplete ? '✓ Completed — click to undo' : 'Mark lesson complete';

      if (error.status === 401) {
        window.location.assign(
          `/login.html?next=${encodeURIComponent(
            `${window.location.pathname}${window.location.search}`
          )}`
        );
        return;
      }

      showToast(error.message || 'Could not save your progress.', { tone: 'error' });
    }
  });

  updateProgressDisplay();
  updateUrl(options.replace);
}

function updateUrl(replace = false) {
  if (!course || !activeLessonId) return;

  const query = new URLSearchParams({
    slug: course.slug,
    lesson: activeLessonId
  });
  const url = `${window.location.pathname}?${query}`;
  const nextState = { lesson: activeLessonId };

  if (replace || initialRender) {
    window.history.replaceState(nextState, '', url);
    initialRender = false;
  } else {
    window.history.pushState(nextState, '', url);
  }
}

function selectLesson(lessonId, options = {}) {
  const lesson = course?.lessons?.find((item) => item.id === lessonId);
  if (!lesson) return;

  activeLessonId = lesson.id;
  renderSidebar();
  renderLesson(options);
  closeLessonList();

  if (course.enrolled) {
    api(`/api/enrollments/${encodeURIComponent(course.id)}`, {
      method: 'PATCH',
      body: { lastLessonId: lesson.id }
    }).catch(() => {
      // Saving the resume point is a convenience, not a blocker.
    });
  }

  if (!options.replace) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function chooseInitialLesson() {
  const queryLesson = new URLSearchParams(window.location.search).get('lesson');
  const completed = completedSet();
  const lessons = course.lessons || [];

  return (
    lessons.find((lesson) => lesson.id === queryLesson) ||
    lessons.find((lesson) => lesson.id === course.lastLessonId) ||
    lessons.find((lesson) => !completed.has(lesson.id)) ||
    lessons[0]
  );
}

function bindLessonToggle() {
  lessonToggle?.addEventListener('click', () => {
    const open = lessonList?.classList.toggle('is-open');
    lessonToggle.setAttribute('aria-expanded', String(Boolean(open)));
    lessonToggle.textContent = open ? 'Hide lessons' : 'Show lessons';
  });
}

async function loadCourse() {
  if (!slug) {
    window.location.replace('/courses.html');
    return;
  }

  try {
    const data = await api(`/api/courses/${encodeURIComponent(slug)}/learn`);
    course = data.course;

    if (!course.lessons?.length) {
      renderEmpty(
        'This course has no lessons yet.',
        'The instructor is still building it. Check back soon or browse another course.',
        `<a class="button button-primary" href="/courses.html">Browse courses</a>`
      );
      return;
    }

    const initialLesson = chooseInitialLesson();
    activeLessonId = initialLesson.id;

    renderSidebar();
    renderLesson({ replace: true });
  } catch (error) {
    if (error.status === 401) {
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      );
      window.location.replace(`/login.html?next=${next}`);
      return;
    }

    if (error.status === 403 && slug) {
      renderEmpty(
        'Enroll to open the lessons.',
        'This course is free. Open the course page, enroll, and come back to start learning.',
        `<a class="button button-primary" href="/course.html?slug=${encodeURIComponent(
          slug
        )}">View the course</a>
         <a class="button button-secondary" href="/courses.html">Browse courses</a>`
      );
      return;
    }

    if (error.status === 404) {
      renderEmpty(
        'This course is not here.',
        'It may have been unpublished or moved. Browse the catalog for another path.',
        `<a class="button button-primary" href="/courses.html">Browse courses</a>`
      );
      return;
    }

    renderEmpty(
      'We could not open this lesson.',
      error.status === 503
        ? 'The database is not connected yet. Add MONGODB_URI to backend/.env and run npm run seed.'
        : error.message || 'Please refresh the page or try again.',
      `<a class="button button-primary" href="/courses.html">Browse courses</a>`
    );
  }
}

window.addEventListener('popstate', () => {
  if (!course) return;

  const lessonId = new URLSearchParams(window.location.search).get('lesson');
  if (lessonId && course.lessons.some((lesson) => lesson.id === lessonId)) {
    activeLessonId = lessonId;
    renderSidebar();
    renderLesson({ replace: true });
  }
});

bindLessonToggle();
loadCourse();
