import { api, getCurrentUser } from './api.js';
import {
  courseCode,
  escapeHtml,
  formatMinutes
} from './course-card.js';
import { setButtonLoading, showToast } from './ui.js';

const loading = document.querySelector('[data-studio-loading]');
const denied = document.querySelector('[data-studio-denied]');
const content = document.querySelector('[data-studio-content]');
const errorPanel = document.querySelector('[data-studio-error]');
const gate = document.querySelector('[data-studio-gate]');
const accessForm = document.querySelector('[data-studio-access-form]');
const accessError = document.querySelector('[data-access-error]');

const courseStats = {
  courses: document.querySelector('[data-studio-stat-courses]'),
  published: document.querySelector('[data-studio-stat-published]'),
  lessons: document.querySelector('[data-studio-stat-lessons]'),
  students: document.querySelector('[data-studio-stat-students]')
};

const courseList = document.querySelector('[data-studio-courses]');
const courseCount = document.querySelector('[data-studio-count]');
const emptyState = document.querySelector('[data-studio-empty]');
const createPanel = document.querySelector('[data-create-panel]');
const managePanel = document.querySelector('[data-manage-panel]');
const courseForm = document.querySelector('[data-course-form]');
const courseFormError = document.querySelector('[data-course-form-error]');
const lessonForm = document.querySelector('[data-lesson-form]');
const lessonFormError = document.querySelector('[data-lesson-form-error]');
const newCourseButtons = [...document.querySelectorAll('[data-new-course]')];
const togglePublishButton = document.querySelector('[data-toggle-publish]');
const deleteCourseButton = document.querySelector('[data-delete-course]');
const previewCourse = document.querySelector('[data-preview-course]');

const manageTitle = document.querySelector('[data-manage-title]');
const manageStatus = document.querySelector('[data-manage-status]');
const manageLessons = document.querySelector('[data-manage-lessons]');
const manageStudents = document.querySelector('[data-manage-students]');
const manageMinutes = document.querySelector('[data-manage-minutes]');
const studioLessons = document.querySelector('[data-studio-lessons]');

const accents = new Set(['mint', 'sun', 'sky', 'rose', 'violet', 'sand']);
const MAX_OUTCOMES = 12;

let user = null;
let courses = [];
let selectedCourseId = null;

function redirectToLogin() {
  window.location.href = `/login.html?next=${encodeURIComponent('/studio.html')}`;
}

function setError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

function showGate(message = '') {
  if (loading) loading.hidden = true;
  if (content) content.hidden = true;
  if (denied) denied.hidden = true;
  if (errorPanel) errorPanel.hidden = true;
  if (gate) gate.hidden = false;

  setError(accessError, message);
  document.querySelector('#studio-access-code')?.focus();
}

function showDenied() {
  if (loading) loading.hidden = true;
  if (content) content.hidden = true;
  if (errorPanel) errorPanel.hidden = true;
  if (gate) gate.hidden = true;
  if (denied) denied.hidden = false;
}

function showStudioError(message) {
  if (loading) loading.hidden = true;
  if (content) content.hidden = true;
  if (denied) denied.hidden = true;
  if (gate) gate.hidden = true;

  if (errorPanel) {
    errorPanel.hidden = false;
    errorPanel.innerHTML = `
      <span class="studio-denied-mark">!</span>
      <p class="eyebrow">Studio unavailable</p>
      <h2>We could not open the studio.</h2>
      <p>${escapeHtml(message)}</p>
      <div class="studio-denied-actions">
        <a class="button button-primary" href="/dashboard.html">Go to dashboard</a>
        <a class="button button-secondary" href="/courses.html">Browse courses</a>
      </div>
    `;
  }
}

function showContent() {
  if (loading) loading.hidden = true;
  if (denied) denied.hidden = true;
  if (errorPanel) errorPanel.hidden = true;
  if (gate) gate.hidden = true;
  if (content) content.hidden = false;
}

function formatDate(date) {
  if (!date) return 'Recently updated';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

function lines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_OUTCOMES);
}

function paragraphs(value) {
  return String(value || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function updateStats() {
  const published = courses.filter((course) => course.published).length;
  const lessons = courses.reduce(
    (total, course) => total + (course.lessonCount || 0),
    0
  );
  const students = courses.reduce(
    (total, course) => total + (course.students || 0),
    0
  );

  if (courseStats.courses) courseStats.courses.textContent = String(courses.length);
  if (courseStats.published) courseStats.published.textContent = String(published);
  if (courseStats.lessons) courseStats.lessons.textContent = String(lessons);
  if (courseStats.students) courseStats.students.textContent = String(students);

  if (courseCount) {
    courseCount.textContent = `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`;
  }
}

function renderCourseList() {
  if (!courseList) return;

  if (!courses.length) {
    courseList.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  courseList.innerHTML = courses
    .map((course) => {
      const accent = accents.has(course.accent) ? course.accent : 'mint';
      const selected = course.id === selectedCourseId;

      return `
        <article class="studio-course${selected ? ' is-selected' : ''}">
          <div class="studio-course-cover accent-${accent}">
            <strong>${courseCode(course.category)}</strong>
            <span>${escapeHtml(course.category)}</span>
          </div>
          <div class="studio-course-body">
            <div class="studio-course-status">
              <span class="pill ${course.published ? 'status-published' : 'status-draft'}">
                ${course.published ? 'Published' : 'Draft'}
              </span>
              <span class="mono">Updated ${formatDate(course.updatedAt)}</span>
            </div>
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.tagline)}</p>
            <div class="studio-course-meta">
              <span>${course.lessonCount} lessons</span>
              <span>${course.students || 0} students</span>
              <span>${formatMinutes(course.totalMinutes)}</span>
            </div>
          </div>
          <div class="studio-course-actions">
            <button class="button button-secondary" type="button" data-manage-course="${course.id}">
              Manage
            </button>
            <a class="button button-ghost" href="/course.html?slug=${encodeURIComponent(course.slug)}">
              Preview
            </a>
          </div>
        </article>
      `;
    })
    .join('');

  courseList.querySelectorAll('[data-manage-course]').forEach((button) => {
    button.addEventListener('click', () => selectCourse(button.dataset.manageCourse));
  });
}

function renderManage(course) {
  if (!course || !managePanel) return;

  if (createPanel) createPanel.hidden = true;
  managePanel.hidden = false;

  if (manageTitle) manageTitle.textContent = course.title;
  if (manageStatus) {
    manageStatus.textContent = course.published ? 'Published' : 'Draft';
    manageStatus.className = `pill ${course.published ? 'status-published' : 'status-draft'}`;
  }
  if (manageLessons) manageLessons.textContent = String(course.lessonCount || 0);
  if (manageStudents) manageStudents.textContent = String(course.students || 0);
  if (manageMinutes) manageMinutes.textContent = formatMinutes(course.totalMinutes);

  if (previewCourse) {
    previewCourse.href = `/course.html?slug=${encodeURIComponent(course.slug)}`;
  }

  if (togglePublishButton) {
    togglePublishButton.textContent = course.published ? 'Unpublish' : 'Publish';
    togglePublishButton.disabled = !course.published && !course.lessonCount;
    togglePublishButton.title =
      !course.published && !course.lessonCount
        ? 'Add at least one lesson before publishing.'
        : '';
  }

  if (studioLessons) {
    if (!course.lessons?.length) {
      studioLessons.innerHTML =
        '<p class="studio-lesson-empty">No lessons yet. Add the first one above.</p>';
    } else {
      studioLessons.innerHTML = course.lessons
        .map(
          (lesson) => `
            <div class="studio-lesson-row">
              <span class="studio-lesson-number">${String(lesson.number).padStart(2, '0')}</span>
              <span>
                <strong>${escapeHtml(lesson.title)}</strong>
                <small>${Number(lesson.duration) || 0} min</small>
              </span>
              <button
                class="lesson-delete"
                type="button"
                data-delete-lesson="${lesson.id}"
                aria-label="Delete ${escapeHtml(lesson.title)}"
              >
                Delete
              </button>
            </div>
          `
        )
        .join('');

      studioLessons.querySelectorAll('[data-delete-lesson]').forEach((button) => {
        button.addEventListener('click', () => deleteLesson(course, button.dataset.deleteLesson));
      });
    }
  }
}

function selectCourse(courseId) {
  const course = courses.find((item) => item.id === courseId);
  if (!course) return;

  selectedCourseId = course.id;
  renderCourseList();
  renderManage(course);
  managePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showCreatePanel() {
  selectedCourseId = null;
  renderCourseList();

  if (managePanel) managePanel.hidden = true;
  if (createPanel) createPanel.hidden = false;
  createPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector('#course-title')?.focus();
}

async function loadCourses(options = {}) {
  if (!options.silent && loading) loading.hidden = false;

  try {
    const data = await api('/api/instructor/courses');
    courses = Array.isArray(data.courses) ? data.courses : [];

    updateStats();
    renderCourseList();
    showContent();

    const selected = courses.find((course) => course.id === selectedCourseId);
    if (selected) {
      renderManage(selected);
    } else {
      selectedCourseId = null;
      if (managePanel) managePanel.hidden = true;
      if (createPanel) createPanel.hidden = false;
    }
  } catch (error) {
    if (error.status === 401) {
      redirectToLogin();
    } else if (error.status === 403) {
      showGate('Your instructor access expired. Enter the code again.');
    } else {
      showStudioError(
        error.status === 503
          ? 'The database is not connected yet. Add MONGODB_URI to backend/.env and run npm run seed.'
          : error.message || 'Please refresh the page and try again.'
      );
    }
  }
}

courseForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(courseFormError, '');

  const data = new FormData(courseForm);
  const values = {
    title: String(data.get('title') || '').trim(),
    tagline: String(data.get('tagline') || '').trim(),
    description: String(data.get('description') || '').trim(),
    category: String(data.get('category') || ''),
    level: String(data.get('level') || ''),
    accent: String(data.get('accent') || 'mint'),
    outcomes: lines(data.get('outcomes')),
    requirements: lines(data.get('requirements'))
  };

  if (values.title.length < 4 || values.tagline.length < 8 || values.description.length < 20) {
    setError(courseFormError, 'Add a title, a short tagline, and a description of at least 20 characters.');
    return;
  }

  if (!values.category || !values.level) {
    setError(courseFormError, 'Choose a category and a level.');
    return;
  }

  const submitButton = courseForm.querySelector('button[type="submit"]');
  setButtonLoading(submitButton, true, 'Creating draft…');

  try {
    const result = await api('/api/instructor/courses', {
      method: 'POST',
      body: values
    });

    courseForm.reset();
    selectedCourseId = result.course.id;
    await loadCourses({ silent: true });
    setButtonLoading(submitButton, false);
    showToast('Draft created. Add your first lesson next.');
    selectCourse(result.course.id);
  } catch (error) {
    setError(courseFormError, error.message || 'Could not create the course.');
    setButtonLoading(submitButton, false);
  }
});

lessonForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(lessonFormError, '');

  const course = courses.find((item) => item.id === selectedCourseId);
  if (!course) {
    setError(lessonFormError, 'Select a course first.');
    return;
  }

  const data = new FormData(lessonForm);
  const contentValue = paragraphs(data.get('content'));

  if (!contentValue.length) {
    setError(lessonFormError, 'Write at least one paragraph of lesson content.');
    return;
  }

  const values = {
    title: String(data.get('title') || '').trim(),
    summary: String(data.get('summary') || '').trim(),
    duration: Number(data.get('duration')) || 10,
    content: contentValue
  };

  if (values.title.length < 3) {
    setError(lessonFormError, 'Give the lesson a title of at least 3 characters.');
    return;
  }

  const submitButton = lessonForm.querySelector('button[type="submit"]');
  setButtonLoading(submitButton, true, 'Adding lesson…');

  try {
    await api(`/api/instructor/courses/${encodeURIComponent(course.id)}/lessons`, {
      method: 'POST',
      body: values
    });

    lessonForm.reset();
    document.querySelector('#lesson-duration').value = '10';
    await loadCourses({ silent: true });
    showToast('Lesson added to the curriculum.');
  } catch (error) {
    setError(lessonFormError, error.message || 'Could not add the lesson.');
  } finally {
    setButtonLoading(submitButton, false);
  }
});

togglePublishButton?.addEventListener('click', async () => {
  const course = courses.find((item) => item.id === selectedCourseId);
  if (!course) return;

  if (!course.published && !course.lessonCount) {
    showToast('Add at least one lesson before publishing.', { tone: 'error' });
    return;
  }

  togglePublishButton.disabled = true;
  togglePublishButton.textContent = course.published ? 'Unpublishing…' : 'Publishing…';

  try {
    await api(`/api/instructor/courses/${encodeURIComponent(course.id)}`, {
      method: 'PATCH',
      body: { published: !course.published }
    });

    await loadCourses({ silent: true });
    showToast(course.published ? 'Course moved back to draft.' : 'Course published.');
  } catch (error) {
    togglePublishButton.disabled = false;
    togglePublishButton.textContent = course.published ? 'Unpublish' : 'Publish';
    showToast(error.message || 'Could not update the course.', { tone: 'error' });
  }
});

async function deleteLesson(course, lessonId) {
  const lesson = course.lessons?.find((item) => item.id === lessonId);
  if (!lesson) return;

  if (!window.confirm(`Delete “${lesson.title}”? This cannot be undone.`)) return;

  try {
    await api(
      `/api/instructor/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(
        lessonId
      )}`,
      { method: 'DELETE' }
    );

    await loadCourses({ silent: true });
    showToast('Lesson deleted.');
  } catch (error) {
    showToast(error.message || 'Could not delete the lesson.', { tone: 'error' });
  }
}

deleteCourseButton?.addEventListener('click', async () => {
  const course = courses.find((item) => item.id === selectedCourseId);
  if (!course) return;

  if (
    !window.confirm(
      `Delete “${course.title}” and all of its lessons? Student enrollments for this course will also be removed.`
    )
  ) {
    return;
  }

  deleteCourseButton.disabled = true;

  try {
    await api(`/api/instructor/courses/${encodeURIComponent(course.id)}`, {
      method: 'DELETE'
    });

    selectedCourseId = null;
    if (managePanel) managePanel.hidden = true;
    if (createPanel) createPanel.hidden = false;
    await loadCourses({ silent: true });
    showToast('Course deleted.');
  } catch (error) {
    showToast(error.message || 'Could not delete the course.', { tone: 'error' });
  } finally {
    deleteCourseButton.disabled = false;
  }
});

newCourseButtons.forEach((button) => {
  button.addEventListener('click', showCreatePanel);
});

accessForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(accessError, '');

  const input = accessForm.querySelector('input[name="code"]');
  const code = String(new FormData(accessForm).get('code') || '').trim();

  if (!code) {
    setError(accessError, 'Enter the instructor access code.');
    input?.focus();
    return;
  }

  const submitButton = accessForm.querySelector('button[type="submit"]');
  setButtonLoading(submitButton, true, 'Checking access…');

  try {
    await api('/api/instructor/access', {
      method: 'POST',
      body: { code }
    });

    setButtonLoading(submitButton, false);
    if (gate) gate.hidden = true;
    await loadCourses();
    showToast('Studio unlocked for this session.');
  } catch (error) {
    setButtonLoading(submitButton, false);

    if (error.status === 401) {
      redirectToLogin();
      return;
    }

    setError(
      accessError,
      error.status === 429
        ? 'Too many attempts. Wait a few minutes and try again.'
        : error.message || 'Could not unlock the Studio.'
    );
    input?.select();
  }
});

async function init() {
  user = await getCurrentUser();

  if (!user) {
    redirectToLogin();
    return;
  }

  if (user.role !== 'instructor') {
    showDenied();
    return;
  }

  document.title = `Instructor Studio — ${user.name} — LearnLoop`;

  try {
    const access = await api('/api/instructor/access');

    if (!access.unlocked) {
      showGate();
      return;
    }

    await loadCourses();
  } catch (error) {
    if (error.status === 401) {
      redirectToLogin();
    } else if (error.status === 403) {
      showDenied();
    } else {
      showStudioError(
        error.status === 503
          ? 'The database is not connected yet. Add MONGODB_URI to backend/.env and run npm run seed.'
          : error.message || 'Please refresh the page and try again.'
      );
    }
  }
}

init();
