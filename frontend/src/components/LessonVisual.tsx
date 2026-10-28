// src/components/LessonVisual.tsx
import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

export interface ChartPoint { [key: string]: number | string; }

import { LessonVisualSpec } from '../types/lessonVisual';
import { LessonDiagram } from './LessonDiagram';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function LessonVisual({ visual }: { visual: LessonVisualSpec }) {
  if (visual.type === 'diagram') return <LessonDiagram visual={visual} />;
  const axisTick = { fontSize: 11, fill: 'var(--color-text-secondary)' };
  const yAxis = {
    tick: axisTick,
    width: 70,
    scale: visual.yScale || 'linear',
    domain: [visual.yScale === 'log' ? 1 : 0, 'auto'] as [number, 'auto'],
    tickFormatter: (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n),
  };
  if (visual.type === 'table') {
    return (
      <div style={{ marginTop: 12, background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 12, border: '1px solid var(--color-border)', overflowX: 'auto' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 8 }}>{visual.title}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: 'var(--color-text)' }}>
          <thead>
            <tr>
              {(visual.headers || []).map((h, i) => (
                <th key={i} style={{ textAlign: 'right', padding: '6px 10px', borderBottom: '2px solid var(--color-border)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(visual.rows || []).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ textAlign: 'right', padding: '6px 10px', borderBottom: '1px solid var(--color-border)' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6, marginBottom: 0 }}>{visual.description}</p>
      </div>
    );
  }

  if (visual.type === 'process') {
    return (
      <div style={{ marginTop: 12, background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 12, border: '1px solid var(--color-border)' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 8 }}>{visual.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(visual.steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text)' }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--color-accent-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
              <span>{step}</span>
              {i < (visual.steps || []).length - 1 && <span style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }}>↓</span>}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6, marginBottom: 0 }}>{visual.description}</p>
      </div>
    );
  }

  if (visual.type === 'svg' && visual.svg) {
    return (
      <div style={{ marginTop: 12, background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 12, border: '1px solid var(--color-border)' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 4 }}>{visual.title}</div>
        <div dangerouslySetInnerHTML={{ __html: visual.svg }} />
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6, marginBottom: 0 }}>{visual.description}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 12, border: '1px solid var(--color-border)' }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 8 }}>{visual.title}</div>
      {(visual.xLabel || visual.yLabel) && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{visual.xLabel} · {visual.yLabel}{visual.yScale === 'log' ? ' (log scale)' : ''}</p>}
      <div style={{ width: '100%', height: 300, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {visual.type === 'bar' ? (
            <BarChart data={visual.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={visual.xKey} tick={axisTick} height={45} />
              <YAxis {...yAxis} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Legend />
              {(visual.series || [{ key: visual.yKey || 'value', color: COLORS[0] }]).map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.name || s.key} isAnimationActive={false} />
              ))}
            </BarChart>
          ) : visual.type === 'line' ? (
            <LineChart data={visual.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={visual.xKey} tick={axisTick} height={45} />
              <YAxis {...yAxis} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Legend />
              {(visual.series || [{ key: visual.yKey || 'value', color: COLORS[0] }]).map((s) => (
                <Line key={s.key} type="linear" dataKey={s.key} stroke={s.color} strokeWidth={2} name={s.name || s.key} isAnimationActive={false} />
              ))}
            </LineChart>
          ) : visual.type === 'area' ? (
            <AreaChart data={visual.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={visual.xKey} tick={axisTick} height={45} />
              <YAxis {...yAxis} />
              <Tooltip />
              <Legend />
              {(visual.series || [{ key: visual.yKey || 'value', color: COLORS[0] }]).map((s) => (
                <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.3} name={s.name || s.key} />
              ))}
            </AreaChart>
          ) : visual.type === 'pie' ? (
            <PieChart>
              <Pie data={visual.data || []} dataKey={visual.yKey || 'value'} nameKey={visual.xKey || 'name'} cx="50%" cy="50%" outerRadius={90} label>
                {(visual.data || []).map((_, i) => (
                  <Cell key={i} fill={(visual.colors || COLORS)[i % (visual.colors || COLORS).length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : null}
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6, marginBottom: 0 }}>{visual.description}</p>
    </div>
  );
}
