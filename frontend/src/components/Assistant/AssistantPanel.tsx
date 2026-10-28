import { useState, useRef, useEffect, useCallback } from 'react';
import { useAssistantContext, buildContextualPrompt } from '../../lib/context.tsx';
import { useAppStore } from '../../lib/store';
import { useAssistant } from '../../hooks/useAssistant';
import { AssistantHeader } from './AssistantHeader';
import { WelcomeMessage } from './WelcomeMessage';
import { SuggestedActions, PersistentSuggestions } from './SuggestedActions';
import { MessageBubble } from '../Chat/MessageBubble';
import type { ChatMessage, StreamState } from '../../types';
import type { AssistantContext } from '../../lib/context.tsx';

interface AssistantPanelProps {
  isOpen: boolean;
  minimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function AssistantPanel({
  isOpen,
  minimized,
  onClose,
  onMinimize,
}: AssistantPanelProps) {
  const {
    assistantMessages,
    assistantStreamState,
    assistantContext,
    assistantName,
    assistantAvatar,
    selectedModel,
    deepResearch,
    addAssistantMessage,
    updateAssistantStream,
    resetAssistantStream,
    clearAssistantMessages,
    setAssistantContext,
  } = useAppStore();

  const hookContext = useAssistantContext();
  const context = assistantContext || hookContext;

  const { sendMessage, stopStreaming, isStreaming } = useAssistant();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, assistantStreamState.content]);

  // Update context in store when it changes
  useEffect(() => {
    setAssistantContext(context);
  }, [context, setAssistantContext]);

  const handleSend = useCallback(
    async (prompt: string, isResearch?: boolean) => {
      if (!prompt.trim() || isStreaming) return;

      setShowWelcome(false);
      setInputValue('');
      inputRef.current?.focus();

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        isResearch,
      };
      addAssistantMessage(userMessage);

      // Reset stream state
      resetAssistantStream();
      updateAssistantStream({ isStreaming: true, phase: 'starting', content: '' });

      // Send to backend
      await sendMessage(prompt, isResearch ?? deepResearch);
    },
    [
      isStreaming,
      deepResearch,
      context,
      addAssistantMessage,
      updateAssistantStream,
      resetAssistantStream,
      sendMessage,
    ],
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleSuggestionClick = (prompt: string, isResearch?: boolean) => {
    handleSend(prompt, isResearch);
  };

  const handleModelClick = () => {
    // Open command palette for model selection
    useAppStore.getState().setCommandPaletteOpen(true);
  };

  const handleToggleDeepResearch = () => {
    useAppStore.getState().setDeepResearch(!deepResearch);
  };

  if (!isOpen) return null;

  const isMobile = context.viewport.width < 768;

  return (
    <aside
      className={`assistant-panel ${minimized ? 'minimized' : ''} ${isMobile ? 'mobile' : ''}`}
      role="complementary"
      aria-label="AI Assistant"
    >
      {!minimized && (
        <>
          <AssistantHeader
            onClose={onClose}
            onMinimize={onMinimize}
            minimized={minimized}
            onToggleDeepResearch={handleToggleDeepResearch}
            deepResearch={deepResearch}
            selectedModel={selectedModel}
            onModelClick={handleModelClick}
          />

          <div className="assistant-messages" role="log" aria-live="polite" aria-label="Conversation">
            {assistantMessages.length === 0 && !isStreaming && assistantStreamState.content === '' ? (
              <WelcomeMessage context={context} />
            ) : (
              <>
                {assistantMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={false}
                  />
                ))}

                {isStreaming && (
                  <MessageBubble
                    key="streaming"
                    message={{
                      id: 'streaming',
                      role: 'assistant',
                      content: assistantStreamState.content,
                      timestamp: Date.now(),
                      isResearch: deepResearch,
                    }}
                    isStreaming={true}
                    streamState={assistantStreamState}
                  />
                )}

                <div ref={messagesEndRef} />
              </>
            )}

            {/* Persistent suggestions above input when not streaming */}
            {!isStreaming && assistantMessages.length > 0 && (
              <PersistentSuggestions
                onSend={handleSuggestionClick}
                disabled={isStreaming}
                context={context}
              />
            )}
          </div>

          {/* Input Area */}
          <div className="assistant-input-area">
            <SuggestedActions
              onSend={handleSuggestionClick}
              disabled={isStreaming}
              context={context}
            />

            <div className="assistant-input-wrapper">
              <textarea
                ref={inputRef}
                className="assistant-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  isStreaming
                    ? 'Generating response...'
                    : `Ask ${assistantName} anything...`
                }
                disabled={isStreaming}
                rows={1}
                aria-label="Message input"
              />

              <div className="assistant-input-actions">
                {isStreaming ? (
                  <button
                    className="assistant-send-btn stop"
                    onClick={stopStreaming}
                    aria-label="Stop generation"
                    title="Stop"
                  >
                    ■
                  </button>
                ) : (
                  <button
                    className="assistant-send-btn"
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || isStreaming}
                    aria-label="Send message"
                    title="Send"
                  >
                    ➤
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {minimized && (
        <button
          className="assistant-minimized-tab"
          onClick={onMinimize}
          aria-label={`Open ${assistantName}`}
        >
          {assistantAvatar} {assistantName}
        </button>
      )}
    </aside>
  );
}