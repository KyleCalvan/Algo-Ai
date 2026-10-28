import { useAssistantSettings } from '../../lib/context.tsx';

interface AssistantHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  minimized: boolean;
  onToggleDeepResearch: () => void;
  deepResearch: boolean;
  selectedModel: string;
  onModelClick: () => void;
}

export function AssistantHeader({
  onClose,
  onMinimize,
  minimized,
  onToggleDeepResearch,
  deepResearch,
  selectedModel,
  onModelClick,
}: AssistantHeaderProps) {
  const { settings, updateSettings } = useAssistantSettings();

  return (
    <header className="assistant-header" role="banner">
      <div className="assistant-header-left">
        <button
          className="assistant-avatar"
          onClick={() => {
            // Could open settings modal for name/avatar
          }}
          aria-label={`${settings.name} settings`}
        >
          {settings.avatar}
        </button>
        <div className="assistant-header-info">
          <h2 className="assistant-name">{settings.name}</h2>
          <div className="assistant-mode-badge">
            <span className={`assistant-mode-dot ${deepResearch ? 'deep-research' : ''}`} />
            <span className="assistant-mode-text">
              {deepResearch ? 'Deep Research' : 'AI Assistant'}
            </span>
          </div>
        </div>
      </div>

      <div className="assistant-header-right">
        <button
          className="assistant-model-trigger"
          onClick={onModelClick}
          aria-label={`Current model: ${selectedModel || 'default'}`}
          title={`Model: ${selectedModel || 'default'}`}
        >
          <span className="assistant-model-icon">🧠</span>
          <span className="assistant-model-name">
            {selectedModel || 'Select model'}
          </span>
        </button>

        <button
          className={`assistant-toggle-btn ${deepResearch ? 'active' : ''}`}
          onClick={onToggleDeepResearch}
          aria-pressed={deepResearch}
          aria-label={deepResearch ? 'Disable Deep Research' : 'Enable Deep Research'}
          title={deepResearch ? 'Deep Research ON' : 'Deep Research OFF'}
        >
          <span className="assistant-research-icon">🔬</span>
        </button>

        <button
          className="assistant-control-btn"
          onClick={onMinimize}
          aria-label={minimized ? 'Expand' : 'Minimize'}
          title={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? '⛶' : '−'}
        </button>

        <button
          className="assistant-control-btn"
          onClick={onClose}
          aria-label="Close assistant"
          title="Close"
        >
          ✕
        </button>
      </div>
    </header>
  );
}