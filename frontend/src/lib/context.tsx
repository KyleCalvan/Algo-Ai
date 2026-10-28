import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import type { CachedConnector } from './store';
import type { LiveEnergyMetrics, ChatMessage } from '../types';
import type { ManagedAgent } from './api';

export type AssistantContext = {
  currentPage: string;
  activeConversationId: string | null;
  selectedModel: string;
  deepResearch: boolean;
  hasConnectedSources: boolean;
  liveEnergy: LiveEnergyMetrics | null;
  viewport: { width: number; height: number };
  pageContext?: {
    dashboard?: { stats: any };
    agents?: { selectedAgent: ManagedAgent | null; agents: ManagedAgent[] };
    dataSources?: { connectors: CachedConnector[] };
    settings?: { section: string };
  };
}

const STORAGE_KEY = 'openjarvis-assistant-settings';

interface AssistantSettings {
  name: string;
  avatar: string;
  isMinimized: boolean;
  isOpen: boolean;
}

const DEFAULT_SETTINGS: AssistantSettings = {
  name: 'Jarvis',
  avatar: '🤖',
  isMinimized: false,
  isOpen: false,
};

function loadAssistantSettings(): AssistantSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveAssistantSettings(settings: AssistantSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// React context for assistant settings (name, avatar, etc.)

const AssistantSettingsContext = createContext<{
  settings: AssistantSettings;
  updateSettings: (partial: Partial<AssistantSettings>) => void;
} | null>(null);

export function AssistantSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<AssistantSettings>(() =>
    loadAssistantSettings(),
  );

  const updateSettings = useCallback((partial: Partial<AssistantSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveAssistantSettings(next);
      return next;
    });
  }, []);

  return (
    <AssistantSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AssistantSettingsContext.Provider>
  );
}

export function useAssistantSettings() {
  const ctx = useContext(AssistantSettingsContext);
  if (!ctx) {
    throw new Error('useAssistantSettings must be used within AssistantSettingsProvider');
  }
  return ctx;
}

// Hook to collect current application context
export function useAssistantContext(): AssistantContext {
  const location = useLocation();
  const {
    activeId,
    selectedModel,
    deepResearch,
    liveEnergy,
    cachedConnectors,
    managedAgents,
    selectedAgentId,
  } = useAppStore();

  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine current page from route
  const currentPage = location.pathname.replace(/^\//, '') || 'chat';

  // Check if any data sources are connected
  const hasConnectedSources = cachedConnectors?.some((c) => c.connected) ?? false;

  // Build page-specific context
  const pageContext: AssistantContext['pageContext'] = {};
  if (currentPage === 'dashboard') {
    pageContext.dashboard = { stats: {} }; // Could be populated from a stats store
  } else if (currentPage === 'agents') {
    const selectedAgent = managedAgents.find((a) => a.id === selectedAgentId) ?? null;
    pageContext.agents = { selectedAgent, agents: managedAgents };
  } else if (currentPage === 'data-sources') {
    pageContext.dataSources = { connectors: cachedConnectors ?? [] };
  } else if (currentPage === 'settings') {
    // Could parse section from hash or query params
    pageContext.settings = { section: location.hash.replace('#', '') || 'general' };
  }

  return {
    currentPage,
    activeConversationId: activeId,
    selectedModel,
    deepResearch,
    hasConnectedSources,
    liveEnergy,
    viewport,
    pageContext: Object.keys(pageContext).length > 0 ? pageContext : undefined,
  };
}

// Helper to generate contextual prompts for suggested actions
export function buildContextualPrompt(
  basePrompt: string,
  context: AssistantContext,
): string {
  const parts: string[] = [
    `Current context: User is on the "${context.currentPage}" page.`,
    `Current model: ${context.selectedModel || 'default'}.`,
    `Deep Research mode: ${context.deepResearch ? 'enabled' : 'disabled'}.`,
    `Connected data sources: ${context.hasConnectedSources ? 'yes' : 'no'}.`,
  ];

  if (context.liveEnergy) {
    parts.push(
      `Live GPU: ${context.liveEnergy.power_w.toFixed(1)}W, ${(context.liveEnergy.energy_j / 1000).toFixed(2)}kJ total.`,
    );
  }

  if (context.pageContext?.agents) {
    const { selectedAgent, agents } = context.pageContext.agents;
    parts.push(
      `Available agents: ${agents.length}. ${selectedAgent ? `Selected: ${selectedAgent.name}` : 'No agent selected.'}`,
    );
  }

  if (context.pageContext?.dataSources) {
    const connected = context.pageContext.dataSources.connectors.filter((c) => c.connected).length;
    const total = context.pageContext.dataSources.connectors.length;
    parts.push(`Data connectors: ${connected}/${total} connected.`);
  }

  if (context.activeConversationId) {
    parts.push(`Active conversation ID: ${context.activeConversationId}.`);
  }

  parts.push('\n--- User Request ---');
  parts.push(basePrompt);

  return parts.join('\n');
}