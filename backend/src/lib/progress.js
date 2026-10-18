export function getProgress(course, enrollment) {
  const lessons = course?.lessons || [];
  const totalLessons = lessons.length;
  const completedIds = new Set(
    (enrollment?.completedLessons || []).map((id) => id.toString())
  );

  const validCompleted = lessons.filter((lesson) =>
    completedIds.has(lesson._id.toString())
  );

  const percent =
    totalLessons === 0
      ? 0
      : Math.round((validCompleted.length / totalLessons) * 100);

  const minutesLearned = validCompleted.reduce(
    (total, lesson) => total + (lesson.duration || 0),
    0
  );
  const totalMinutes = lessons.reduce(
    (total, lesson) => total + (lesson.duration || 0),
    0
  );

  return {
    completedLessons: validCompleted.length,
    totalLessons,
    percent,
    minutesLearned,
    totalMinutes,
    completedLessonIds: validCompleted.map((lesson) => lesson._id.toString())
  };
}
