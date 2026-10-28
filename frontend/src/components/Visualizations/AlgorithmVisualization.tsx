'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  AlgorithmSpec,
  AlgorithmStep,
  AlgorithmState,
  VisualizationControls,
  AlgorithmType,
} from '../../types/visualization';
import { GraphVisualization, createGraphSpec } from './GraphVisualization';
import { ChartVisualization, createChartSpec } from './ChartVisualization';

// ============================================================================
// Array Visualization for Sorting Algorithms
// ============================================================================

interface ArrayVisualizationProps {
  array: number[];
  highlight?: { indices: number[]; color?: string; label?: string }[];
  comparing?: number[];
  swapping?: number[];
  sorted?: number[];
  pivot?: number;
  height?: number;
}

const ArrayVisualization: React.FC<ArrayVisualizationProps> = ({
  array,
  highlight = [],
  comparing = [],
  swapping = [],
  sorted = [],
  pivot,
  height = 80,
}) => {
  const maxValue = Math.max(...array, 1);
  const barWidth = Math.max(2, Math.floor(340 / array.length) - 2);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        height,
        padding: '16px 8px',
        background: 'rgba(0,0,0,0.02)',
        borderRadius: 8,
        overflowX: 'auto',
      }}
    >
      {array.map((value, index) => {
        const isComparing = comparing.includes(index);
        const isSwapping = swapping.includes(index);
        const isSorted = sorted.includes(index);
        const isPivot = pivot === index;
        const hl = highlight.find(h => h.indices.includes(index));

        let bgColor = '#6366f1';
        if (isPivot) bgColor = '#f59e0b';
        else if (isSorted) bgColor = '#22c55e';
        else if (isSwapping) bgColor = '#ef4444';
        else if (isComparing) bgColor = '#3b82f6';
        else if (hl) bgColor = hl.color || '#8b5cf6';

        const barHeight = Math.max(4, (value / maxValue) * (height - 32));

        return (
          <motion.div
            key={index}
            style={{
              width: barWidth,
              height: barHeight,
              background: bgColor,
              borderRadius: '3px 3px 0 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 4,
              transition: 'all 0.2s ease',
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.02 }}
            whileHover={{ scaleY: 1.05 }}
          >
            <span
              style={{
                fontSize: Math.max(8, barWidth - 2),
                fontWeight: 600,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                transform: 'translateY(-100%)',
                textShadow: '0 1px 2px rgba(255,255,255,0.5)',
              }}
            >
              {value}
            </span>
            {hl?.label && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: 7,
                  color: hl.color || '#64748b',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transform: 'translateY(-120%)',
                }}
              >
                {hl.label}
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Tree Visualization for BST/Tree Operations
// ============================================================================

interface TreeNodeVizProps {
  value: string | number;
  left?: TreeNodeVizProps;
  right?: TreeNodeVizProps;
  highlight?: 'current' | 'target' | 'parent' | 'found';
  x?: number;
  y?: number;
  spacing?: number;
}

const TreeNodeViz: React.FC<TreeNodeVizProps> = ({
  value,
  left,
  right,
  highlight,
  x = 0,
  y = 0,
  spacing = 60,
}) => {
  const colors = {
    current: '#ef4444',
    target: '#f59e0b',
    parent: '#3b82f6',
    found: '#22c55e',
    default: '#6366f1',
  };

  const bgColor = highlight ? colors[highlight] : colors.default;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Edges to children */}
      {left && (
        <motion.line
          x1={0}
          y1={30}
          x2={-spacing}
          y2={60}
          stroke="#94a3b8"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {right && (
        <motion.line
          x1={0}
          y1={30}
          x2={spacing}
          y2={60}
          stroke="#94a3b8"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Node */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.1 }}
      >
        <circle
          r={22}
          fill={bgColor}
          stroke={highlight ? '#fff' : 'transparent'}
          strokeWidth={highlight ? 3 : 0}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={14}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          {value}
        </text>
      </motion.g>

      {/* Children */}
      {left && (
        <TreeNodeViz
          value={left.value}
          left={left.left}
          right={left.right}
          highlight={left.highlight}
          x={-spacing}
          y={60}
          spacing={spacing * 0.65}
        />
      )}
      {right && (
        <TreeNodeViz
          value={right.value}
          left={right.left}
          right={right.right}
          highlight={right.highlight}
          x={spacing}
          y={60}
          spacing={spacing * 0.65}
        />
      )}
    </g>
  );
};

interface TreeVisualizationProps {
  root: TreeNodeVizProps | null;
  width?: number;
  height?: number;
}

const TreeVisualization: React.FC<TreeVisualizationProps> = ({ root, width = 400, height = 300 }) => {
  if (!root) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Empty Tree</div>;

  return (
    <div style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 20 }}>
      <svg width={width} height={height} style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
        <TreeNodeViz {...root} x={width / 2} y={0} spacing={width / 4} />
      </svg>
    </div>
  );
};

// ============================================================================
// Linked List Visualization
// ============================================================================

interface ListNodeVizProps {
  value: number;
  next?: ListNodeVizProps;
  highlight?: 'current' | 'target' | 'prev' | 'next';
  index: number;
}

const ListNodeViz: React.FC<ListNodeVizProps> = ({ value, next, highlight, index }) => {
  const colors = {
    current: '#ef4444',
    target: '#f59e0b',
    prev: '#3b82f6',
    next: '#8b5cf6',
    default: '#6366f1',
  };

  const bgColor = highlight ? colors[highlight] : colors.default;
  const nodeWidth = 70;
  const nodeHeight = 40;

  return (
    <motion.g
      transform={`translate(${index * (nodeWidth + 30)}, 0)`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Node box */}
      <motion.rect
        x={0}
        y={0}
        width={nodeWidth}
        height={nodeHeight}
        rx={6}
        fill={bgColor}
        stroke={highlight ? '#fff' : 'transparent'}
        strokeWidth={highlight ? 3 : 0}
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        whileHover={{ scale: 1.05, originX: nodeWidth / 2, originY: nodeHeight / 2 }}
      />
      <text
        x={nodeWidth / 2}
        y={nodeHeight / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={14}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
      >
        {value}
      </text>

      {/* Next pointer arrow */}
      {next && (
        <motion.path
          d={`M ${nodeWidth} ${nodeHeight / 2} Q ${nodeWidth + 15} ${nodeHeight / 2} ${nodeWidth + 30} ${nodeHeight / 2}`}
          stroke="#94a3b8"
          strokeWidth={2}
          fill="none"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: index * 0.1 + 0.2 }}
        />
      )}

      {/* Index label */}
      <text
        x={nodeWidth / 2}
        y={nodeHeight + 16}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={10}
        fontFamily="system-ui, sans-serif"
      >
        [{index}]
      </text>
    </motion.g>
  );
};

interface LinkedListVisualizationProps {
  head: ListNodeVizProps | null;
  width?: number;
  height?: number;
}

const LinkedListVisualization: React.FC<LinkedListVisualizationProps> = ({ head, width = 500, height = 100 }) => {
  if (!head) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Empty List</div>;

  return (
    <div style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <marker id="arrowhead" markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
        <ListNodeViz {...head} index={0} />
      </svg>
    </div>
  );
};

// ============================================================================
// AlgorithmVisualization Main Component
// ============================================================================

interface AlgorithmVisualizationProps {
  spec: AlgorithmSpec;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
}

export const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({
  spec,
  controls = {},
  onInteraction,
  className = '',
  height = 500,
}) => {
  const [currentStep, setCurrentStep] = useState(spec.currentStep || 0);
  const [isPlaying, setIsPlaying] = useState(spec.autoPlay || false);
  const [speed, setSpeed] = useState(spec.speed || 1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // FIX: was never set -> stuck on spinner

  const steps = spec.steps || [];
  const currentStepData = steps[currentStep];
  const totalSteps = steps.length;

  const animationRef = useRef<number | null>(null);
  const stepDurationRef = useRef(1000 / speed);

  // Update step duration when speed changes
  useEffect(() => {
    stepDurationRef.current = 1000 / speed;
  }, [speed]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      animationRef.current = window.setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      }, stepDurationRef.current);
    } else if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, currentStep, totalSteps]);

  // Sync with spec changes (for streaming updates)
  useEffect(() => {
    if (spec.currentStep !== undefined && spec.currentStep !== currentStep) {
      setCurrentStep(spec.currentStep);
    }
  }, [spec.currentStep]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    onInteraction?.({ type: 'play_pause', playing: !isPlaying });
  }, [isPlaying, onInteraction]);

  const handleStepForward = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      onInteraction?.({ type: 'step_forward', step: currentStep + 1 });
    }
  }, [currentStep, totalSteps, onInteraction]);

  const handleStepBackward = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      onInteraction?.({ type: 'step_backward', step: currentStep - 1 });
    }
  }, [currentStep, onInteraction]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    onInteraction?.({ type: 'reset' });
  }, [onInteraction]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    onInteraction?.({ type: 'speed_change', speed: newSpeed });
  }, [onInteraction]);

  // Render visualization based on algorithm type
  const renderVisualization = useCallback(() => {
    if (!currentStepData) return null;

    const { state, highlight, operations } = currentStepData;
    const algorithmType = spec.type;

    // Sorting algorithms - render array
    if (algorithmType === 'sorting') {
      const array = (state?.array || []) as number[];
      const ops = operations || [];
      const comparing = highlight?.arrayIndices?.filter(i => ops.some(op => op.type === 'compare' && op.elements.includes(i))) || [];
      const swapping = highlight?.arrayIndices?.filter(i => ops.some(op => op.type === 'swap' && op.elements.includes(i))) || [];
      const sorted = state?.sortedIndices || [];
      const pivot = state?.pivotIndex;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <ArrayVisualization
            array={array}
            comparing={comparing}
            swapping={swapping}
            sorted={sorted}
            pivot={pivot}
            height={120}
          />
          {state?.auxArray && (
            <ArrayVisualization
              array={state.auxArray}
              highlight={[{ indices: [state.auxIndex || 0], color: '#8b5cf6', label: 'aux' }]}
              height={60}
            />
          )}
        </div>
      );
    }

    // Tree algorithms - render tree
    if (algorithmType === 'tree') {
      const treeData = state?.tree;
      if (treeData) {
        return <TreeVisualization root={treeData} width={400} height={300} />;
      }
    }

    // Graph algorithms - render graph
    if (algorithmType === 'graph') {
      const graphState = state?.graph;
      if (graphState) {
        const graphSpec = createGraphSpec(graphState.nodes, graphState.edges, {
          algorithm: spec.algorithm,
          highlight: {
            nodes: highlight?.nodeIds || [],
            edges: highlight?.edgeIds || [],
          },
        });
        return <GraphVisualization spec={graphSpec} height={350} stepping={false} />;
      }
    }

    // Recursion algorithms - render call stack/tree
    if (algorithmType === 'recursion') {
      const graphState = state?.graph;
      if (graphState) {
        const graphSpec = createGraphSpec(graphState.nodes, graphState.edges, {
          layout: 'hierarchical',
          algorithm: spec.algorithm,
          highlight: {
            nodes: highlight?.nodeIds || [],
            edges: highlight?.edgeIds || [],
          },
        });
        return <GraphVisualization spec={graphSpec} height={400} stepping={false} />;
      }
    }

    // Searching algorithms - could be array or tree
    if (algorithmType === 'searching') {
      const array = state?.array as number[] | undefined;
      if (array) {
        const comparing = highlight?.arrayIndices || [];
        return <ArrayVisualization array={array} comparing={comparing} height={100} />;
      }
    }

    // Custom - render generic state
    return (
      <div style={{ padding: 16, color: '#64748b', fontSize: 14 }}>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    );
  }, [currentStepData, spec.type]);

  if (!mounted) {
    return (
      <div
        className={`algo-viz-loading ${className}`}
        style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8, gap: 16 }}
      >
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
        <span style={{ color: '#64748b', fontSize: 14 }}>Preparing visualization...</span>
      </div>
    );
  }

  return (
    <div
      className={`algorithm-visualization ${className}`}
      style={{ width: '100%', height, display: 'flex', flexDirection: 'column', background: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}
    >
      {/* Header with Algorithm Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {String(spec.algorithm || spec.type || 'a').charAt(0).toUpperCase()}
          </motion.span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
              {String(spec.algorithm || spec.type || 'algorithm').replace(/-/g, ' ')}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {spec.type} algorithm
            </div>
          </div>
        </div>

        {/* Step Description */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: 1,
            minWidth: 150,
            textAlign: 'right',
            fontSize: 12,
            opacity: 0.9,
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
          }}
        >
          Step {currentStep + 1} / {totalSteps}
        </motion.div>
      </motion.div>

      {/* Visualization Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          overflow: 'auto',
          position: 'relative',
          minHeight: 200,
        }}
      >
        <AnimatePresence mode="wait">
          {renderVisualization()}
        </AnimatePresence>

        {/* Step Description Overlay */}
        {currentStepData?.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              bottom: controls.playPause ? 80 : 16,
              left: 16,
              right: 16,
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#f1f5f9',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.5,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxHeight: '40%',
              overflow: 'auto',
            }}
          >
            {currentStepData.description}
          </motion.div>
        )}
      </motion.div>

      {/* Controls */}
      <AnimatePresence mode="wait">
        {(controls.playPause !== false || controls.stepForward !== false || controls.stepBackward !== false || controls.reset !== false || controls.speedControl !== false) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              padding: '12px 16px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {controls.stepBackward !== false && (
              <button
                onClick={handleStepBackward}
                disabled={currentStep === 0}
                style={{
                  padding: '8px 12px',
                  background: currentStep === 0 ? '#f1f5f9' : '#ffffff',
                  color: currentStep === 0 ? '#94a3b8' : '#334155',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                }}
                aria-label="Step backward"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="19 18 9 12 19 6" />
                  <line x1="5" y1="18" x2="5" y2="6" />
                </svg>
                <span>Back</span>
              </button>
            )}

            {controls.playPause !== false && (
              <motion.button
                onClick={handlePlayPause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 20px',
                  background: isPlaying ? '#ef4444' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <>
                    <span style={{ display: 'flex', gap: 3 }}>
                      <div style={{ width: 4, height: 14, background: 'currentColor', animation: 'pause 1.5s infinite' }} />
                      <div style={{ width: 4, height: 14, background: 'currentColor', animation: 'pause 1.5s infinite 0.3s' }} />
                    </span>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                    <span>Play</span>
                  </>
                )}
              </motion.button>
            )}

            {controls.stepForward !== false && (
              <button
                onClick={handleStepForward}
                disabled={currentStep >= totalSteps - 1}
                style={{
                  padding: '8px 12px',
                  background: currentStep >= totalSteps - 1 ? '#f1f5f9' : '#ffffff',
                  color: currentStep >= totalSteps - 1 ? '#94a3b8' : '#334155',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: currentStep >= totalSteps - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                }}
                aria-label="Step forward"
              >
                <span>Next</span>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="5 6 15 12 5 18" />
                  <line x1="19" y1="18" x2="19" y2="6" />
                </svg>
              </button>
            )}

            {controls.reset !== false && (
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 12px',
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                }}
                aria-label="Reset"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7" />
                </svg>
                <span>Reset</span>
              </button>
            )}

            {controls.speedControl !== false && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Speed</span>
                <input
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.25"
                  value={speed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  style={{
                    width: 100,
                    accentColor: '#6366f1',
                    cursor: 'pointer',
                  }}
                  aria-label="Animation speed"
                />
                <span style={{ fontSize: 11, color: '#64748b', minWidth: 35, textAlign: 'right' }}>
                  {speed.toFixed(2)}x
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (currentStep + 1) / totalSteps }}
        style={{
          height: 3,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          transformOrigin: 'left center',
          transition: 'transform 0.3s ease',
        }}
      />

      <style>{`
        @keyframes pause {
          0%, 100% { height: 14px; }
          50% { height: 6px; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Algorithm Spec Builder Helpers
// ============================================================================

export function createAlgorithmSpec(
  algorithm: string,
  type: AlgorithmType,
  steps: AlgorithmStep[],
  options: {
    currentStep?: number;
    speed?: number;
    autoPlay?: boolean;
    initialState?: any;
  } = {}
): AlgorithmSpec {
  return {
    type,
    algorithm,
    initialState: options.initialState,
    steps,
    currentStep: options.currentStep ?? 0,
    speed: options.speed ?? 1,
    autoPlay: options.autoPlay ?? false,
  };
}

export default AlgorithmVisualization;