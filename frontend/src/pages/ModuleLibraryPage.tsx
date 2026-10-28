import { useEffect, useState } from 'react';
import { fetchModules, importModuleText, deleteModule, fetchModule } from '../lib/api';
import type { LearningModule } from '../lib/api';
import './teaching.css';

export function ModuleLibraryPage() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selected, setSelected] = useState<LearningModule | null>(null);
  const [details, setDetails] = useState<(LearningModule & { content?: string }) | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('general');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = (q = '') => {
    setLoading(true);
    setError('');
    fetchModules(q)
      .then((m) => setModules(m || []))
      .catch((e: any) => setError(e?.message || String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  const handleSearch = () => load(query);

  const handleImport = async () => {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const m = await importModuleText({ title: title.trim(), subject: subject.trim() || 'general', content });
      setNotice(`Imported module ${m.title}`);
      setTitle('');
      setContent('');
      load(query);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = async (m: LearningModule) => {
    setSelected(m);
    try {
      const d = await fetchModule(m.id);
      setDetails(d as any);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteModule(id);
      if (selected?.id === id) {
        setSelected(null);
        setDetails(null);
      }
      load(query);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  return (
    <div className="teaching-library flex-1 overflow-y-auto px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Module Library
          </h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
            Persistently store learning modules, search by topic and see summaries, topics, files on disk that survive restarts.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <section className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Import Module (paste)</h3>
            <input
              aria-label="Module title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', marginBottom: 8 }}
            />
            <input
              aria-label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', marginBottom: 8 }}
            />
            <textarea
              aria-label="Module content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste module content here..."
              className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-y"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', marginBottom: 8 }}
            />
            <button
              onClick={handleImport}
              disabled={busy || !title.trim() || !content.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: busy ? 'var(--color-bg-tertiary)' : 'var(--color-accent-purple)', color: 'var(--color-on-accent)', opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Importing...' : 'Import Module'}
            </button>
            {notice && <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-success)' }}>{notice}</p>}
            {error && <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>}
          </section>

          <section className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <input
                aria-label="Search modules"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search modules"
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-accent-purple)', color: 'var(--color-on-accent)' }}
              >
                Search
              </button>
            </div>
            {loading ? <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div> : null}
            <div className="space-y-2 max-h-80 overflow-auto">
              {modules.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg p-3 cursor-pointer"
                  style={{
                    background: selected?.id === m.id ? 'var(--color-accent-subtle)' : 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                  onClick={() => handleSelect(m)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected?.id === m.id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(m); }
                  }}
                >
                  <div style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{m.subject} · {(m.topics || []).join(', ')}</div>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginTop: 4 }}>{m.summary}</div>
                </div>
              ))}
              {!loading && modules.length === 0 && (
                <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No modules yet.</div>
              )}
            </div>
          </section>
        </div>

        {details && (
          <section className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: 14 }}>{details.title}</h3>
              <button
                onClick={() => handleDelete(details.id)}
                className="text-xs"
                style={{ color: 'var(--color-error)' }}
              >
                Delete
              </button>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 8 }}>
              {details.subject} · {(details.topics || []).join(', ')}
            </div>
            <pre style={{ color: 'var(--color-text)', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {(details as any).source || details.content || ''}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
