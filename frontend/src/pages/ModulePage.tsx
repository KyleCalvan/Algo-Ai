import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { fetchModule } from '../lib/api';
import type { LearningModule } from '../lib/api';
import { getLesson } from '../lib/lessons';
import { getModuleVisuals } from '../lib/moduleVisuals';
import { LessonVisual } from '../components/LessonVisual';
import { LessonReviewer } from '../components/LessonReviewer';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, List, PlayCircle } from 'lucide-react';
import './teaching.css';

export function ModulePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<(LearningModule & { source?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setModule(null);
    if (!moduleId) { setLoading(false); return; }
    fetchModule(moduleId)
      .then((m) => { if (!cancelled) setModule(m); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [moduleId]);

  if (loading) return <div className="teaching-state" role="status"><BookOpen size={28} /><p>Loading module…</p></div>;
  if (error || !module) return (
    <div className="teaching-state">
      <BookOpen size={28} /><h1>Module unavailable</h1>
      <p role={error ? 'alert' : undefined}>{error || 'Module not found'}</p>
      <button className="teaching-button" onClick={() => navigate('/landing')}><ArrowLeft size={16} /> Back to Library</button>
    </div>
  );

  const lesson = getLesson(module.title);
  const visuals = getModuleVisuals(module.title);
  const goToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ block: 'start' });

  return (
    <div className="teaching-page" key={module.id}>
      <div className="teaching-container">
        <nav className="teaching-breadcrumb" aria-label="Breadcrumb">
          <button onClick={() => navigate('/landing')}><ArrowLeft size={14} /> Module Library</button>
          <span aria-hidden="true">/</span><span aria-current="page">{module.title}</span>
        </nav>
        <header className="teaching-header">
          <div className="teaching-heading">
            <span className="teaching-eyebrow"><BookOpen size={14} /> {module.subject || 'General'} · Learning module and reviewer</span>
            <h1>{module.title}</h1>
            {(lesson?.description || module.summary) && <p className="teaching-description">{lesson?.description || module.summary}</p>}
            {lesson && <div className="teaching-meta"><span>{lesson.difficulty}</span><span><Clock size={14} /> {lesson.readingTime} read</span><span>{lesson.sections.length} sections</span></div>}
            {!!module.topics?.length && <div className="teaching-tags">{module.topics.map((topic, i) => <span key={`${topic}-${i}`}>{topic}</span>)}</div>}
          </div>
          <div className="teaching-actions">
            {lesson && <button className="teaching-button" onClick={() => goToSection('lesson-review')}>Open Reviewer</button>}
            <button className="teaching-button teaching-button-primary" onClick={() => navigate(`/quiz?module=${module.id}`)}><PlayCircle size={16} /> Take Quiz</button>
          </div>
        </header>
        <div className={lesson ? 'teaching-layout' : 'teaching-layout teaching-layout-single'}>
          {lesson && (
            <aside className="teaching-outline">
              <nav aria-label="Lesson sections">
                <h2><List size={16} /> In this module</h2>
                <button onClick={() => goToSection('lesson-objectives')}>Learning objectives</button>
                {visuals.length > 0 && <button onClick={() => goToSection('lesson-visuals')}>Example graphs</button>}
                {lesson.sections.map((sec, i) => <button key={i} onClick={() => goToSection(`lesson-section-${i}`)}><span className="teaching-outline-number">{String(i + 1).padStart(2, '0')}</span>{sec.heading}</button>)}
                <button onClick={() => goToSection('lesson-summary')}>Summary</button>
                <button onClick={() => goToSection('lesson-review')}>Reviewer and practice</button>
                {module.source && <button onClick={() => goToSection('lesson-original')}>Original module material</button>}
              </nav>
            </aside>
          )}
          <article className="teaching-content" aria-label="Module content">
            {lesson ? (
              <>
                <section id="lesson-objectives" className="teaching-card teaching-objectives">
                  <span className="teaching-eyebrow">Before you begin</span><h2>What you’ll learn</h2>
                  <ul>{lesson.objectives.map((objective, i) => <li key={i}><CheckCircle2 size={17} /><span>{objective}</span></li>)}</ul>
                </section>
                {visuals.length > 0 && <section id="lesson-visuals" className="teaching-card"><span className="teaching-eyebrow">See it in practice</span><h2>Example graphs</h2>{visuals.map((visual, i) => <div className="teaching-visual" key={i}><LessonVisual visual={visual} /></div>)}</section>}
                {lesson.sections.map((sec, i) => (
                  <section id={`lesson-section-${i}`} className="teaching-card teaching-section" key={i}>
                    <span className="teaching-eyebrow">Section {String(i + 1).padStart(2, '0')}</span><h2>{sec.heading}</h2>
                    <div className="teaching-prose">{sec.body.split(/\n\s*\n/).map((paragraph, p) => <p key={p}>{paragraph}</p>)}</div>
                    {sec.code && <div className="teaching-code"><h3>Algorithm / pseudocode</h3><pre><code>{sec.code}</code></pre></div>}
                    {sec.example && <div className="teaching-worked"><h3>Step-by-step example</h3><p>{sec.example.problem}</p><ol>{sec.example.steps.map((step, s) => <li key={s}>{step}</li>)}</ol><p className="teaching-worked-answer"><strong>Result: </strong>{sec.example.answer}</p></div>}
                    {!!sec.takeaways?.length && <ul className="teaching-facts">{sec.takeaways.map((point, t) => <li key={t}>{point}</li>)}</ul>}
                    {sec.visual && <div className="teaching-visual"><LessonVisual visual={sec.visual} /></div>}
                  </section>
                ))}
                <section id="lesson-summary" className="teaching-card teaching-summary"><span className="teaching-eyebrow">Key takeaways</span><h2>Summary</h2><p className="teaching-body">{lesson.summary}</p></section>
                {lesson.reviewer ? <LessonReviewer reviewer={lesson.reviewer} /> : <section id="lesson-review" className="teaching-card"><h2>Review questions</h2><ol className="teaching-review">{lesson.reviewQuestions.map((q, i) => <li key={i}>{q}</li>)}</ol></section>}
                {module.source && <section id="lesson-original" className="teaching-card"><h2>Original module material</h2><p className="teaching-review-intro">The complete imported material is available here alongside the expanded discussion and reviewer.</p><details className="teaching-original"><summary>Read full original material</summary><pre className="teaching-body teaching-source">{module.source}</pre></details></section>}
                {!!lesson.references?.length && <section className="teaching-card"><h2>Further reading</h2><ul className="teaching-references">{lesson.references.map(ref => <li key={ref.url}><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a></li>)}</ul></section>}
              </>
            ) : module.source ? (
              <section className="teaching-card"><h2>Lesson content</h2><pre className="teaching-body teaching-source">{module.source}</pre></section>
            ) : (
              <section className="teaching-card teaching-empty"><BookOpen size={28} /><h2>No lesson content available</h2><p>This module does not have lesson content yet.</p></section>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
