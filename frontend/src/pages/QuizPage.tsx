import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { apiFetch } from '../lib/api';

interface Question { id: string; question: string; options: string[]; }
interface Quiz { quiz_id: string; module_id: string; title: string; num_questions: number; questions: Question[]; }
interface Result { id: string; question: string; options: string[]; user_answer: number | null; correct_answer: number; is_correct: boolean; explanation: string; }

export function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const moduleId = params.get('module') || '';
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ score: number; total: number; percentage: number; results: Result[] } | null>(null);
  const [current, setCurrent] = useState(0);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiFetch(`/v1/modules/${moduleId}/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_questions: 10, difficulty: 'Medium', scope: 'module' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setQuiz(data);
      setAnswers({});
      setCurrent(0);
      setSubmitted(false);
      setResults(null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (moduleId) generate();
  }, [moduleId]);

  const submit = async () => {
    if (!quiz) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/v1/modules/quiz/${quiz.quiz_id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!moduleId) return <div style={{ flex: 1, padding: 32 }}>No module selected. <button onClick={() => navigate('/')}>Go back</button></div>;

  if (generating) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Generating quiz with AI…</p>
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ef4444' }}>{error}</p>
      <button onClick={generate} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--color-accent-purple)', color: 'var(--color-on-accent)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Retry</button>
      <button onClick={() => navigate(`/modules/${moduleId}`)} style={{ marginTop: 8, padding: '8px 16px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: 8, cursor: 'pointer' }}>Back to Module</button>
    </div>
  );

  if (!quiz) return null;

  if (submitted && results) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--color-bg)' }}>
        <h1 style={{ color: 'var(--color-text)' }}>Quiz Results</h1>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}>
          Score: {results.score} / {results.total} ({results.percentage}%)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {results.results.map((r, i) => (
            <div key={r.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
              <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{i + 1}. {r.question}</p>
              {r.options.map((opt, idx) => (
                <div key={idx} style={{
                  padding: '6px 10px', margin: '4px 0', borderRadius: 6,
                  background: idx === r.correct_answer ? '#22c55e22' : (idx === r.user_answer && !r.is_correct ? '#ef444422' : 'transparent'),
                  color: 'var(--color-text)', fontSize: 13,
                }}>
                  {String.fromCharCode(65 + idx)}. {opt} {idx === r.correct_answer ? '✓' : ''}
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                {r.is_correct ? '✓ Correct' : '✗ Incorrect'} — {r.explanation}
              </p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={generate} style={{ padding: '8px 16px', background: 'var(--color-accent-purple)', color: 'var(--color-on-accent)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Retry Quiz</button>
          <button onClick={() => navigate(`/modules/${moduleId}`)} style={{ padding: '8px 16px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: 8, cursor: 'pointer' }}>Back to Module</button>
        </div>
      </div>
    );
  }

  const q = quiz.questions[current];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>{quiz.title}</h1>
        <button onClick={() => navigate(`/modules/${moduleId}`)} style={{ padding: '6px 12px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Back to Module</button>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 16 }}>
        Question {current + 1} of {quiz.questions.length}
      </p>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20 }}>
        <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}>{q.question}</p>
        {q.options.map((opt, idx) => (
          <label key={idx} style={{ display: 'block', padding: '8px 12px', margin: '6px 0', borderRadius: 8, border: `1px solid ${answers[q.id] === idx ? 'var(--color-accent)' : 'var(--color-border)'}`, cursor: 'pointer', color: 'var(--color-text)', background: answers[q.id] === idx ? 'var(--color-accent-subtle)' : 'transparent' }}>
            <input type="radio" name={q.id} checked={answers[q.id] === idx} onChange={() => setAnswers({ ...answers, [q.id]: idx })} style={{ marginRight: 8 }} />
            {String.fromCharCode(65 + idx)}. {opt}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <button disabled={current === 0} onClick={() => setCurrent(current - 1)} style={{ padding: '8px 14px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: 8, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1 }}>Previous</button>
        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)} style={{ padding: '8px 14px', background: 'var(--color-accent-purple)', color: 'var(--color-on-accent)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Next</button>
        ) : (
          <button onClick={submit} disabled={loading} style={{ padding: '8px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Submitting…' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}