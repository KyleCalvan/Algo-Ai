'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  VisualizationBlock,
  VisualizationSpec,
  VisualizationType,
  VisualizationControls,
  GraphSpec,
  ChartSpec,
  AlgorithmSpec,
  MathSpec,
  TableSpec,
  DiagramSpec,
} from '../../types/visualization';
import { GraphVisualization } from './GraphVisualization';
import { ChartVisualization } from './ChartVisualization';
import { AlgorithmVisualization } from './AlgorithmVisualization';
import { MathVisualization } from './MathVisualization';

// ============================================================================
// Table Visualization (Simple Data Table)
// ============================================================================

interface TableVisualizationProps {
  spec: TableSpec;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
}

export const TableVisualization: React.FC<TableVisualizationProps> = ({
  spec,
  controls = {},
  onInteraction,
  className = '',
  height = 300,
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = spec.pageSize || 20;

  const { columns, data, sortable = true, paginated = true, striped = true, hoverable = true } = spec;

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = paginated
    ? sortedData.slice(page * pageSize, (page + 1) * pageSize)
    : sortedData;

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    onInteraction?.({ type: 'sort', key, direction: sortConfig?.direction });
  }, [sortConfig, onInteraction]);

  const isDark = document.documentElement.classList.contains('dark');
  const headerBg = isDark ? '#1e293b' : '#f1f5f9';
  const rowBg = isDark ? '#0f172a' : '#ffffff';
  const altRowBg = isDark ? '#1e293b' : '#f8fafc';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      className={`table-visualization ${className}`}
      style={{ width: '100%', height, overflow: 'hidden', background: rowBg, borderRadius: 8 }}
    >
      <div style={{ overflow: 'auto', maxHeight: height - (paginated && totalPages > 1 ? 50 : 0) }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: headerBg }}>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  style={{
                    padding: '10px 12px',
                    textAlign: col.align || 'left',
                    fontWeight: 600,
                    color: textColor,
                    borderBottom: `2px solid ${borderColor}`,
                    cursor: sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    minWidth: col.width || 100,
                  }}
                  onClick={() => sortable && handleSort(col.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.header}
                    {sortable && col.sortable !== false && (
                      <span style={{ opacity: sortConfig?.key === col.key ? 1 : 0.3, fontSize: 10 }}>
                        {sortConfig?.key === col.key
                          ? sortConfig.direction === 'asc'
                            ? '↑'
                            : '↓'
                          : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                style={{
                  background: striped && rowIndex % 2 === 1 ? altRowBg : 'transparent',
                  transition: 'background 0.15s',
                }}
                onClick={() => onInteraction?.({ type: 'row_click', row, index: rowIndex })}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '8px 12px',
                      textAlign: col.align || 'left',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: col.width || 200,
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]?.toString() ?? ''}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: mutedColor }}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '8px 16px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: headerBg,
          }}
        >
          <span style={{ fontSize: 12, color: mutedColor }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: rowBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                color: textColor,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: rowBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                color: textColor,
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages - 1 ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// Diagram Visualization (Mermaid-style / Flowchart)
// ============================================================================

interface DiagramVisualizationProps {
  spec: DiagramSpec;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
}

export const DiagramVisualization: React.FC<DiagramVisualizationProps> = ({
  spec,
  controls = {},
  onInteraction,
  className = '',
  height = 400,
}) => {
  // For now, render as a graph using GraphVisualization
  // In the future, could integrate Mermaid or a dedicated flowchart library
  // DiagramSpec has `definition` (mermaid syntax) not nodes/edges directly
  // We'll render a placeholder that could parse mermaid

  return (
    <div
      className={`diagram-visualization ${className}`}
      style={{
        width: '100%',
        height,
        background: '#f8fafc',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{spec.type.charAt(0).toUpperCase() + spec.type.slice(1)} Diagram</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Mermaid rendering coming soon
        </div>
        <pre style={{ marginTop: 16, textAlign: 'left', background: '#fff', padding: 12, borderRadius: 4, overflow: 'auto', fontSize: 11, maxWidth: '100%' }}>
          {spec.definition}
        </pre>
      </div>
    </div>
  );
};

// ============================================================================
// Spec normalisation / diagnosis (LLM output is often slightly off-shape)
// ============================================================================

const INNER_MARKERS: Record<string, string[]> = {
  graph: ['nodes'],
  chart: ['data', 'xKey'],
  algorithm: ['steps'],
  math: ['expressions'],
  table: ['columns'],
  diagram: ['definition'],
};

function normalizeSpec(type: string, rawSpec: any): any {
  let spec = rawSpec;
  if (typeof spec === 'string') {
    try { spec = JSON.parse(spec); } catch { return rawSpec; }
  }
  if (!spec || typeof spec !== 'object') return spec;
  // Already wrapped: { algorithm: {...} }
  if (spec[type]) return spec;
  // Unwrapped: the spec itself is the inner object -> wrap it
  const markers = INNER_MARKERS[type] || [];
  if (markers.some((k) => k in spec)) return { ...spec, [type]: spec };
  return spec;
}

function isSpecValid(type: string, spec: any): boolean {
  if (!spec) return false;
  switch (type) {
    case 'graph': return !!spec.graph?.nodes?.length;
    case 'chart': return !!spec.chart?.data?.length;
    case 'algorithm': return !!spec.algorithm?.steps?.length;
    case 'math': return !!spec.math?.expressions?.length;
    case 'table': return !!spec.table?.columns?.length;
    case 'diagram': return !!spec.diagram?.definition;
    default: return false;
  }
}

function describeProblem(type: string, spec: any): string {
  if (!spec) return 'spec is empty';
  const keys = Object.keys(spec);
  if (!spec[type]) return `expected spec.${type} but spec has keys: [${keys.join(', ') || 'none'}]`;
  const need = INNER_MARKERS[type]?.[0];
  const inner = spec[type];
  if (need && !(inner[need]?.length)) {
    return `spec.${type}.${need} is missing or empty (found: [${Object.keys(inner).join(', ')}])`;
  }
  return 'unknown problem';
}

// ============================================================================
// Error boundary (so a crashing visualization shows an error, not a blank box)
// ============================================================================

class VizErrorBoundary extends React.Component<
  { type: string; className?: string; height?: number; resetKey?: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(`[VisualizationRenderer] ${this.props.type} crashed:`, error); }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={`viz-error ${this.props.className || ''}`} style={{ minHeight: this.props.height || 120, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 12 }}>
        <strong>Failed to render {this.props.type} visualization</strong>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{this.state.error.message}</pre>
      </div>
    );
  }
}

// ============================================================================
// VisualizationRenderer - Main Dispatcher
// ============================================================================

interface VisualizationRendererProps {
  block: VisualizationBlock;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
  // For streaming: partial spec that gets completed over time
  isStreaming?: boolean;
  onMount?: (blockId: string) => void;
}

export const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({
  block,
  controls = {},
  onInteraction,
  className = '',
  height,
  isStreaming = false,
  onMount,
}) => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = block.type;
  const spec = useMemo(() => normalizeSpec(type, block.spec), [type, block.spec]);

  // Validate spec
  const isValid = useMemo(() => isSpecValid(type, spec), [spec, type]);

  useEffect(() => {
    onMount?.(block.id);
    setMounted(true);
  }, [block.id]);

  // Render appropriate visualization
  const renderViz = useCallback(() => {
    const commonProps = {
      controls,
      onInteraction,
      className,
      height,
    };

    switch (type) {
      case 'graph':
        return spec.graph ? <GraphVisualization spec={spec.graph} {...commonProps} hint={`${block.title ?? ''} ${block.description ?? ''}`} /> : null;
      case 'chart':
        return spec.chart ? <ChartVisualization spec={spec.chart} {...commonProps} /> : null;
      case 'algorithm':
        return spec.algorithm ? <AlgorithmVisualization spec={spec.algorithm} {...commonProps} /> : null;
      case 'math':
        return spec.math ? <MathVisualization spec={spec.math} {...commonProps} /> : null;
      case 'table':
        return spec.table ? <TableVisualization spec={spec.table} {...commonProps} /> : null;
      case 'diagram':
        return spec.diagram ? <DiagramVisualization spec={spec.diagram} {...commonProps} /> : null;
      default:
        return null;
    }
  }, [type, spec, controls, onInteraction, className, height]);

  // An 'algorithm' block with no steps can still show its graph (we generate Back/Next steps ourselves)
  const fallbackGraph: any =
    type === 'algorithm' && !isValid
      ? [spec?.graph, spec?.algorithm?.initialState?.graph, spec?.algorithm?.steps?.[0]?.state?.graph].find((g) => g?.nodes?.length)
      : undefined;
  const fallbackToGraph = !!fallbackGraph;

  // Handle streaming - wait for valid spec
  if (isStreaming && !isValid) {
    return (
      <div
        className={`viz-streaming ${className}`}
        style={{
          height: height || 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: 8,
          gap: 12,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 28,
            height: 28,
            border: '3px solid #e2e8f0',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
          }}
        />
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {type === 'algorithm' ? 'Preparing animation...' : `Building ${type} visualization...`}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`viz-error ${className}`}
        style={{
          height: height || 150,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: 16,
          gap: 8,
        }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2}>
          <circle cx={12} cy={12} r={10} />
          <line x1={12} y1={8} x2={12} y2={12} />
          <line x1={12} y1={16} x2={12.01} y2={16} />
        </svg>
        <span style={{ fontSize: 13, color: '#dc2626', textAlign: 'center' }}>
          Failed to render {type} visualization
        </span>
        <details style={{ fontSize: 11, color: '#991b1b', textAlign: 'left', maxWidth: 400 }}>
          <summary>Error details</summary>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{error}</pre>
        </details>
      </div>
    );
  }

  if (!isValid && fallbackToGraph) {
    return (
      <GraphVisualization
        spec={{ ...fallbackGraph, algorithm: fallbackGraph.algorithm ?? spec?.algorithm?.algorithm }}
        hint={`${block.title ?? ''} ${block.description ?? ''} ${spec?.algorithm?.algorithm ?? ''}`}
        controls={controls}
        onInteraction={onInteraction}
        className={className}
        height={height}
      />
    );
  }

  if (!isValid) {
    return (
      <div
        className={`viz-invalid ${className}`}
        style={{
          minHeight: height || 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 8,
          color: '#92400e',
          fontSize: 13,
          padding: 16,
          textAlign: 'center',
        }}
      >
        <div>
          Invalid or incomplete {type} visualization spec
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.85 }}>{describeProblem(type, spec)}</div>
          <details style={{ marginTop: 6, textAlign: 'left', fontSize: 11 }}>
            <summary style={{ cursor: 'pointer' }}>Raw spec</summary>
            <pre style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{(() => { try { return JSON.stringify(block.spec, null, 2); } catch { return String(block.spec); } })()}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`visualization-renderer ${className}`}
        style={{ width: '100%' }}
        onClick={(e) => e.stopPropagation()} // Prevent event bubbling to message bubble
      >
        <VizErrorBoundary type={type} className={className} height={height} resetKey={block.id}>
          {renderViz()}
        </VizErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// Multi-Block Renderer (for messages with multiple visualizations)
// ============================================================================

interface VisualizationListProps {
  blocks: VisualizationBlock[];
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  // Gap between visualizations
  gap?: number;
}

export const VisualizationList: React.FC<VisualizationListProps> = ({
  blocks,
  controls = {},
  onInteraction,
  className = '',
  gap = 12,
}) => {
  return (
    <div
      className={`visualization-list ${className}`}
      style={{ display: 'flex', flexDirection: 'column', gap }}
    >
      {blocks.map((block, index) => (
        <VisualizationRenderer
          key={block.id || index}
          block={block}
          controls={controls}
          onInteraction={(interaction) => onInteraction?.({ ...interaction, blockIndex: index })}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Visualization Card Wrapper (for expandable/collapsible)
// ============================================================================

interface VisualizationCardProps {
  block: VisualizationBlock;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
}

export const VisualizationCard: React.FC<VisualizationCardProps> = ({
  block,
  title,
  collapsible = true,
  defaultExpanded = true,
  controls = {},
  onInteraction,
  className = '',
  height,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className={`viz-card ${className}`}
      style={{ borderRadius: 12, overflow: 'hidden', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {collapsible && (
        <motion.button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#f8fafc',
            border: 'none',
            borderBottom: '1px solid #e2e8f0',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          whileHover={{ background: '#f1f5f9' }}
          whileTap={{ scale: 0.99 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.span
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-block', color: '#64748b' }}
            >
              ▶
            </motion.span>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
              {title || block.type.charAt(0).toUpperCase() + block.type.slice(1)}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                background: '#e2e8f0',
                color: '#64748b',
                borderRadius: 4,
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              {block.type}
            </span>
          </div>
          {block.spec && 'description' in block.spec && (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {(block.spec as any).description}
            </span>
          )}
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <VisualizationRenderer
              block={block}
              controls={controls}
              onInteraction={onInteraction}
              height={height}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VisualizationRenderer;