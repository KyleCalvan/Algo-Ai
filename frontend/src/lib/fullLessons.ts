import { BASIC_FULL_LESSONS } from './fullLessonsBasics';
import { ADVANCED_FULL_LESSONS } from './fullLessonsAdvanced';
import { EMERGING_FULL_LESSON } from './fullLessonEmerging';
import type { Lesson } from './lessons';

export const FULL_LESSONS: Record<string, Lesson> = {
  ...BASIC_FULL_LESSONS,
  ...ADVANCED_FULL_LESSONS,
  [EMERGING_FULL_LESSON.moduleId]: EMERGING_FULL_LESSON,
};
