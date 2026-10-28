import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LESSONS, getLesson } from './lessons';
import { EXTRA_LESSONS } from './lessonsExtra';
import { FULL_LESSONS } from './fullLessons';
import { LessonReviewer } from '../components/LessonReviewer';

describe('complete learning modules and reviewers', () => {
  const titles = Object.keys({ ...LESSONS, ...EXTRA_LESSONS });
  it('covers the whole built-in library', () => {
    expect(Object.keys(FULL_LESSONS).sort()).toEqual(titles.sort());
  });

  it.each(titles)('serves the complete discussion and reviewer for %s', title => {
    const lesson = getLesson(title)!;
    expect(lesson).toBe(FULL_LESSONS[title]);
    expect(lesson.sections.length).toBeGreaterThanOrEqual(6);
    expect(new Set(lesson.sections.map(section => section.heading)).size).toBe(lesson.sections.length);
    for (const section of lesson.sections) {
      expect(section.body.split(/\n\s*\n/).length).toBeGreaterThanOrEqual(2);
      expect(section.body.split(/\s+/).length).toBeGreaterThan(65);
    }
    expect(lesson.sections.some(section => section.example?.steps.length)).toBe(true);
    expect(lesson.reviewer!.keyFacts.length).toBeGreaterThanOrEqual(6);
    expect(lesson.reviewer!.questions.length).toBeGreaterThanOrEqual(4);
    expect(lesson.reviewer!.exercises.length).toBeGreaterThanOrEqual(3);
    expect(lesson.reviewer!.exercises.every(item => item.solution.length > 60)).toBe(true);
  });

  it('covers the actual online, streaming, quantum, and AI source topics in Emerging Topics', () => {
    const lesson = getLesson('Module 8.2 - EMERGING TOPICS')!;
    const text = lesson.sections.map(section => section.body).join(' ');
    for (const topic of ['LRU', 'FIFO', 'ski-rental', 'bin packing', 'scheduling', 'streaming', 'Reservoir', 'qubit', 'CNOT', 'Grover', 'neural network', 'decision tree', 'NLP']) {
      expect(text.toLowerCase(), topic).toContain(topic.toLowerCase());
    }
    expect(text).toContain('(π/4)√N');
    expect(text).toContain('not (π/2)√N');
  });

  it('covers the imported string-matching algorithms rather than substituting only KMP', () => {
    const lesson = getLesson('Module6_Advanced_Algorithms')!;
    const text = lesson.sections.map(section => section.body).join(' ');
    for (const algorithm of ['Naive', 'Rabin-Karp', 'Boyer-Moore', 'KMP']) expect(text.toLowerCase()).toContain(algorithm.toLowerCase());
    expect(text).toContain('total is 13');
  });

  it('keeps all reviewer explanations and solutions available in native answer disclosures', () => {
    const reviewer = getLesson('Module 8.2 - EMERGING TOPICS')!.reviewer!;
    const html = renderToStaticMarkup(createElement(LessonReviewer, { reviewer }));
    expect(html.match(/<details>/g)?.length).toBe(reviewer.questions.length + reviewer.exercises.length);
    expect(html).toContain('Answer and reasoning');
    expect(html).toContain('Relative error');
    expect(html).toContain('Show worked solution');
    expect(html).not.toContain('<details open');
  });

  it('supports normalized module titles and preserves unknown-module fallback', () => {
    expect(getLesson('  module6 advanced algorithms  ')).toBe(FULL_LESSONS.Module6_Advanced_Algorithms);
    expect(getLesson('an unrelated upload')).toBeNull();
  });
});
