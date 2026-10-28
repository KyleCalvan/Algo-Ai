import { useCallback, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { streamChat, streamResearch } from '../lib/sse';
import type { ChatMessage, StreamState, TokenUsage, MessageTelemetry, ResearchSource, ToolCallInfo } from '../types';
import type { ResearchEvent } from '../types';

export function useAssistant() {
  const {
    assistantMessages,
    assistantStreamState,
    updateAssistantStream,
    resetAssistantStream,
    addAssistantMessage,
    updateLastAssistantMessage,
    selectedModel,
    settings,
    incrementSavings,
    setLiveEnergy,
  } = useAppStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  // Track research sources
  const researchSourcesRef = useRef<ResearchSource[]>([]);

  // Convert assistant messages to the format expected by the API
  const buildHistory = useCallback(() => {
    return assistantMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }, [assistantMessages]);

  const sendMessage = useCallback(
    async (prompt: string, isResearch: boolean) => {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Track assistant message ID for saving
      let assistantMessageId: string | null = null;

      try {
        if (isResearch) {
          // Add user message
          const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: prompt,
            timestamp: Date.now(),
            isResearch: true,
          };
          addAssistantMessage(userMessage);

          // Add placeholder assistant message
          assistantMessageId = crypto.randomUUID();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isResearch: true,
          };
          addAssistantMessage(assistantMessage);

          // Reset stream state
          resetAssistantStream();
          updateAssistantStream({ isStreaming: true, phase: 'starting', content: '' });

          // Stream research
          for await (const event of streamResearch(prompt, signal)) {
            if (signal.aborted) break;

            switch (event.type) {
              case 'search_call':
                updateAssistantStream({
                  phase: `Searching: ${event.arguments.query.slice(0, 50)}...`,
                });
                break;
              case 'search_result':
                if (event.sources) {
                  researchSourcesRef.current = event.sources;
                }
                updateAssistantStream({
                  phase: `Found ${event.num_hits} results`,
                });
                break;
              case 'synthesis':
                updateAssistantStream((prev: StreamState) => ({
                  content: prev.content + event.text,
                  isStreaming: true,
                }));
                break;
              case 'system_metrics':
                setLiveEnergy({
                  power_w: event.power_w,
                  energy_j: event.energy_j,
                  duration_s: event.duration_s,
                });
                break;
              case 'done':
                if (event.usage) {
                  incrementSavings(event.usage);
                }
                // Save the final assistant message
                if (assistantMessageId) {
                  updateLastAssistantMessage(
                    assistantStreamState.content,
                    undefined,
                    event.usage,
                    undefined,
                    researchSourcesRef.current.length > 0 ? researchSourcesRef.current : undefined,
                  );
                }
                updateAssistantStream({ isStreaming: false, phase: 'complete' });
                setLiveEnergy(null);
                break;
              case 'error':
                updateAssistantStream({
                  isStreaming: false,
                  phase: `Error: ${event.message}`,
                });
                setLiveEnergy(null);
                break;
            }
          }
        } else {
          // Add user message
          const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: prompt,
            timestamp: Date.now(),
            isResearch: false,
          };
          addAssistantMessage(userMessage);

          // Add placeholder assistant message
          assistantMessageId = crypto.randomUUID();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isResearch: false,
          };
          addAssistantMessage(assistantMessage);

          // Reset stream state
          resetAssistantStream();
          updateAssistantStream({ isStreaming: true, phase: 'starting', content: '' });

          // Stream chat
          const request = {
            model: selectedModel,
            messages: buildHistory(),
            stream: true as const,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
          };

          let toolCalls: ToolCallInfo[] = [];
          let usage: TokenUsage | undefined;
          let telemetry: MessageTelemetry | undefined;

          for await (const event of streamChat(request, signal)) {
            if (signal.aborted) break;

            if (event.event === 'content') {
              updateAssistantStream((prev: StreamState) => ({
                content: prev.content + event.data,
                isStreaming: true,
              }));
            } else if (event.event === 'tool_call_start') {
              // Parse the tool call data
              try {
                const toolData = JSON.parse(event.data);
                toolCalls = [
                  ...toolCalls,
                  {
                    id: toolData.id,
                    tool: toolData.tool,
                    arguments: toolData.arguments,
                    status: 'running',
                  },
                ];
                updateAssistantStream((prev: StreamState) => ({
                  activeToolCalls: [
                    ...prev.activeToolCalls,
                    {
                      id: toolData.id,
                      tool: toolData.tool,
                      arguments: toolData.arguments,
                      status: 'running',
                    },
                  ],
                }));
              } catch {
                // Ignore parse errors
              }
            } else if (event.event === 'tool_call_end') {
              try {
                const toolData = JSON.parse(event.data);
                toolCalls = toolCalls.map((tc) =>
                  tc.id === toolData.id
                    ? {
                        ...tc,
                        status: toolData.success ? 'success' : 'error',
                        result: toolData.result,
                        latency: toolData.latency,
                      }
                    : tc,
                );
                updateAssistantStream((prev: StreamState) => ({
                  activeToolCalls: prev.activeToolCalls.map((tc) =>
                    tc.id === toolData.id
                      ? {
                          ...tc,
                          status: toolData.success ? 'success' : 'error',
                          result: toolData.result,
                          latency: toolData.latency,
                        }
                      : tc,
                  ),
                }));
              } catch {
                // Ignore parse errors
              }
            } else if (event.event === 'usage') {
              try {
                usage = JSON.parse(event.data);
                if (usage) {
                  incrementSavings(usage);
                }
              } catch {
                // Ignore parse errors
              }
            } else if (event.event === 'telemetry') {
              try {
                telemetry = JSON.parse(event.data);
              } catch {
                // Ignore parse errors
              }
            } else if (event.event === 'error') {
              updateAssistantStream({
                isStreaming: false,
                phase: `Error: ${event.data}`,
              });
            } else if (event.event === 'done') {
              // Save the final assistant message
              if (assistantMessageId) {
                updateLastAssistantMessage(
                  assistantStreamState.content,
                  toolCalls.length > 0 ? toolCalls : undefined,
                  usage,
                  telemetry,
                );
              }
              updateAssistantStream({ isStreaming: false, phase: 'complete' });
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          updateAssistantStream({
            isStreaming: false,
            phase: `Error: ${error.message}`,
          });
        }
      }
    },
    [
      selectedModel,
      assistantMessages,
      assistantStreamState,
      settings.temperature,
      settings.maxTokens,
      buildHistory,
      updateAssistantStream,
      updateLastAssistantMessage,
      incrementSavings,
      setLiveEnergy,
      addAssistantMessage,
      resetAssistantStream,
    ],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    resetAssistantStream();
    setLiveEnergy(null);
  }, [resetAssistantStream, setLiveEnergy]);

  return {
    sendMessage,
    stopStreaming,
    isStreaming: assistantStreamState.isStreaming,
  };
}