import type { Lesson } from '../lib/lessons';

export function LessonReviewer({ reviewer }: { reviewer: NonNullable<Lesson['reviewer']> }) {
  return (
    <section id="lesson-review" className="teaching-card teaching-reviewer" aria-labelledby="reviewer-title">
      <span className="teaching-eyebrow">Reviewer and self-assessment</span>
      <h2 id="reviewer-title">Review the whole module</h2>
      <p className="teaching-review-intro">Recall the key ideas, answer each question in your own words, then open the explanation to check your reasoning.</p>
      <h3>Quick reference</h3>
      <ul className="teaching-facts">{reviewer.keyFacts.map((fact, i) => <li key={i}>{fact}</li>)}</ul>
      <h3>Concept questions with explanations</h3>
      <div className="teaching-answer-list">{reviewer.questions.map((item, i) => (
        <details key={i}>
          <summary><span>{i + 1}. {item.question}</span></summary>
          <div className="teaching-answer"><span className="teaching-eyebrow">Answer and reasoning</span><p>{item.answer}</p></div>
        </details>
      ))}</div>
      <h3>Practice problems</h3>
      <p className="teaching-review-intro">Work through these before revealing the solutions. Include your intermediate steps, assumptions, and final answer.</p>
      {reviewer.exercises.map((item, i) => (
        <div className="teaching-practice" key={i}>
          <h4>Problem {i + 1}</h4><p>{item.problem}</p>
          <details><summary>Show worked solution</summary><div className="teaching-answer"><p>{item.solution}</p></div></details>
        </div>
      ))}
    </section>
  );
}
