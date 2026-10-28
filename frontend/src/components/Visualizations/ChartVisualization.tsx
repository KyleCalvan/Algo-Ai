'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  type TooltipProps,
  type LegendProps,
  type LegendPayload,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import type {
  ChartSpec,
  ChartDataPoint,
  ChartSeries,
  VisualizationControls,
  ChartType,
} from '../../types/visualization';

// ============================================================================
// Theme Colors
// ============================================================================

const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f6', // indigo
];

const CHART_COLORS_DARK = [
  '#60a5fa',
  '#f87171',
  '#4ade80',
  '#fbbf24',
  '#a78bfa',
  '#f472b6',
  '#22d3ee',
  '#a3e635',
  '#fb923c',
  '#818cf8',
];

// ============================================================================
// Custom Tooltip
// ============================================================================

interface TooltipPayloadItem {
  value: number | string;
  name: string;
  color: string;
  dataKey: string;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{
        background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
        minWidth: 160,
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, color: isDark ? '#f1f5f9' : '#1e293b' }}>
        {label}
      </div>
      {payload.map((entry, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: index === payload.length - 1 ? 0 : 4,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: entry.color,
            }}
          />
          <span style={{ color: isDark ? '#cbd5e1' : '#475569' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

// ============================================================================
// Custom Legend
// ============================================================================

interface CustomLegendItem {
  value: string;
  color: string;
  id: string;
  type: string;
  style?: React.CSSProperties;
}

interface CustomLegendProps {
  payload?: CustomLegendItem[];
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload = [] }) => {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', padding: 8 }}>
      {payload.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 4,
            transition: 'background 0.2s',
            ...entry.style,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: entry.type === 'line' ? 0 : 2,
              backgroundColor: entry.color,
            }}
          />
          <span style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>{entry.value}</span>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// Chart Visualization Components
// ============================================================================

const getSeries = (spec: ChartSpec, colors: string[]) => {
  const keys = spec.yKeys && spec.yKeys.length ? spec.yKeys : (spec.series || []).map((s) => s.key);
  return spec.series && spec.series.length
    ? spec.series
    : keys.map((key, i) => ({ key, name: key, color: colors[i % colors.length] }));
};

// FIX: these return <Line/>/<Bar/>/... elements to place INSIDE <ComposedChart>.
// Previously they returned whole <LineChart>/<BarChart> trees which Recharts
// ignores when nested, so nothing was drawn.
const renderSeriesElements = (spec: ChartSpec, colors: string[], isDark: boolean) => {
  const seriesConfig = getSeries(spec, colors);
  const dur = spec.animation?.duration || 800;
  return seriesConfig.map((s: any, i: number) => {
    const color = s.color || colors[i % colors.length];
    const common = { key: s.key, dataKey: s.key, name: s.name || s.key, isAnimationActive: true, animationDuration: dur };
    switch (spec.type) {
      case 'bar':
      case 'histogram':
        return <Bar {...common} fill={color} radius={[4, 4, 0, 0]} />;
      case 'area':
        return <Area {...common} type="monotone" stroke={color} fill={color} fillOpacity={0.3} />;
      case 'scatter':
        return <Scatter {...common} fill={color} />;
      default:
        return <Line {...common} type="monotone" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />;
    }
  });
};

const renderPieChart = (spec: ChartSpec, colors: string[], isDark: boolean) => {
  const { data, xKey, yKeys, animation } = spec;
  const valueKey = yKeys?.[0] ?? (spec.series?.[0]?.key as string);
  return (
    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={100}
        paddingAngle={2}
        dataKey={valueKey}
        nameKey={xKey}
        label={({ name, percent }: any) => `${name}: ${(percent ? percent * 100 : 0).toFixed(1)}%`}
        labelLine={false}
        animationDuration={animation?.duration || 600}
        isAnimationActive={true}
      >
        {data.map((_, i) => (
          <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
    </PieChart>
  );
};

// ============================================================================
// ChartVisualization Component
// ============================================================================

interface ChartVisualizationProps {
  spec: ChartSpec;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
}

export const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  spec,
  controls = {},
  onInteraction,
  className = '',
  height = 350,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // FIX: was never set -> stuck on spinner
  const [highlightedSeries, setHighlightedSeries] = useState<string | null>(null);

  const isDark = useMemo(() => document.documentElement.classList.contains('dark'), []);
  const colors = useMemo(() => (isDark ? CHART_COLORS_DARK : CHART_COLORS), [isDark]);

  const seriesElements = useMemo(() => renderSeriesElements(spec, colors, isDark), [spec, colors, isDark]);

  const handleLegendClick = useCallback((seriesKey: string) => {
    setHighlightedSeries(highlightedSeries === seriesKey ? null : seriesKey);
    onInteraction?.({ type: 'legend_click', series: seriesKey, highlighted: highlightedSeries !== seriesKey });
  }, [highlightedSeries, onInteraction]);

  if (!mounted) {
    return (
      <div
        className={`chart-viz-loading ${className}`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}
      >
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div
      className={`chart-visualization ${className}`}
      style={{ width: '100%', height, position: 'relative', background: isDark ? '#0f172a' : '#ffffff', borderRadius: 8 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {spec.type === 'pie' ? (
          renderPieChart(spec, colors, isDark)
        ) : (
        <ComposedChart data={spec.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
          <XAxis
            dataKey={spec.xKey}
            type={spec.type === 'scatter' ? 'number' : 'category'}
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={11}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
            axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
          />
          <YAxis
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={11}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
            axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={({ payload }) => (
              <CustomLegend
                payload={payload?.map((p: LegendPayload, index: number) => ({
                  value: p.value ?? '',
                  color: p.color ?? '#6366f1',
                  id: `${p.value ?? index}`,
                  type: p.type ?? 'square',
                  style: {
                    opacity: highlightedSeries && highlightedSeries !== p.value ? 0.3 : 1,
                  },
                })) || []}
              />
            )}
          />
          {seriesElements}
        </ComposedChart>
        )}
      </ResponsiveContainer>

      {/* Chart Type Indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 10,
            fontWeight: 500,
            color: isDark ? '#94a3b8' : '#64748b',
            background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            padding: '2px 8px',
            borderRadius: 4,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
            zIndex: 10,
            textTransform: 'capitalize',
          }}
        >
          {spec.type} chart
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Chart Spec Builder Helpers
// ============================================================================

/**
 * Create chart spec from data array
 */
export function createChartSpec(
  data: ChartDataPoint[],
  xKey: string,
  yKeys: string[],
  type: ChartType = 'line',
  options: {
    xLabel?: string;
    yLabel?: string;
    series?: ChartSeries[];
    animation?: { duration: number; easing: string };
  } = {}
): ChartSpec {
  return {
    type,
    data,
    xKey,
    yKeys,
    xLabel: options.xLabel,
    yLabel: options.yLabel,
    series: options.series,
    animation: options.animation || { duration: 800, easing: 'easeOutQuart' },
  };
}

/**
 * Create function plot spec (y = f(x))
 */
export function createFunctionPlotSpec(
  fn: (x: number) => number,
  xRange: [number, number],
  options: {
    numPoints?: number;
    xLabel?: string;
    yLabel?: string;
    name?: string;
    color?: string;
  } = {}
): ChartSpec {
  const { numPoints = 100, xLabel = 'x', yLabel = 'y', name = 'f(x)', color } = options;
  const step = (xRange[1] - xRange[0]) / (numPoints - 1);
  const data: ChartDataPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = xRange[0] + i * step;
    data.push({ [xLabel]: x, [yLabel]: fn(x) });
  }

  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  return createChartSpec(
    data,
    xLabel,
    [yLabel],
    'line',
    {
      xLabel,
      yLabel,
      series: [{ key: yLabel, name, color: color || colors[0], type: 'line' }],
      animation: { duration: 1000, easing: 'easeOutQuart' },
    }
  );
}

/**
 * Create multi-function plot spec
 */
export function createMultiFunctionPlotSpec(
  functions: Array<{ fn: (x: number) => number; name: string; color?: string }>,
  xRange: [number, number],
  options: {
    numPoints?: number;
    xLabel?: string;
    yLabel?: string;
  } = {}
): ChartSpec {
  const { numPoints = 100, xLabel = 'x', yLabel = 'y' } = options;
  const step = (xRange[1] - xRange[0]) / (numPoints - 1);
  const data: ChartDataPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = xRange[0] + i * step;
    const point: ChartDataPoint = { [xLabel]: x };
    for (const f of functions) {
      point[f.name] = f.fn(x);
    }
    data.push(point);
  }

  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  return createChartSpec(
    data,
    xLabel,
    functions.map((f) => f.name),
    'line',
    {
      xLabel,
      yLabel,
      series: functions.map((f, i) => ({
        key: f.name,
        name: f.name,
        color: f.color || colors[i % colors.length],
        type: 'line',
      })),
      animation: { duration: 1000, easing: 'easeOutQuart' },
    }
  );
}

export default ChartVisualization;