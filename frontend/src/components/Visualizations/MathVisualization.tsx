'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  MathSpec,
  MathExpression,
  VisualizationControls,
} from '../../types/visualization';
import { ChartVisualization, createFunctionPlotSpec, createMultiFunctionPlotSpec } from './ChartVisualization';

// ============================================================================
// Math Expression Parser & Evaluator
// ============================================================================

interface ParsedExpression {
  fn: (x: number, params: Record<string, number>) => number;
  latex: string;
  color: string;
  name: string;
  visible: boolean;
  domain?: [number, number];
}

const MATH_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f6',
];

const MATH_COLORS_DARK = [
  '#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa',
  '#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#818cf8',
];

/**
 * Parse a math expression string into an evaluatable function
 * Supports: +, -, *, /, ^, (), sin, cos, tan, asin, acos, atan, sqrt, log, ln, exp, abs, floor, ceil, pi, e
 */
function parseExpression(expr: string): (x: number, params: Record<string, number>) => number {
  // FIX: the old implicit-multiplication regex put '*' between every pair of
  // letters, turning "Math.sin(x)" into "M*at*h.s*in*(x)" so every expression
  // threw and silently fell back to y = 0.
  let processed = expr
    .replace(/\bpi\b/g, 'PI')
    .replace(/\be\b/g, 'E')
    .replace(/\bln\b/g, 'log')
    .replace(/\^/g, '**')
    // implicit multiplication, only the safe cases: 2x, 2(x), 2sin(x), (x+1)(x-1), (x)2
    .replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2')
    .replace(/\)\s*([a-zA-Z0-9(])/g, ')*$1');
  // variable directly followed by "(" that is not a Math function: x(x+1) -> x*(x+1)
  processed = processed.replace(/\bx\s*\(/g, 'x*(');

  // Math functions/constants and user parameters resolve through `with`
  // (new Function bodies are sloppy mode, so `with` is allowed).
  return new Function('x', 'params', `
    with (Math) { with (params || {}) {
      return (${processed});
    } }
  `) as (x: number, params: Record<string, number>) => number;
}

/** Names used in an expression that are neither x nor a Math function/constant. */
function detectParams(expr: string): string[] {
  const known = new Set(['x', 'pi', 'e', 'ln', ...Object.getOwnPropertyNames(Math)]);
  const names = expr.match(/[a-zA-Z_]\w*/g) || [];
  return Array.from(new Set(names.filter((n) => !known.has(n))));
}

/**
 * Parse MathExpression array into evaluatable functions
 */
function parseExpressions(expressions: MathExpression[], colorIndex = 0): ParsedExpression[] {
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? MATH_COLORS_DARK : MATH_COLORS;

  return expressions.map((expr, i) => {
    let fn: (x: number, params: Record<string, number>) => number;
    let latex = expr.expression;
    let name = expr.label || `f${i + 1}(x)`;
    let color = expr.color || colors[(colorIndex + i) % colors.length];

    try {
      fn = parseExpression(expr.expression); // syntax errors throw here; runtime errors are handled per-point
    } catch (e) {
      // Fallback: constant function
      fn = () => 0;
      console.warn(`Failed to parse expression: ${expr.expression}`, e);
    }

    return {
      fn,
      latex,
      color,
      name,
      visible: expr.visible !== false,
      domain: expr.domain,
    };
  });
}

// ============================================================================
// SVG-based Function Plotter (Alternative to Recharts)
// ============================================================================

interface SVGPlotProps {
  expressions: ParsedExpression[];
  xRange: [number, number];
  yRange?: [number, number];
  parameters: Record<string, number>;
  width: number;
  height: number;
  showGrid?: boolean;
  showAxes?: boolean;
  interactive?: boolean;
  onPointHover?: (expr: ParsedExpression, x: number, y: number) => void;
}

const SVGPlot: React.FC<SVGPlotProps> = ({
  expressions,
  xRange,
  yRange,
  parameters,
  width,
  height,
  showGrid = true,
  showAxes = true,
  interactive = true,
  onPointHover,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ expr: ParsedExpression; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate y range if not provided
  const computedYRange = useMemo(() => {
    if (yRange) return yRange;

    let minY = Infinity;
    let maxY = -Infinity;
    const visibleExprs = expressions.filter(e => e.visible);

    if (visibleExprs.length === 0) return [-10, 10];

    // Sample to find bounds
    for (const expr of visibleExprs) {
      const domain = expr.domain || xRange;
      const start = Math.max(domain[0], xRange[0]);
      const end = Math.min(domain[1], xRange[1]);
      const steps = 200;

      for (let i = 0; i <= steps; i++) {
        const x = start + (end - start) * (i / steps);
        try {
          const y = expr.fn(x, parameters);
          if (isFinite(y)) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        } catch {
          // Ignore errors
        }
      }
    }

    if (!isFinite(minY) || !isFinite(maxY)) return [-10, 10];

    // Add 10% padding
    const range = maxY - minY;
    return [minY - range * 0.1, maxY + range * 0.1];
  }, [expressions, xRange, yRange, parameters]);

  // Coordinate transforms
  const xToPx = useCallback((x: number) => {
    return padding.left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth;
  }, [xRange, padding.left, plotWidth]);

  const yToPx = useCallback((y: number) => {
    return padding.top + plotHeight - ((y - computedYRange[0]) / (computedYRange[1] - computedYRange[0])) * plotHeight;
  }, [computedYRange, padding.top, plotHeight]);

  const pxToX = useCallback((px: number) => {
    return xRange[0] + ((px - padding.left) / plotWidth) * (xRange[1] - xRange[0]);
  }, [xRange, padding.left, plotWidth]);

  const pxToY = useCallback((py: number) => {
    return computedYRange[1] - ((py - padding.top) / plotHeight) * (computedYRange[1] - computedYRange[0]);
  }, [computedYRange, padding.top, plotHeight]);

  // Generate path data for an expression
  const generatePath = useCallback((expr: ParsedExpression) => {
    const domain = expr.domain || xRange;
    const start = Math.max(domain[0], xRange[0]);
    const end = Math.min(domain[1], xRange[1]);
    const steps = 500;
    let path = '';
    let hasValidPoint = false;

    for (let i = 0; i <= steps; i++) {
      const x = start + (end - start) * (i / steps);
      try {
        const y = expr.fn(x, parameters);
        if (isFinite(y) && y >= computedYRange[0] - 100 && y <= computedYRange[1] + 100) {
          const px = xToPx(x);
          const py = yToPx(y);
          if (!hasValidPoint) {
            path += `M ${px} ${py}`;
            hasValidPoint = true;
          } else {
            path += ` L ${px} ${py}`;
          }
        } else {
          hasValidPoint = false;
        }
      } catch {
        hasValidPoint = false;
      }
    }

    return path;
  }, [expressions, xRange, computedYRange, parameters, xToPx, yToPx]);

  // Handle mouse move for interactive hover
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check if in plot area
    if (px < padding.left || px > padding.left + plotWidth || py < padding.top || py > padding.top + plotHeight) {
      setHoveredPoint(null);
      return;
    }

    const x = pxToX(px);
    let closestPoint: { expr: ParsedExpression; x: number; y: number; dist: number } | null = null;

    for (const expr of expressions.filter(e => e.visible)) {
      try {
        const y = expr.fn(x, parameters);
        if (isFinite(y)) {
          const pointPy = yToPx(y);
          const dist = Math.abs(py - pointPy);
          if (dist < 20 && (!closestPoint || dist < closestPoint.dist)) {
            closestPoint = { expr, x, y, dist };
          }
        }
      } catch {
        // Ignore
      }
    }

    setHoveredPoint(closestPoint ? { expr: closestPoint.expr, x: closestPoint.x, y: closestPoint.y } : null);
    if (closestPoint) onPointHover?.(closestPoint.expr, closestPoint.x, closestPoint.y);
  }, [interactive, expressions, parameters, padding.left, padding.top, plotWidth, plotHeight, pxToX, yToPx, onPointHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const bgColor = isDark ? '#0f172a' : '#ffffff';

  return (
    <div style={{ width, height, position: 'relative', background: bgColor, borderRadius: 8 }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', touchAction: 'none' }}
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill={axisColor} />
          </marker>
          <clipPath id="plotArea">
            <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} />
          </clipPath>
        </defs>

        {/* Grid */}
        {showGrid && (
          <g stroke={gridColor} strokeWidth={0.5} opacity={0.5}>
            {/* Vertical grid lines */}
            {(() => {
              const lines = [];
              const xStep = (xRange[1] - xRange[0]) / 10;
              for (let i = 0; i <= 10; i++) {
                const x = xRange[0] + i * xStep;
                const px = xToPx(x);
                lines.push(
                  <line key={`vgrid-${i}`} x1={px} y1={padding.top} x2={px} y2={padding.top + plotHeight} />
                );
              }
              return lines;
            })()}

            {/* Horizontal grid lines */}
            {(() => {
              const lines = [];
              const yStep = (computedYRange[1] - computedYRange[0]) / 10;
              for (let i = 0; i <= 10; i++) {
                const y = computedYRange[0] + i * yStep;
                const py = yToPx(y);
                lines.push(
                  <line key={`hgrid-${i}`} x1={padding.left} y1={py} x2={padding.left + plotWidth} y2={py} />
                );
              }
              return lines;
            })()}
          </g>
        )}

        {/* Axes */}
        {showAxes && (
          <g stroke={axisColor} strokeWidth={2} markerEnd="url(#arrow)">
            {/* X axis */}
            <line
              x1={padding.left}
              y1={yToPx(0)}
              x2={padding.left + plotWidth}
              y2={yToPx(0)}
              style={{ display: computedYRange[0] <= 0 && computedYRange[1] >= 0 ? 'block' : 'none' }}
            />
            {/* Y axis */}
            <line
              x1={xToPx(0)}
              y1={padding.top + plotHeight}
              x2={xToPx(0)}
              y2={padding.top}
              style={{ display: xRange[0] <= 0 && xRange[1] >= 0 ? 'block' : 'none' }}
            />
          </g>
        )}

        {/* Axis Labels */}
        {showAxes && (
          <g fontSize={11} fill={textColor} fontFamily="system-ui, sans-serif">
            {/* X axis labels */}
            {(() => {
              const labels = [];
              const xStep = (xRange[1] - xRange[0]) / 10;
              for (let i = 0; i <= 10; i++) {
                const x = xRange[0] + i * xStep;
                const px = xToPx(x);
                labels.push(
                  <text
                    key={`xlabel-${i}`}
                    x={px}
                    y={padding.top + plotHeight + 20}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                  >
                    {x.toFixed(xStep < 1 ? 1 : 0)}
                  </text>
                );
              }
              return labels;
            })()}

            {/* Y axis labels */}
            {(() => {
              const labels = [];
              const yStep = (computedYRange[1] - computedYRange[0]) / 10;
              for (let i = 0; i <= 10; i++) {
                const y = computedYRange[0] + i * yStep;
                const py = yToPx(y);
                labels.push(
                  <text
                    key={`ylabel-${i}`}
                    x={padding.left - 10}
                    y={py}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {y.toFixed(yStep < 1 ? 1 : 0)}
                  </text>
                );
              }
              return labels;
            })()}

            {/* Axis titles */}
            <text
              x={width / 2}
              y={height - 8}
              textAnchor="middle"
              dominantBaseline="alphabetic"
              fontSize={12}
              fill={textColor}
            >
              x
            </text>
            <text
              x={12}
              y={height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fill={textColor}
              transform={`rotate(-90, 12, ${height / 2})`}
            >
              y
            </text>
          </g>
        )}

        {/* Function Curves */}
        <g clipPath="url(#plotArea)">
          {expressions
            .filter(e => e.visible)
            .map((expr, i) => {
              const path = generatePath(expr);
              return (
                <motion.path
                  key={expr.name}
                  d={path}
                  stroke={expr.color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  style={{
                    filter: hoveredPoint?.expr === expr ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                  }}
                />
              );
            })}
        </g>

        {/* Hover Point */}
        {hoveredPoint && (
          <g>
            <circle
              cx={xToPx(hoveredPoint.x)}
              cy={yToPx(hoveredPoint.y)}
              r={6}
              fill={hoveredPoint.expr.color}
              stroke={bgColor}
              strokeWidth={2}
            />
            <motion.rect
              x={xToPx(hoveredPoint.x) + 15}
              y={yToPx(hoveredPoint.y) - 35}
              width={140}
              height={50}
              rx={6}
              fill={isDark ? '#1e293b' : '#ffffff'}
              stroke={hoveredPoint.expr.color}
              strokeWidth={1}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            />
            <motion.text
              x={xToPx(hoveredPoint.x) + 20}
              y={yToPx(hoveredPoint.y) - 20}
              fill={isDark ? '#f1f5f9' : '#1e293b'}
              fontSize={11}
              fontFamily="system-ui, sans-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <tspan x={xToPx(hoveredPoint.x) + 20} dy="0" fontWeight={600}>{hoveredPoint.expr.name}</tspan>
              <tspan x={xToPx(hoveredPoint.x) + 20} dy="16">{`x = ${hoveredPoint.x.toFixed(3)}`}</tspan>
              <tspan x={xToPx(hoveredPoint.x) + 20} dy="16">{`y = ${hoveredPoint.y.toFixed(3)}`}</tspan>
            </motion.text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '8px 12px',
          background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderRadius: 8,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10,
          minWidth: 150,
        }}
      >
        {expressions.map((expr, i) => (
          <motion.label
            key={expr.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              color: isDark ? '#cbd5e1' : '#334155',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: 20,
                height: 3,
                background: expr.color,
                borderRadius: 2,
                opacity: expr.visible ? 1 : 0.3,
              }}
            />
            <span style={{ opacity: expr.visible ? 1 : 0.5 }}>{expr.name}</span>
          </motion.label>
        ))}
      </motion.div>
    </div>
  );
};

// ============================================================================
// Parameter Controls
// ============================================================================

interface ParameterControlsProps {
  parameters: Record<string, number>;
  onChange: (params: Record<string, number>) => void;
  ranges?: Record<string, [number, number, number?]>; // [min, max, step?]
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  parameters,
  onChange,
  ranges = {},
}) => {
  const paramEntries = Object.entries(parameters);

  if (paramEntries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      style={{
        padding: '12px 16px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Parameters:</span>
      {paramEntries.map(([key, value]) => {
        const [min = -10, max = 10, step = 0.1] = ranges[key] || [-10, 10, 0.1];
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}
          >
            <label style={{ fontSize: 12, color: '#475569', minWidth: 50, fontFamily: 'monospace' }}>
              {key}
            </label>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange({ ...parameters, [key]: Number(e.target.value) })}
              style={{
                flex: 1,
                accentColor: '#6366f1',
                cursor: 'pointer',
              }}
            />
            <input
              type="number"
              value={value}
              step={step}
              min={min}
              max={max}
              onChange={(e) => onChange({ ...parameters, [key]: Number(e.target.value) })}
              style={{
                width: 60,
                padding: '4px 8px',
                fontSize: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                background: '#ffffff',
                fontFamily: 'monospace',
              }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// ============================================================================
// MathVisualization Main Component
// ============================================================================

interface MathVisualizationProps {
  spec: MathSpec;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
}

export const MathVisualization: React.FC<MathVisualizationProps> = ({
  spec,
  controls = {},
  onInteraction,
  className = '',
  height = 400,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // FIX: was never set -> stuck on spinner
  const [parameters, setParameters] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = { ...(spec.parameters || {}) };
    for (const e of spec.expressions || []) for (const n of detectParams(e.expression)) if (!(n in p)) p[n] = 1;
    return p;
  });
  const [xRange, setXRange] = useState(spec.xRange);
  const [yRange, setYRange] = useState<[number, number] | undefined>(spec.yRange);
  const [expressions, setExpressions] = useState<ParsedExpression[]>([]);

  // Parse expressions when spec changes
  useEffect(() => {
    setExpressions(parseExpressions(spec.expressions || []));
  }, [spec.expressions]);

  // Update parameters when spec changes (streaming updates)
  useEffect(() => {
    setParameters((prev) => {
      const p: Record<string, number> = { ...prev, ...(spec.parameters || {}) };
      for (const e of spec.expressions || []) for (const n of detectParams(e.expression)) if (!(n in p)) p[n] = 1;
      return p;
    });
  }, [spec.parameters, spec.expressions]);

  const handleParameterChange = useCallback((newParams: Record<string, number>) => {
    setParameters(newParams);
    onInteraction?.({ type: 'parameter_change', parameters: newParams });
  }, [onInteraction]);

  const handleRangeChange = useCallback((newXRange: [number, number], newYRange?: [number, number]) => {
    setXRange(newXRange);
    if (newYRange) setYRange(newYRange);
    onInteraction?.({ type: 'range_change', xRange: newXRange, yRange: newYRange });
  }, [onInteraction]);

  // Collect all parameter ranges from expressions
  const allParamRanges = useMemo(() => {
    const ranges: Record<string, [number, number, number?]> = {};
    for (const expr of spec.expressions || []) {
      // Check for parametric expressions that might have parameters
      if (expr.parametric) {
        // Parametric expressions don't have simple parameters
        continue;
      }
      for (const param of detectParams(expr.expression)) ranges[param] = [-10, 10, 0.1];
    }
    return ranges;
  }, [spec.expressions]);

  if (!mounted) {
    return (
      <div
        className={`math-viz-loading ${className}`}
        style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8, gap: 16 }}
      >
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
        <span style={{ color: '#64748b', fontSize: 14 }}>Rendering plot...</span>
      </div>
    );
  }

  // Use ChartVisualization for simple function plots, SVG for complex interactive
  const useSVG = spec.interactive || (spec.expressions && spec.expressions.length > 3);

  return (
    <div
      className={`math-visualization ${className}`}
      style={{ width: '100%', height, display: 'flex', flexDirection: 'column', background: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
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
            ∫
          </motion.div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Function Plotter</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {spec.expressions?.map(e => e.label || e.expression).join(', ') || 'No functions'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, opacity: 0.9 }}>
            x ∈ [{xRange[0].toFixed(1)}, {xRange[1].toFixed(1)}]
          </span>
        </div>
      </motion.div>

      {/* Plot Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          position: 'relative',
          minHeight: 250,
        }}
      >
        {useSVG ? (
          <SVGPlot
            expressions={expressions}
            xRange={xRange}
            yRange={yRange}
            parameters={parameters}
            width={600} // Will be constrained by container
            height={300}
            interactive={spec.interactive !== false}
          />
        ) : (
          // Use ChartVisualization for simpler cases
          <ChartVisualization
            spec={createMultiFunctionPlotSpec(
              (spec.expressions || []).map(e => {
                let parsed: ((x: number, p: Record<string, number>) => number) | null = null;
                try { parsed = parseExpression(e.expression); } catch { /* bad syntax -> empty line */ }
                return {
                  fn: (x: number) => {
                    try { const y = parsed ? parsed(x, parameters) : NaN; return Number.isFinite(y) ? y : (null as unknown as number); }
                    catch { return null as unknown as number; }
                  },
                  name: e.label || e.expression,
                  color: e.color,
                };
              }),
              xRange
            )}
            height={300}
          />
        )}
      </motion.div>

      {/* Parameter Controls */}
      {spec.interactive && Object.keys(parameters).length > 0 && (
        <ParameterControls
          parameters={parameters}
          onChange={handleParameterChange}
          ranges={allParamRanges}
        />
      )}

      {/* Range Controls */}
      {(controls.stepForward !== false || controls.stepBackward !== false) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 16px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: '#64748b' }}>X Range:</span>
          <input
            type="number"
            value={xRange[0]}
            step={0.1}
            onChange={(e) => handleRangeChange([Number(e.target.value), xRange[1]], yRange)}
            style={{ width: 70, padding: '4px 8px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4 }}
          />
          <span style={{ color: '#94a3b8' }}>to</span>
          <input
            type="number"
            value={xRange[1]}
            step={0.1}
            onChange={(e) => handleRangeChange([xRange[0], Number(e.target.value)], yRange)}
            style={{ width: 70, padding: '4px 8px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4 }}
          />
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// Math Spec Builder Helpers
// ============================================================================

export function createMathSpec(
  expressions: Array<{ expression: string; label?: string; color?: string; parameters?: Record<string, number>; domain?: [number, number]; visible?: boolean }>,
  xRange: [number, number],
  options: {
    yRange?: [number, number];
    parameters?: Record<string, number>;
    interactive?: boolean;
  } = {}
): MathSpec {
  return {
    expressions: expressions.map((e, i) => ({
      id: `expr-${i}`,
      expression: e.expression,
      label: e.label,
      color: e.color,
      parameters: e.parameters,
      domain: e.domain,
      visible: e.visible,
    })),
    xRange,
    yRange: options.yRange,
    parameters: options.parameters,
    interactive: options.interactive ?? true,
  };
}

/**
 * Quick function plot from expression string
 */
export function createQuickPlot(
  expression: string,
  xRange: [number, number],
  options: {
    label?: string;
    color?: string;
    parameters?: Record<string, number>;
    yRange?: [number, number];
  } = {}
): MathSpec {
  return createMathSpec(
    [{ expression, label: options.label || 'f(x)', color: options.color, parameters: options.parameters }],
    xRange,
    { yRange: options.yRange, parameters: options.parameters }
  );
}

export default MathVisualization;