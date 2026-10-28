import { useId } from 'react';
import type { LessonVisualSpec } from '../types/lessonVisual';

/** Fixed lesson examples; positions and edges come entirely from the local registry. */
export function LessonDiagram({ visual }: { visual: LessonVisualSpec }) {
  const id = useId().replace(/:/g, '');
  const nodes = visual.nodes || [];
  const height = visual.diagramHeight || 300;
  return (
    <figure style={{ margin: '12px 0 0', padding: 16, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
      <figcaption id={`${id}-title`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}>{visual.title}</figcaption>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 640 ${height}`} role="img" aria-labelledby={`${id}-title ${id}-description`} style={{ display: 'block', width: '100%', minWidth: 460, height: 'auto', color: 'var(--color-text)' }}>
          <desc>{`${nodes.map(n => n.label).join(', ')}. ${visual.edges?.map(e => `${nodes.find(n => n.id === e.from)?.label} ${visual.directed ? 'to' : 'connected to'} ${nodes.find(n => n.id === e.to)?.label}${e.label ? ` (${e.label})` : ''}`).join('; ')}`}</desc>
          <defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--color-accent)" /></marker></defs>
          {(visual.edges || []).map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const dx = to.x - from.x, dy = to.y - from.y;
            const length = Math.hypot(dx, dy) || 1;
            // Clip lines to the rectangular node boundaries so arrows stay visible.
            const offset = Math.min(dx === 0 ? Infinity : 55 / Math.abs(dx), dy === 0 ? Infinity : 23 / Math.abs(dy));
            const inset = Math.min(offset + 5 / length, .45);
            const x1 = from.x + dx * inset, y1 = from.y + dy * inset;
            const x2 = to.x - dx * inset, y2 = to.y - dy * inset;
            return <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge.highlight ? 'var(--color-accent)' : 'var(--color-text-secondary)'} strokeWidth={edge.highlight ? 3 : 1.5} markerEnd={visual.directed ? `url(#${id}-arrow)` : undefined} />
              {edge.label && <g><rect x={(from.x + to.x) / 2 - 26} y={(from.y + to.y) / 2 - 12} width={52} height={24} rx={5} fill="var(--color-bg-tertiary)" /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 + 4} textAnchor="middle" fill="currentColor" fontSize={12}>{edge.label}</text></g>}
            </g>;
          })}
          {nodes.map(node => <g key={node.id}>
            <rect x={node.x - 55} y={node.y - 23} width={110} height={46} rx={10} fill={node.highlight ? 'var(--color-accent-subtle)' : 'var(--color-surface)'} stroke={node.highlight ? 'var(--color-accent)' : 'var(--color-text-secondary)'} strokeWidth={node.highlight ? 2 : 1} />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">{node.label}</text>
          </g>)}
        </svg>
      </div>
      <p id={`${id}-description`} style={{ margin: '12px 0 0', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{visual.description}</p>
    </figure>
  );
}
