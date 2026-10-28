import { useAssistantContext, buildContextualPrompt } from '../../lib/context.tsx';
import { useAppStore } from '../../lib/store';
import type { AssistantContext } from '../../lib/context.tsx';

interface SuggestedActionsProps {
  onSend: (prompt: string, isResearch?: boolean) => void;
  disabled?: boolean;
  context?: AssistantContext;
}

export function SuggestedActions({ onSend, disabled, context: propContext }: SuggestedActionsProps) {
  const { deepResearch, selectedModel } = useAppStore();
  const hookContext = useAssistantContext();
  const context = propContext || hookContext;

  // Generate suggestions based on context
  const getSuggestions = () => {
    const page = context.currentPage;
    const hasMessages = false; // This is shown when empty or as persistent chips
    const hasSources = context.hasConnectedSources;
    const hasModel = !!context.selectedModel;

    // Base suggestions for each page
    const suggestions: Record<string, Array<{ label: string; prompt: string; research?: boolean }>> = {
      chat: [
        { label: 'Explain step by step', prompt: 'Explain this concept step by step with examples' },
        { label: 'Give me an example', prompt: 'Give me a concrete example of how this works' },
        { label: 'Break it down', prompt: 'Break this down into simple terms I can understand' },
        { label: 'What should I do next?', prompt: 'Based on our conversation, what should I do next?' },
      ],
      dashboard: [
        { label: 'Explain metrics', prompt: 'Explain what these dashboard metrics mean and how to interpret them' },
        { label: 'Compare costs', prompt: 'Compare local vs cloud computing costs for my usage' },
        { label: 'Optimize performance', prompt: 'Suggest ways to optimize based on these metrics' },
      ],
      agents: [
        { label: 'Explain capabilities', prompt: 'What can agents do and how do they work?' },
        { label: 'Create an agent', prompt: 'Help me create a new agent for my use case' },
        { label: 'Best practices', prompt: 'What are best practices for agent design?' },
      ],
      'data-sources': [
        { label: 'Connect Gmail', prompt: 'Guide me through connecting Gmail as a data source' },
        { label: 'Explain sync', prompt: 'Explain the sync status and what it means' },
        { label: 'Recommended sources', prompt: 'Which data sources should I connect for my use case?' },
      ],
      settings: [
        { label: 'Explain setting', prompt: 'Explain what this setting does and recommended values' },
        { label: 'Optimal config', prompt: 'What is the optimal configuration for my setup?' },
      ],
    };

    const pageSuggestions = suggestions[page] || suggestions.chat;

    // Add contextual suggestions based on state
    const contextual: Array<{ label: string; prompt: string; research?: boolean }> = [];

    if (!hasModel && page === 'chat') {
      contextual.unshift({ label: 'Pick a model', prompt: 'Help me choose the best model for my needs' });
    }

    if (!hasSources && page !== 'data-sources') {
      contextual.push({ label: 'Connect data sources', prompt: 'Help me connect my first data source' });
    }

    if (deepResearch) {
      contextual.push(
        { label: 'Explain search strategy', prompt: 'Explain the search strategy used in this research', research: true },
        { label: 'Summarize findings', prompt: 'Summarize the key findings from this research', research: true },
        { label: 'Find related topics', prompt: 'Find related topics to explore further', research: true },
      );
    }

    // Combine and limit
    const all = [...contextual, ...pageSuggestions];
    return all.slice(0, 6); // Limit to 6 suggestions
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) return null;

  const handleClick = (suggestion: { label: string; prompt: string; research?: boolean }) => {
    const contextualPrompt = buildContextualPrompt(suggestion.prompt, context);
    onSend(contextualPrompt, suggestion.research ?? deepResearch);
  };

  return (
    <div className="assistant-suggestions" role="list" aria-label="Suggested actions">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="assistant-suggestion-chip"
          onClick={() => handleClick(suggestion)}
          disabled={disabled}
          role="listitem"
          type="button"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}

// Persistent suggested actions that appear above input
export function PersistentSuggestions({ onSend, disabled, context }: SuggestedActionsProps) {
  const { deepResearch } = useAppStore();
  const hookContext = useAssistantContext();
  const ctx = context || hookContext;

  // Always-available core actions
  const coreActions = [
    { label: 'Explain this', prompt: 'Explain the last response in simpler terms' },
    { label: 'Give example', prompt: 'Give me a concrete example' },
    { label: 'Step by step', prompt: 'Break this down step by step' },
    { label: 'What next?', prompt: 'What should I do or ask next?' },
  ];

  // Deep Research specific
  const researchActions = deepResearch
    ? [
        { label: 'Summarize', prompt: 'Summarize the key findings', research: true },
        { label: 'Sources', prompt: 'List the sources used', research: true },
        { label: 'Related', prompt: 'Find related topics to explore', research: true },
      ]
    : [];

  const allActions = [...coreActions, ...researchActions].slice(0, 5);

  const handleClick = (action: { label: string; prompt: string; research?: boolean }) => {
    const contextualPrompt = buildContextualPrompt(action.prompt, ctx);
    onSend(contextualPrompt, action.research ?? deepResearch);
  };

  return (
    <div className="assistant-persistent-suggestions" role="list" aria-label="Quick actions">
      {allActions.map((action, index) => (
        <button
          key={index}
          className="assistant-suggestion-chip"
          onClick={() => handleClick(action)}
          disabled={disabled}
          role="listitem"
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}