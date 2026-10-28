import type { Lesson, LessonSection } from './lessons';

type FullLessonInput = Omit<Lesson, 'readingTime' | 'reviewQuestions'> & { reviewer: NonNullable<Lesson['reviewer']> };

export function fullLesson(input: FullLessonInput): Lesson {
  const words = [input.description, ...input.sections.flatMap(section => [section.body, section.code || '',
    section.example?.problem || '', ...(section.example?.steps || []), section.example?.answer || '']), input.summary,
    ...input.reviewer.keyFacts, ...input.reviewer.questions.flatMap(item => [item.question, item.answer]),
    ...input.reviewer.exercises.flatMap(item => [item.problem, item.solution])].join(' ').split(/\s+/).length;
  return { ...input, readingTime: `${Math.ceil(words / 180)} min`, reviewQuestions: input.reviewer.questions.map(item => item.question) };
}

export function section(heading: string, body: string, extra: Omit<LessonSection, 'heading' | 'body'> = {}): LessonSection {
  return { heading, body, ...extra };
}
