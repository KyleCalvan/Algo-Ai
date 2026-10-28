import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowDown, ArrowRight, BookOpen, BookOpenCheck, Brain, Calculator, Check,
  ChevronRight, Clock3, Code2, Database, Eye, FlaskConical, FolderOpen,
  GitGraph, Layers3, MessageSquare, Network, Plus, Search, X,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { fetchModule, fetchModules } from '../lib/api';
import type { LearningModule } from '../lib/api';
import { getLesson } from '../lib/lessons';
import './landing.css';

const LAST_MODULE_KEY = 'oj_last_module';
const SUBJECTS = {
  algorithms: { Icon: GitGraph, color: '#8b5cf6', label: 'Algorithms' },
  'data structures': { Icon: Layers3, color: '#0891b2', label: 'Data structures' },
  programming: { Icon: Code2, color: '#10b981', label: 'Programming' },
  mathematics: { Icon: Calculator, color: '#e879a2', label: 'Mathematics' },
  math: { Icon: Calculator, color: '#e879a2', label: 'Mathematics' },
  science: { Icon: FlaskConical, color: '#d49a38', label: 'Science' },
  networking: { Icon: Network, color: '#0891b2', label: 'Networking' },
  database: { Icon: Database, color: '#0891b2', label: 'Database' },
  ai: { Icon: Brain, color: '#8b5cf6', label: 'AI' },
  general: { Icon: BookOpen, color: '#8591aa', label: 'General' },
};
function subjectInfo(subject = 'general') {
  const key = subject.toLowerCase() as keyof typeof SUBJECTS;
  return SUBJECTS[key] || { ...SUBJECTS.general, label: subject.charAt(0).toUpperCase() + subject.slice(1) };
}
function presentation(module: LearningModule) {
  const lesson = getLesson(module.title);
  return { lesson, title: lesson?.title || module.title, description: lesson?.description || module.summary || 'Open this module to explore the learning material.' };
}
function LearningSketch() {
  return <div className="lp-sketch" aria-hidden="true">
    <div className="lp-sketch-caption"><span className="lp-mini-dot" /> A little clarity, every day</div>
    <svg viewBox="0 0 350 180" fill="none">
      <path d="M175 64V94M175 94H65V124M175 94H285V124M175 94V124" stroke="currentColor" strokeWidth="1.5" />
      <rect x="118" y="15" width="114" height="50" rx="12" className="lp-svg-root" />
      <text x="175" y="46" textAnchor="middle">A new idea</text>
      <rect x="16" y="124" width="98" height="40" rx="10" /><text x="65" y="149" textAnchor="middle">Understand</text>
      <rect x="126" y="124" width="98" height="40" rx="10" /><text x="175" y="149" textAnchor="middle">Recall</text>
      <rect x="236" y="124" width="98" height="40" rx="10" /><text x="285" y="149" textAnchor="middle">Apply</text>
    </svg>
    <div className="lp-sketch-note"><Check size={13} /> Learn beyond the definition.</div>
  </div>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [lastModuleId, setLastModuleId] = useState<string | null>(null);
  const [preview, setPreview] = useState<LearningModule | null>(null);
  const [previewDetails, setPreviewDetails] = useState<(LearningModule & { source?: string }) | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => { setLastModuleId(localStorage.getItem(LAST_MODULE_KEY)); }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchModules('')
      .then(data => { if (!cancelled) setModules(data || []); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!preview) { dialog?.close(); return; }
    if (dialog && !dialog.open) dialog.showModal();
    let cancelled = false;
    setPreviewDetails(null);
    setPreviewError('');
    setPreviewLoading(true);
    fetchModule(preview.id)
      .then(data => { if (!cancelled) setPreviewDetails(data); })
      .catch(e => { if (!cancelled) setPreviewError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [preview]);

  const subjects = useMemo(() => [...new Set(modules.map(m => m.subject || 'general'))].sort(), [modules]);
  const filteredModules = useMemo(() => {
    const query = search.toLowerCase().trim();
    return modules.filter(module => {
      if (subjectFilter && (module.subject || 'general') !== subjectFilter) return false;
      const info = presentation(module);
      return !query || [module.title, info.title, info.description, module.subject, module.summary, ...(module.topics || [])].join(' ').toLowerCase().includes(query);
    });
  }, [modules, search, subjectFilter]);
  const lastModule = modules.find(module => module.id === lastModuleId);
  const featured = lastModule || modules.find(module => (module as LearningModule & { featured?: boolean }).featured) || modules[0];
  const featuredInfo = featured ? presentation(featured) : null;
  const reviewerCount = modules.filter(module => getLesson(module.title)?.reviewer).length;

  const openModule = (moduleId: string, quiz = false) => {
    localStorage.setItem(LAST_MODULE_KEY, moduleId);
    navigate(quiz ? `/quiz?module=${moduleId}` : `/modules/${moduleId}`);
  };
  const browse = () => document.getElementById('lp-library')?.scrollIntoView({ block: 'start' });
  const resetFilters = () => { setSearch(''); setSubjectFilter(''); };

  return (
    <div className="learning-home">
      <div className="lp-container">
        <div className="lp-topbar"><span><BookOpen size={17} /><strong>Learning hub</strong><ChevronRight size={13} /><span>Your workspace</span></span><button className="lp-button lp-button-quiet" onClick={() => navigate('/modules')}><Plus size={15} /> Import module</button></div>

        <header className="lp-hero">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow"><span className="lp-mini-dot" /> A SPACE TO UNDERSTAND</div>
            <h1>Learn it deeply.<br /><span>Make it stick.</span></h1>
            <p>Your modules, worked examples, and reviewers.<br className="lp-desktop-break" /> Everything you need for your next “I get it” moment.</p>
            <div className="lp-hero-actions"><button className="lp-button lp-button-primary" onClick={browse}>Explore modules <ArrowDown size={16} /></button><button className="lp-button lp-button-text" onClick={() => navigate('/chat')}><MessageSquare size={16} /> Ask a question <ArrowRight size={14} /></button></div>
          </div>
          <LearningSketch />
        </header>

        <div className="lp-overview" aria-label="Library overview">
          <span><strong>{loading ? '—' : modules.length}</strong> learning modules</span><i /><span><strong>{loading ? '—' : subjects.length}</strong> subject areas</span><i /><span><strong>{loading ? '—' : reviewerCount}</strong> module reviewers</span>
        </div>

        {!loading && featured && featuredInfo && <section className="lp-continue" aria-labelledby="lp-continue-title">
          <div className="lp-continue-icon"><BookOpenCheck size={25} /></div>
          <div className="lp-continue-copy"><span className="lp-eyebrow">{lastModule ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR NEXT CHAPTER'}</span><h2 id="lp-continue-title">{featuredInfo.title}</h2><p>{featuredInfo.lesson ? `${featuredInfo.lesson.readingTime} read · ${featuredInfo.lesson.difficulty} · Lesson and reviewer` : subjectInfo(featured.subject).label}</p></div>
          <button className="lp-button lp-button-primary" onClick={() => openModule(featured.id)}>{lastModule ? 'Continue learning' : 'Open module'}<ArrowRight size={16} /></button>
        </section>}

        <div className="lp-workspace">
          <section id="lp-library" className="lp-library" aria-labelledby="lp-library-title">
            <div className="lp-library-heading"><div><span className="lp-eyebrow">BUILD YOUR UNDERSTANDING</span><h2 id="lp-library-title">Your module library</h2></div><span className="lp-result-count" aria-live="polite">{loading ? 'Loading…' : `${filteredModules.length} module${filteredModules.length === 1 ? '' : 's'}`}</span></div>
            <div className="lp-search"><Search size={18} /><input aria-label="Search modules, topics, or subjects" placeholder="Find a module, topic, or subject…" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}</div>
            <div className="lp-filters" aria-label="Filter modules by subject"><button aria-pressed={!subjectFilter} onClick={() => setSubjectFilter('')}>All modules <span>{modules.length}</span></button>{subjects.map(subject => <button key={subject} aria-pressed={subjectFilter === subject} onClick={() => setSubjectFilter(subject)}>{subjectInfo(subject).label}</button>)}</div>
            {error && <div className="lp-empty" role="alert"><h3>We couldn’t load your library</h3><p>{error}</p><button className="lp-button" onClick={() => setReload(value => value + 1)}>Try again</button></div>}
            {loading ? <div className="lp-module-grid" role="status" aria-label="Loading modules">{[0,1,2,3].map(i => <div className="lp-skeleton" key={i}><span /><span /><span /></div>)}</div> : !error && filteredModules.length > 0 ? (
              <div className="lp-module-grid">{filteredModules.map(module => {
                const info = presentation(module);
                const subject = subjectInfo(module.subject);
                const Icon = subject.Icon;
                return <article className="lp-module-card" key={module.id} style={{ '--lp-module-color': subject.color } as CSSProperties}>
                  <div className="lp-card-top"><span className="lp-module-icon"><Icon size={22} /></span><span className="lp-card-category">{subject.label}</span><button className="lp-icon-button" aria-label={`Preview ${info.title}`} onClick={() => setPreview(module)}><Eye size={16} /></button></div>
                  <h3><button onClick={() => setPreview(module)}>{info.title}</button></h3>
                  <p className="lp-card-description">{info.description}</p>
                  <div className="lp-card-meta">{info.lesson ? <><span><Clock3 size={13} />{info.lesson.readingTime}</span><span className="lp-meta-separator" />{info.lesson.difficulty}</> : <span><BookOpen size={13} />Learning material</span>}</div>
                  <div className="lp-card-features">{info.lesson?.reviewer ? <span><BookOpenCheck size={13} /> Reviewer included</span> : <span><Layers3 size={13} />{module.topics?.length || 0} topics</span>}</div>
                  <div className="lp-card-footer"><button onClick={() => openModule(module.id)}>Study module <ArrowRight size={15} /></button><button onClick={() => openModule(module.id, true)}>Take quiz</button></div>
                </article>;
              })}</div>
            ) : !error && <div className="lp-empty"><span className="lp-empty-icon">{modules.length ? <Search size={26} /> : <FolderOpen size={26} />}</span><h3>{modules.length ? 'No modules found' : 'Your next chapter starts here'}</h3><p>{modules.length ? 'Try a different keyword or choose another subject.' : 'Import your first module to start building your learning library.'}</p><button className="lp-button" onClick={modules.length ? resetFilters : () => navigate('/modules')}>{modules.length ? 'Clear filters' : 'Import a module'}</button></div>}
          </section>

          <aside className="lp-study-aside" aria-label="Study resources">
            <section className="lp-guide"><span className="lp-guide-icon"><BookOpenCheck size={20} /></span><h2>A good study session<br />starts with a plan.</h2><p>Go beyond reading. Build a little understanding each time.</p><ol><li><span>01</span><div><h3>Understand the idea</h3><p>Read the explanation and follow the worked examples.</p></div></li><li><span>02</span><div><h3>Recall it yourself</h3><p>Use the reviewer. Try each question before revealing the answer.</p></div></li><li><span>03</span><div><h3>Put it into practice</h3><p>Solve the practice problems, then test yourself with a quiz.</p></div></li></ol></section>
            <section className="lp-chat-card"><span className="lp-chat-icon"><MessageSquare size={20} /></span><h3>Something not clicking?</h3><p>Bring your questions to the chat and work through them.</p><button onClick={() => navigate('/chat')}>Let’s talk it through <ArrowRight size={15} /></button></section>
          </aside>
        </div>
        <footer className="lp-footer"><BookOpen size={13} /><span>OpenJarvis · One idea at a time.</span><button onClick={() => navigate('/modules')}>Manage library <ArrowRight size={12} /></button></footer>
      </div>

      <dialog ref={dialogRef} className="lp-preview" onCancel={() => setPreview(null)} onClose={() => setPreview(null)} onClick={e => { if (e.target === e.currentTarget) setPreview(null); }} aria-labelledby="lp-preview-title">
        {preview && <div className="lp-preview-inner"><div className="lp-preview-top"><span className="lp-eyebrow">MODULE PREVIEW</span><button className="lp-icon-button" aria-label="Close module preview" onClick={() => setPreview(null)}><X size={20} /></button></div><h2 id="lp-preview-title">{presentation(preview).title}</h2><p>{presentation(preview).description}</p>
          {getLesson(preview.title) && <div className="lp-preview-objectives"><h3>What you’ll learn</h3><ul>{getLesson(preview.title)!.objectives.map((objective, i) => <li key={i}><Check size={15} />{objective}</li>)}</ul></div>}
          {previewLoading && <p role="status">Loading module details…</p>}{previewError && <p className="lp-preview-error" role="alert">{previewError}</p>}
          {previewDetails?.source && <details className="lp-preview-source"><summary>Preview the original material</summary><pre>{previewDetails.source.slice(0, 1200)}{previewDetails.source.length > 1200 ? '\n… Continue in the full module.' : ''}</pre></details>}
          <div className="lp-preview-actions"><button className="lp-button lp-button-primary" onClick={() => openModule(preview.id)}>Open full module <ArrowRight size={16} /></button><button className="lp-button" onClick={() => openModule(preview.id, true)}>Take quiz</button></div>
        </div>}
      </dialog>
    </div>
  );
}
