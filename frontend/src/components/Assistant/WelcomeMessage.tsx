import { useAssistantSettings } from '../../lib/context.tsx';
import type { AssistantContext } from '../../lib/context.tsx';

interface WelcomeMessageProps {
  context?: AssistantContext;
}

export function WelcomeMessage({ context }: WelcomeMessageProps) {
  const { settings } = useAssistantSettings();

  // Context-aware welcome messages
  const getWelcomeMessage = () => {
    const page = context?.currentPage || 'chat';
    const hasMessages = false; // This component is only shown when empty

    const messages: Record<string, string> = {
      chat: `Hi! I'm ${settings.name}, your AI assistant. How can I help you today?`,
      dashboard: `Welcome to your dashboard! I can help explain metrics, compare costs, or answer questions about your data.`,
      agents: `I can help you understand agent capabilities, create new agents, or troubleshoot existing ones.`,
      'data-sources': `Need help connecting data sources? I can guide you through setting up Gmail, Google Drive, or other connectors.`,
      settings: `I'm here to help with configuration. Ask me about any setting or feature!`,
    };

    return messages[page] || messages.chat;
  };

  const getSuggestions = () => {
    const page = context?.currentPage || 'chat';
    const hasSources = context?.hasConnectedSources ?? false;
    const hasModel = !!context?.selectedModel;

    if (page === 'chat') {
      if (!hasModel) {
        return ['Pick a model to get started', 'Learn about available models'];
      }
      if (!hasSources) {
        return ['Connect data sources', 'Start a conversation', 'Try Deep Research'];
      }
      return [
        'Explain a concept step by step',
        'Help me write code',
        'Analyze my data',
        'Brainstorm ideas',
      ];
    }

    if (page === 'dashboard') {
      return ['Explain these metrics', 'Compare local vs cloud costs', 'What does this chart mean?'];
    }

    if (page === 'agents') {
      return ['Explain agent capabilities', 'Help me create an agent', 'List available agents'];
    }

    if (page === 'data-sources') {
      return ['Help me connect Gmail', 'Explain sync status', 'Which sources should I connect?'];
    }

    if (page === 'settings') {
      return ['Explain this setting', 'Recommended configuration', 'Reset to defaults'];
    }

    return ['Ask me anything', 'Explain a concept', 'Help me get started'];
  };

  return (
    <div className="assistant-welcome">
      <div className="assistant-welcome-avatar" aria-hidden="true">
        {settings.avatar}
      </div>
      <h3 className="assistant-welcome-title">Welcome!</h3>
      <p className="assistant-welcome-text">{getWelcomeMessage()}</p>

      <div className="assistant-welcome-suggestions" role="list" aria-label="Suggested questions">
        {getSuggestions().map((suggestion, index) => (
          <button
            key={index}
            className="assistant-welcome-suggestion"
            role="listitem"
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}