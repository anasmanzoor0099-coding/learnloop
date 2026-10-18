const accents = new Set(['mint', 'sun', 'sky', 'rose', 'violet', 'sand']);

const courseCodes = {
  JavaScript: 'JS',
  'Web Development': 'WEB',
  Backend: 'API',
  Design: 'UI',
  Data: 'DATA',
  Career: 'JOB'
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function courseCode(category) {
  return courseCodes[category] || String(category || 'Course').slice(0, 3).toUpperCase();
}

export function formatMinutes(minutes) {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (!hours) return `${rest} min`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function courseCard(course) {
  const accent = accents.has(course.accent) ? course.accent : 'mint';
  const slug = encodeURIComponent(course.slug || '');
  const title = escapeHtml(course.title || 'Untitled course');
  const category = escapeHtml(course.category || 'Course');
  const level = escapeHtml(course.level || 'Beginner');
  const tagline = escapeHtml(course.tagline || course.description || '');
  const lessonCount = Number(course.lessonCount) || 0;
  const rating = Number(course.rating || 0).toFixed(1);
  const code = courseCode(course.category);
  const progress = Number(course.progress?.percent || 0);

  return `
    <article class="course-card">
      <a class="course-cover accent-${accent}" href="/course.html?slug=${slug}" aria-label="${title}">
        <span class="cover-tag">${category}</span>
        <span class="cover-mono">${code}</span>
        <span class="cover-ring"></span>
        <span class="cover-bottom">${level} · ${lessonCount} lessons</span>
      </a>
      <div class="course-body">
        <div class="course-meta"><span>${category}</span><span>${level}</span></div>
        <h3><a href="/course.html?slug=${slug}">${title}</a></h3>
        <p>${tagline}</p>
        ${
          progress > 0
            ? `<div class="card-progress"><span class="progress-track"><span style="width:${Math.min(100, progress)}%"></span></span><small>${progress}% complete</small></div>`
            : ''
        }
        <div class="course-footer">
          <span>${lessonCount} lessons</span>
          <span>${formatMinutes(course.totalMinutes)}</span>
          <span class="rating">★ ${rating}</span>
        </div>
      </div>
    </article>
  `;
}
