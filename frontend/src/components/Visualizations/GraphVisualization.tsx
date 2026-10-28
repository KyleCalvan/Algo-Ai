'use client';

import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Viewport,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeProps,
  type EdgeProps,
  useOnViewportChange,
  useReactFlow,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  useStore,
  useEdges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type {
  GraphSpec,
  GraphNode,
  GraphEdge,
  GraphNodeData,
  VisualizationControls,
  GraphLayout,
} from '../../types/visualization';
import { motion, AnimatePresence } from 'motion/react';
import { generateGraphSteps, inferStepAlgo, readWeight, STEP_ALGO_LABELS, type StepAlgo, type GraphStepState } from './Graphalgortihms';

// ============================================================================
// Custom Node Components
// ============================================================================

interface CustomNodeData extends GraphNodeData {
  // Extended data for visualization
}

type CustomNodeProps = NodeProps<CustomNodeData>;

const fmtNum = (v: any): string => {
  if (typeof v === 'number') {
    if (v === Infinity) return '∞';
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  }
  return String(v);
};

/** [background, border] for a node based on its algorithm state. */
function nodePalette(d: any): [string, string] {
  if (d.error) return ['#dc2626', '#991b1b'];
  if (d.active || d.current) return ['#ef4444', '#dc2626'];
  if (d.returning) return ['#f59e0b', '#d97706'];
  if (d.highlighted) return ['#f59e0b', '#d97706'];
  if (d.completed || d.visited) return ['#22c55e', '#16a34a'];
  if (d.start) return ['#0ea5e9', '#0369a1'];
  if (d.target) return ['#a855f7', '#7e22ce'];
  return ['#6366f1', '#4f46e5'];
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, id, selected }) => {
  const d: any = data;
  const {
    label, functionName, parameters, returnValue, value, left, right, next, prev,
    key: nodeKey, distance,
  } = d;

  const active = !!(d.active || d.current);
  const returning = !!d.returning;
  const completed = !!(d.completed || d.visited);

  const isRecursionNode = functionName !== undefined;
  const isTreeNode = value !== undefined && (left !== undefined || right !== undefined);
  const isListNode = value !== undefined && (next !== undefined || prev !== undefined);
  const isPlainNode = !isRecursionNode && !isTreeNode && !isListNode;

  const [bg, border] = nodePalette(d);

  const baseStyle: React.CSSProperties = {
    backgroundColor: d.style?.backgroundColor || d.color || bg,
    borderColor: d.style?.borderColor || border,
    borderStyle: 'solid',
    borderWidth: d.style?.borderWidth || (active || returning ? 3 : 2),
    borderRadius: d.style?.borderRadius || (isPlainNode ? 999 : 8),
    color: d.style?.color || '#ffffff',
    fontSize: d.style?.fontSize || (isPlainNode ? 14 : 11),
    fontWeight: d.style?.fontWeight || 700,
    padding: d.style?.padding ? `${d.style.padding.y}px ${d.style.padding.x}px` : isPlainNode ? '0 10px' : '8px 10px',
    minWidth: d.style?.minWidth || (isRecursionNode ? 180 : isPlainNode ? 44 : 60),
    maxWidth: d.style?.maxWidth || (isRecursionNode ? 300 : isPlainNode ? 140 : 120),
    ...(isPlainNode ? { height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
    textAlign: 'center',
    whiteSpace: 'nowrap',
    // plain nodes show a distance badge below them, so they must not clip
    overflow: isPlainNode ? 'visible' : 'hidden',
    position: 'relative',
    textOverflow: 'ellipsis',
    boxShadow: selected ? '0 0 0 3px #3b82f6, 0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.15)',
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
    cursor: 'grab',
    userSelect: 'none',
  };

  return (
    <motion.div
      style={baseStyle}
      className={`viz-node ${selected ? 'selected' : ''} ${active ? 'active' : ''} ${returning ? 'returning' : ''} ${completed ? 'completed' : ''}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
    >
      {SIDES.map((side) => (
        <Handle key={`t-${side}`} id={`t-${side}`} type="target" position={side} isConnectable={false} style={{ opacity: 0 }} />
      ))}
      {SIDES.map((side) => (
        <Handle key={`s-${side}`} id={`s-${side}`} type="source" position={side} isConnectable={false} style={{ opacity: 0 }} />
      ))}
      {isRecursionNode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{functionName}</div>
          <div style={{ fontSize: 10, opacity: 0.9, wordBreak: 'break-word' }}>
            {Object.entries(parameters || {})
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')}
          </div>
          {returnValue !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', marginTop: 2 }}
            >
              → {returnValue}
            </motion.div>
          )}
        </div>
      ) : isTreeNode ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
          {(left !== undefined || right !== undefined) && (
            <div style={{ display: 'flex', gap: 8, fontSize: 9, opacity: 0.7 }}>
              {left !== undefined && <span>L: {left}</span>}
              {right !== undefined && <span>R: {right}</span>}
            </div>
          )}
        </div>
      ) : isListNode ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
          {(next !== undefined || prev !== undefined) && (
            <div style={{ display: 'flex', gap: 8, fontSize: 9, opacity: 0.7 }}>
              {prev !== undefined && <span>← {prev}</span>}
              {next !== undefined && <span>{next} →</span>}
            </div>
          )}
        </div>
      ) : (
        <>
          <span>{label ?? value ?? nodeKey ?? id}</span>
          {distance !== undefined && (
            <span
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 3,
                fontSize: 10,
                fontWeight: 600,
                color: '#334155',
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #cbd5e1',
                borderRadius: 999,
                padding: '0 6px',
                whiteSpace: 'nowrap',
              }}
            >
              d={fmtNum(distance)}
            </span>
          )}
        </>
      )}
    </motion.div>
  );
};

// ----------------------------------------------------------------------------
// Floating edge: straight line between node borders (no handle positions), with
// a weight / capacity label pill. Looks like a textbook graph (MST, TSP, flow).
// ----------------------------------------------------------------------------

const isEllipseNode = (n: any) => {
  const d = n?.data || {};
  return !(d.functionName !== undefined || d.left !== undefined || d.right !== undefined || d.next !== undefined || d.prev !== undefined);
};

/** Distance from a node's centre to its border along unit direction (ux, uy). */
function borderDist(n: any, ux: number, uy: number): number {
  const a = (n.width || 0) / 2;
  const b = (n.height || 0) / 2;
  if (isEllipseNode(n)) {
    const k = Math.sqrt((ux / a) ** 2 + (uy / b) ** 2);
    return k ? 1 / k : a;
  }
  const tx = Math.abs(ux) > 1e-6 ? a / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-6 ? b / Math.abs(uy) : Infinity;
  return Math.min(tx, ty);
}

const FloatingEdge: React.FC<EdgeProps> = ({ id, source, target, markerEnd, data, style }) => {
  const sourceNode = useStore(useCallback((st: any) => st.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((st: any) => st.nodeInternals.get(target), [target]));
  const allEdges = useEdges();

  if (!sourceNode || !targetNode || !sourceNode.width || !targetNode.width) return null;

  const d: any = data || {};
  const sp = sourceNode.positionAbsolute || sourceNode.position;
  const tp = targetNode.positionAbsolute || targetNode.position;
  const sc = { x: sp.x + sourceNode.width / 2, y: sp.y + sourceNode.height / 2 };
  const tc = { x: tp.x + targetNode.width / 2, y: tp.y + targetNode.height / 2 };
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // A->B and B->A both present (flow networks): push them apart so they don't overlap
  const hasReverse = allEdges.some((e) => e.id !== id && e.source === target && e.target === source);
  const off = hasReverse ? 11 : 0;
  const ox = -uy * off;
  const oy = ux * off;

  const gap = markerEnd ? 3 : 0;
  const sx = sc.x + ux * borderDist(sourceNode, ux, uy) + ox;
  const sy = sc.y + uy * borderDist(sourceNode, ux, uy) + oy;
  const ex = tc.x - ux * (borderDist(targetNode, ux, uy) + gap) + ox;
  const ey = tc.y - uy * (borderDist(targetNode, ux, uy) + gap) + oy;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  const saturated = d.flow !== undefined && d.capacity !== undefined && d.flow >= d.capacity && d.capacity > 0;
  const hasFlow = d.flow !== undefined && d.flow > 0;
  const emphasised = !!(d.highlighted || d.traversed || d.current || d.shortestPath);

  const userStyle: any = style || {};
  const stroke =
    userStyle.stroke ?? userStyle.strokeColor ??
    (d.rejected ? '#ef4444' : d.current ? '#f59e0b' : emphasised ? '#22c55e' : saturated ? '#ef4444' : hasFlow ? '#3b82f6' : '#94a3b8');
  const strokeWidth = userStyle.strokeWidth ?? (emphasised ? 4 : hasFlow ? 3 : 2);

  let text: string | undefined;
  if (d.label !== undefined && d.label !== null && d.label !== '') text = String(d.label);
  else if (d.flow !== undefined && d.capacity !== undefined) text = `${fmtNum(d.flow)}/${fmtNum(d.capacity)}`;
  else if (d.capacity !== undefined) text = fmtNum(d.capacity);
  else {
    const wv = readWeight(d);
    if (wv !== undefined) text = fmtNum(wv);
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={`M ${sx},${sy} L ${ex},${ey}`}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth, strokeDasharray: userStyle.strokeDasharray ?? (d.rejected ? '6 4' : undefined), opacity: d.rejected ? 0.75 : 1, transition: 'stroke 0.25s, stroke-width 0.25s' }}
      />
      {text !== undefined && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
              pointerEvents: 'all',
              background: '#ffffff',
              border: `1.5px solid ${stroke}`,
              color: '#1e293b',
              borderRadius: 999,
              padding: '1px 7px',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            {text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// ============================================================================
const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];
// Stable React Flow node/edge type registries (module scope).
const NODE_TYPES = { custom: CustomNode };
const EDGE_TYPES = { custom: FloatingEdge, floating: FloatingEdge };

// Layout helpers (pure functions — no deps, testable)
// ============================================================================

type Pt = { x: number; y: number };

/** True when every node has a distinct, usable position. */
function hasValidPositions(nodes: GraphNode[]): boolean {
  if (nodes.length === 0) return true;
  const seen = new Set<string>();
  let validCount = 0;
  for (const n of nodes) {
    const p = n.position;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const key = `${p.x}:${p.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    validCount++;
  }
  return validCount >= Math.min(2, nodes.length) && validCount >= Math.ceil(nodes.length / 2);
}

function adjacencies(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  for (const e of edges) {
    if (adj.has(e.source) && !adj.get(e.source)!.includes(e.target)) adj.get(e.source)!.push(e.target);
  }
  return adj;
}

/**
 * Place nodes that lack (distinct) positions.
 * - 'hierarchical' (default): BFS levels from the root (startNode, else a
 *   node with no incoming edges, else the first node); rows centered.
 * - 'circular': nodes evenly on a circle.
 * - 'grid': square grid.
 * - 'force': simple spring/repulsion relaxation.
 * Existing distinct positions are always preserved.
 */
export function computeLayoutPositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layout: GraphLayout | undefined,
  startNode?: string,
): Pt[] {
  const n = nodes.length;
  const result: Pt[] = nodes.map((nd) => ({ x: 0, y: 0 }));
  if (n === 0) return result;
  if (hasValidPositions(nodes)) {
    nodes.forEach((nd, i) => {
      result[i] = { x: nd.position?.x ?? 0, y: nd.position?.y ?? 0 };
    });
    return result;
  }

  const which: GraphLayout =
    layout && layout !== 'dagre' ? layout : 'hierarchical';

  if (which === 'circular') {
    const R = Math.max(150, n * 28);
    nodes.forEach((_, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      result[i] = { x: Math.round(300 + R * Math.cos(a)), y: Math.round(200 + R * Math.sin(a)) };
    });
    return result;
  }

  if (which === 'grid') {
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    nodes.forEach((_, i) => {
      result[i] = { x: (i % cols) * 140, y: Math.floor(i / cols) * 120 };
    });
    return result;
  }

  if (which === 'force') {
    // Deterministic spring layout: repulsion between all pairs, springs on edges.
    const pos: Pt[] = nodes.map((_, i) => {
      const a = (i / n) * 2 * Math.PI;
      return { x: 300 + 160 * Math.cos(a), y: 200 + 160 * Math.sin(a) };
    });
    const idx = new Map(nodes.map((nd, i) => [nd.id, i]));
    for (let iter = 0; iter < 150; iter++) {
      const disp: Pt[] = pos.map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          let dx = pos[i].x - pos[j].x;
          let dy = pos[i].y - pos[j].y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) { dx = (i - j) * 0.01; dy = 0.01; d2 = 0.01; }
          const f = 24000 / d2;
          const d = Math.sqrt(d2);
          disp[i].x += (dx / d) * f; disp[i].y += (dy / d) * f;
          disp[j].x -= (dx / d) * f; disp[j].y -= (dy / d) * f;
        }
      }
      for (const e of edges) {
        const a = idx.get(e.source);
        const b = idx.get(e.target);
        if (a === undefined || b === undefined) continue;
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const f = (d - 140) * 0.02;
        disp[a].x += (dx / d) * f; disp[a].y += (dy / d) * f;
        disp[b].x -= (dx / d) * f; disp[b].y -= (dy / d) * f;
      }
      const cool = 1 - iter / 150;
      pos.forEach((p, i) => {
        p.x += Math.max(-12, Math.min(12, disp[i].x * 0.1 * cool));
        p.y += Math.max(-12, Math.min(12, disp[i].y * 0.1 * cool));
      });
    }
    nodes.forEach((_, i) => { result[i] = { x: Math.round(pos[i].x), y: Math.round(pos[i].y) }; });
    return result;
  }

  // hierarchical (default): BFS levels
  const adj = adjacencies(nodes, edges);
  const inDegree = new Map<string, number>(nodes.map((nd) => [nd.id, 0]));
  for (const e of edges) {
    if (inDegree.has(e.target)) inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }
  let root = startNode && inDegree.has(startNode) ? startNode : undefined;
  if (root === undefined) root = nodes.find((nd) => (inDegree.get(nd.id) ?? 0) === 0)?.id ?? nodes[0].id;

  const level = new Map<string, number>([[root, 0]]);
  const queue: string[] = [root];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nxt of adj.get(cur) ?? []) {
      if (!level.has(nxt)) {
        level.set(nxt, level.get(cur)! + 1);
        queue.push(nxt);
      }
    }
  }
  // Orphans (unreached): place at the deepest reached level + 1.
  const maxLevel = Math.max(0, ...level.values());
  nodes.forEach((nd) => {
    if (!level.has(nd.id)) level.set(nd.id, maxLevel + 1);
  });

  const rows = new Map<number, string[]>();
  nodes.forEach((nd) => {
    const lv = level.get(nd.id)!;
    if (!rows.has(lv)) rows.set(lv, []);
    rows.get(lv)!.push(nd.id);
  });
  const widthPer = 150;
  for (const [lv, ids] of rows) {
    const rowWidth = (ids.length - 1) * widthPer;
    ids.forEach((id, i) => {
      const nd = nodes.find((x) => x.id === id)!;
      const idx = nodes.indexOf(nd);
      result[idx] = { x: i * widthPer - rowWidth / 2, y: lv * 130 };
    });
  }
  return result;
}

/**
 * Apply hierarchical layout (BFS levels) for trees/recursion graphs.
 * Kept as an exported helper; positions are computed in place of stubs.
 */
export function applyHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[], direction: 'TB' | 'LR' = 'TB'): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const positions = computeLayoutPositions(nodes, edges, 'hierarchical');
  const laid = nodes.map((nd, i) => ({ ...nd, position: direction === 'TB' ? positions[i] : { x: positions[i].y, y: positions[i].x } }));
  return { nodes: laid, edges };
}

/**
 * Apply force-directed layout for general graphs.
 */
export function applyForceLayout(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const positions = computeLayoutPositions(nodes, edges, 'force');
  const laid = nodes.map((nd, i) => ({ ...nd, position: positions[i] }));
  return { nodes: laid, edges };
}

// ============================================================================
// GraphVisualization Component
// ============================================================================

type GraphKind = 'mst' | 'flow' | 'tsp' | 'path' | undefined;

function inferKind(algorithm?: string | null): GraphKind {
  const a = (algorithm || '').toLowerCase();
  if (/prim|kruskal|mst|spanning/.test(a)) return 'mst';
  if (/flow|ford|fulkerson|edmonds|dinic|karp/.test(a)) return 'flow';
  if (/tsp|salesman|travel|hamilton/.test(a)) return 'tsp';
  if (/dijkstra|shortest|bellman|floyd|a-?star/.test(a)) return 'path';
  return undefined;
}

/** Choose a layout that makes the graph look like what it is, not always a tree. */
function pickLayout(spec: GraphSpec, kind: GraphKind): GraphLayout {
  const nodes = spec.nodes || [];
  const edges = spec.edges || [];
  const given = spec.layout;
  if (kind === 'tsp') return 'circular';
  if (kind === 'flow') return 'hierarchical';
  if (kind === 'mst' || kind === 'path') {
    return given && given !== 'hierarchical' && given !== 'dagre' ? given : 'force';
  }
  if (given) return given;
  const isTree = edges.length === Math.max(0, nodes.length - 1);
  return isTree ? 'hierarchical' : 'force';
}

interface GraphVisualizationProps {
  spec: GraphSpec;
  controls?: VisualizationControls;
  onInteraction?: (interaction: any) => void;
  className?: string;
  height?: number;
  /** Extra text (block title / description) used to guess which algorithm the graph shows. */
  hint?: string;
  /** Show the Back / Next stepper (default true). The algorithm component turns it off: it has its own. */
  stepping?: boolean;
}

const KIND_FOR_ALGO: Record<StepAlgo, GraphKind> = {
  prim: 'mst', kruskal: 'mst', dijkstra: 'path', bfs: undefined, dfs: undefined,
};

const stepBtn = (disabled?: boolean): React.CSSProperties => ({
  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
  border: '1px solid #cbd5e1', background: disabled ? '#f1f5f9' : '#ffffff', color: disabled ? '#94a3b8' : '#1e293b',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const _GraphVisualization: React.FC<GraphVisualizationProps> = ({
  spec,
  controls = {},
  onInteraction,
  className = '',
  height = 400,
  hint,
  stepping = true,
}) => {
  // ---- which algorithm are we showing? (spec.algorithm, block title, or picked by the user)
  const specAlgo = inferStepAlgo(`${spec.algorithm ?? ''} ${hint ?? ''}`);
  const [algo, setAlgo] = useState<StepAlgo | 'none'>(specAlgo);
  useEffect(() => { setAlgo(specAlgo); }, [specAlgo]);
  const [stepIndex, setStepIndex] = useState(-1); // -1 = not started
  const [playing, setPlaying] = useState(false);

  const kind: GraphKind =
    (algo !== 'none' ? KIND_FOR_ALGO[algo] : undefined) ?? inferKind(spec.algorithm as string | null | undefined);
  const directed = spec.directed ?? !(kind === 'mst' || kind === 'tsp');

  // Structural key: the chat may hand us a fresh `spec` object on every re-render, so
  // layout/steps are keyed on content, not identity (otherwise Next would reset itself).
  const structKey = JSON.stringify({
    n: (spec.nodes || []).map((n) => [n.id, n.position?.x, n.position?.y, (n.data as any)?.label]),
    e: (spec.edges || []).map((e) => [e.id, e.source, e.target, readWeight(e), e.label]),
    l: spec.layout, s: spec.startNode, k: kind, d: directed,
  });
  const hlKey = JSON.stringify(spec.highlight ?? null);

  // ---- normalised nodes / edges (unique ids, weights extracted)
  const safeNodes = useMemo((): GraphNode[] => {
    const seen = new Set<string>();
    return (spec.nodes || []).map((node) => {
      let id = typeof node?.id === 'string' && node.id ? node.id : `node-${seen.size + 1}`;
      if (seen.has(id)) id = `${id}-${seen.size + 1}`;
      seen.add(id);
      return { ...node, id } as GraphNode;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structKey]);

  const normEdges = useMemo(() => {
    const nodeIds = new Set(safeNodes.map((n) => n.id));
    const seen = new Set<string>();
    return (spec.edges || [])
      .filter((edge) => edge && (!nodeIds.size || (nodeIds.has(edge.source) && nodeIds.has(edge.target))))
      .map((edge) => {
        let id = edge.id && typeof edge.id === 'string' ? edge.id : `edge-${edge.source}-${edge.target}`;
        if (seen.has(id)) id = `${id}-${seen.size + 1}`;
        seen.add(id);
        return { ...edge, id, origId: edge.id, weight: readWeight(edge) } as GraphEdge & { origId?: string; weight?: number };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structKey, safeNodes]);

  // ---- layout (positions only; never recomputed by step changes)
  const layout = useMemo(() => {
    const autoLaid = !hasValidPositions(safeNodes);
    let positions = computeLayoutPositions(safeNodes, normEdges, pickLayout(spec, kind), spec.startNode);
    if (autoLaid && (kind === 'flow' || (spec as any).direction === 'LR')) {
      positions = positions.map((p) => ({ x: p.y * 1.6, y: p.x * 0.9 }));
    }
    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeNodes, normEdges, kind]);

  // ---- algorithm steps (generated in the browser, so the AI doesn't have to)
  const hasRecursionNodes = safeNodes.some((n) => (n.data as any)?.functionName !== undefined);
  const canStep = stepping && safeNodes.length >= 2 && normEdges.length >= 1 && !hasRecursionNodes;
  const hasWeights = normEdges.some((e) => e.weight !== undefined);
  const showPanel = canStep && (algo !== 'none' || hasWeights);

  const steps = useMemo((): GraphStepState[] => {
    if (!canStep || algo === 'none') return [];
    return generateGraphSteps(
      algo,
      safeNodes.map((n) => ({ id: n.id, label: String((n.data as any)?.label ?? n.id) })),
      normEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, weight: e.weight })),
      { start: spec.startNode, directed },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStep, algo, safeNodes, normEdges, directed]);

  const stepState: GraphStepState | null = stepIndex >= 0 ? steps[stepIndex] ?? null : null;

  useEffect(() => { setStepIndex(-1); setPlaying(false); }, [structKey, algo]);

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= steps.length - 1) { setPlaying(false); return; }
    const t = window.setTimeout(() => setStepIndex((i) => i + 1), 1500);
    return () => window.clearTimeout(t);
  }, [playing, stepIndex, steps.length]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    onInteraction?.({ type: 'step_change', direction: 'next' });
  }, [steps.length, onInteraction]);
  const goBack = useCallback(() => {
    setPlaying(false);
    setStepIndex((i) => Math.max(i - 1, -1));
    onInteraction?.({ type: 'step_change', direction: 'back' });
  }, [onInteraction]);
  const goReset = useCallback(() => { setPlaying(false); setStepIndex(-1); }, []);

  // ---- React Flow nodes / edges (decorated with the current step)
  const initialNodes = useMemo((): Node<CustomNodeData>[] => {
    const hl = new Set(spec.highlight?.nodes || []);
    const visited = new Set(stepState?.visitedNodes || []);
    return safeNodes.map((node, i): Node<CustomNodeData> => ({
      id: node.id,
      type: 'custom',
      position: layout[i],
      data: {
        ...(node.data || {}),
        style: (node.data as any)?.style ?? node.style,
        // generators initialise every node with distance = Infinity; only show "d=∞" for shortest-path graphs
        ...((node.data as any)?.distance === Infinity && kind !== 'path' && !stepState?.distances ? { distance: undefined } : {}),
        ...(stepState
          ? {
              visited: visited.has(node.id),
              current: stepState.currentNode === node.id,
              ...(stepState.distances ? { distance: stepState.distances[node.id] } : {}),
            }
          : hl.has(node.id) ? { highlighted: true } : {}),
      } as CustomNodeData,
      draggable: node.draggable !== false,
      selected: node.selected,
      zIndex: node.level,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeNodes, layout, hlKey, stepState, kind]);

  const initialEdges = useMemo((): Edge[] => {
    const hl = new Set(spec.highlight?.edges || []);
    return normEdges.map((edge): Edge => {
      const t = edge.type;
      const type = !t || t === 'custom' || t === 'default' || t === 'straight' || t === 'floating' ? 'floating' : t;
      const accepted = stepState ? stepState.acceptedEdges.includes(edge.id) : hl.has(edge.id) || (!!edge.origId && hl.has(edge.origId)) || !!edge.traversed;
      const considered = stepState ? stepState.consideredEdges.includes(edge.id) : false;
      const rejected = stepState ? stepState.rejectedEdges.includes(edge.id) : false;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type,
        animated: edge.animated || considered,
        style: edge.style as React.CSSProperties,
        markerEnd:
          edge.markerEnd === 'none' || (!edge.markerEnd && !directed)
            ? undefined
            : { type: edge.markerEnd === 'arrow' ? MarkerType.Arrow : MarkerType.ArrowClosed },
        data: { ...edge, highlighted: accepted, current: considered, rejected },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normEdges, hlKey, stepState, directed]);

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { fitView } = useReactFlow();

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<CustomNodeData>) => {
    onInteraction?.({ type: 'node_click', nodeId: node.id, data: node.data });
  }, [onInteraction]);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node<CustomNodeData>) => {
    onInteraction?.({ type: 'node_drag', nodeId: node.id, position: node.position });
  }, [onInteraction]);

  useOnViewportChange({
    onChange: useCallback((newViewport: Viewport) => {
      onInteraction?.({ type: 'viewport_change', viewport: newViewport });
    }, [onInteraction]),
  });

  // Fit the view when the graph's structure changes (not on every step)
  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 60);
    return () => window.clearTimeout(t);
  }, [mounted, layout, fitView]);

  // Push decorated nodes/edges into React Flow; keep positions the user dragged to
  const lastLayoutRef = useRef(layout);
  useEffect(() => {
    if (!mounted) return;
    const sameLayout = lastLayoutRef.current === layout;
    lastLayoutRef.current = layout;
    setNodes((prev) =>
      sameLayout
        ? initialNodes.map((n) => {
            const p = prev.find((x) => x.id === n.id);
            return p ? { ...n, position: p.position } : n;
          })
        : initialNodes,
    );
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, layout, setNodes, setEdges, mounted]);

  if (!mounted) {
    return (
      <div
        className={`graph-viz-loading ${className}`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}
      >
        <div className="loading-spinner" />
      </div>
    );
  }

  // total weight badge (MST weight / path cost)
  let badge: { total: number; count: number } | null = null;
  if (stepState) {
    if (stepState.totalWeight !== undefined) badge = { total: stepState.totalWeight, count: stepState.acceptedEdges.length };
  } else {
    const picked = edges.filter((e) => (e.data as any)?.highlighted);
    const total = picked.reduce((sum, e) => sum + (readWeight(e.data) ?? 0), 0);
    if (picked.length && total) badge = { total, count: picked.length };
  }

  const legendItem = (color: string, text: string, dashed = false) => (
    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: 4 }}>
      <div style={{ width: 12, height: dashed ? 0 : 12, borderTop: dashed ? `2px dashed ${color}` : undefined, background: dashed ? undefined : color, borderRadius: 4 }} />
      <span>{text}</span>
    </div>
  );

  const total = steps.length;
  const atEnd = stepIndex >= total - 1;

  return (
    <div
      className={`graph-visualization ${className}`}
      style={{ width: '100%', height, minHeight: showPanel ? 380 : 300, display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params as Connection, eds))}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView={false}
          panOnScroll={true}
          panOnScrollSpeed={0.5}
          minZoom={0.1}
          maxZoom={3}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          attributionPosition="bottom-right"
        >
          <Background color="#e2e8f0" gap={20} size={1} style={{ opacity: 0.5 }} />
          <Controls showZoom={controls.playPause !== false} showFitView={true} showInteractive={true} />
          {controls.fullscreen && (
            <MiniMap
              nodeColor={(node) => {
                const style = (node.data as any)?.style;
                if (style?.backgroundColor) return style.backgroundColor;
                if ((node.data as any)?.active) return '#ef4444';
                if ((node.data as any)?.returning) return '#f59e0b';
                if ((node.data as any)?.completed) return '#22c55e';
                return '#6366f1';
              }}
              maskColor="rgba(59, 130, 246, 0.2)"
            />
          )}
        </ReactFlow>

        {badge && (
          <div
            style={{
              position: 'absolute', top: 10, left: 10, zIndex: 10, pointerEvents: 'none',
              background: 'rgba(255,255,255,0.95)', border: '1px solid #bbf7d0', color: '#166534',
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
            }}
          >
            Total weight: {fmtNum(badge.total)} · {badge.count} edge{badge.count === 1 ? '' : 's'}
          </div>
        )}

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 10, left: 56, right: 70, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'none', zIndex: 10 }}>
          {stepState ? (
            <>
              {legendItem('#ef4444', 'Current node')}
              {legendItem('#22c55e', algo === 'bfs' || algo === 'dfs' ? 'Visited' : 'In tree / settled')}
              {stepState.consideredEdges.length > 0 && legendItem('#f59e0b', 'Considered', true)}
              {stepState.rejectedEdges.length > 0 && legendItem('#ef4444', 'Rejected', true)}
            </>
          ) : (
            <>
              {nodes.some((n) => (n.data as any)?.active) && legendItem('#ef4444', 'Active Call')}
              {nodes.some((n) => (n.data as any)?.returning) && legendItem('#f59e0b', 'Returning')}
              {nodes.some((n) => (n.data as any)?.completed) && legendItem('#22c55e', 'Completed')}
            </>
          )}
        </div>
      </div>

      {showPanel && (
        <div style={{ flex: 'none', padding: '10px 12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as StepAlgo | 'none')}
              style={{ fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b' }}
            >
              <option value="none">Step through…</option>
              {(Object.keys(STEP_ALGO_LABELS) as StepAlgo[]).map((k) => (
                <option key={k} value={k}>{STEP_ALGO_LABELS[k]}</option>
              ))}
            </select>
            {algo !== 'none' && (
              <>
                <button type="button" style={stepBtn(stepIndex < 0)} disabled={stepIndex < 0} onClick={goReset}>⟲ Reset</button>
                <button type="button" style={stepBtn(stepIndex < 0)} disabled={stepIndex < 0} onClick={goBack}>◀ Back</button>
                <button type="button" style={{ ...stepBtn(atEnd), ...(atEnd ? {} : { background: '#6366f1', borderColor: '#4f46e5', color: '#fff' }) }} disabled={atEnd} onClick={goNext}>Next ▶</button>
                <button type="button" style={stepBtn(atEnd)} disabled={atEnd} onClick={() => setPlaying((p) => !p)}>{playing ? '⏸ Pause' : '⏵ Play'}</button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                  Step {Math.max(0, stepIndex + 1)} / {total}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#334155', minHeight: 36, lineHeight: 1.4 }}>
            {stepState ? (
              <><strong>{stepState.title}.</strong> {stepState.description}</>
            ) : algo !== 'none' ? (
              <>Press <strong>Next</strong> to begin {STEP_ALGO_LABELS[algo]}.</>
            ) : (
              'Choose an algorithm to watch it run on this graph step by step.'
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GraphVisualization with Layout Helpers
// ============================================================================

/**
 * Create graph spec from algorithm data (linked list, tree, etc.)
 */
export function createGraphSpec(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: {
    layout?: GraphLayout;
    directed?: boolean;
    algorithm?: string | null;
    startNode?: string;
    highlight?: { nodes: string[]; edges: string[] };
  } = {}
): GraphSpec {
  return {
    nodes,
    edges,
    layout: options.layout, // undefined -> chosen from the graph's shape / algorithm
    directed: options.directed, // undefined -> inferred (MST/TSP undirected)
    algorithm: (options.algorithm || null) as GraphSpec['algorithm'],
    startNode: options.startNode,
    highlight: options.highlight,
  };
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = (props) => (
  <ReactFlowProvider>
    <_GraphVisualization {...props} />
  </ReactFlowProvider>
);
export default GraphVisualization;