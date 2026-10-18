import { getProgress } from './progress.js';

function instructorOf(course) {
  const instructor = course?.instructor;
  if (!instructor) return null;
  if (instructor.name) {
    return {
      id: instructor._id?.toString() || instructor.id,
      name: instructor.name,
      headline: instructor.headline || ''
    };
  }
  return { id: instructor.toString(), name: 'LearnLoop instructor', headline: '' };
}

export function serializeCourse(course, options = {}) {
  const {
    includeLessons = false,
    includeContent = false,
    enrollment = null,
    isOwner = false
  } = options;

  const lessonCount = course.lessons?.length || 0;
  const totalMinutes =
    course.lessons?.reduce((total, lesson) => total + (lesson.duration || 0), 0) || 0;

  const payload = {
    id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    tagline: course.tagline,
    description: course.description,
    category: course.category,
    level: course.level,
    price: course.price,
    accent: course.accent,
    outcomes: course.outcomes || [],
    requirements: course.requirements || [],
    rating: course.rating,
    reviewCount: course.reviewCount,
    lessonCount,
    totalMinutes,
    published: course.published,
    instructor: instructorOf(course),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    isOwner,
    enrolled: Boolean(enrollment),
    lastLessonId: enrollment?.lastLessonId?.toString() || null,
    progress: getProgress(course, enrollment)
  };

  if (includeLessons) {
    payload.lessons = (course.lessons || []).map((lesson, index) => ({
      id: lesson._id.toString(),
      number: index + 1,
      title: lesson.title,
      summary: lesson.summary || '',
      duration: lesson.duration,
      ...(includeContent ? { content: lesson.content || [] } : {})
    }));
  }

  return payload;
}
