// Client-side step generators for graph algorithms.
// The graph component calls these so Back / Next works even when the AI only
// sends a static graph (nodes + weighted edges) and no animation steps.

export type StepAlgo = 'prim' | 'kruskal' | 'dijkstra' | 'bfs' | 'dfs';

export interface StepNode { id: string; label?: string }
export interface StepEdge { id: string; source: string; target: string; weight?: number }

export interface GraphStepState {
  title: string;
  description: string;
  visitedNodes: string[];
  currentNode?: string;
  acceptedEdges: string[];   // part of the result so far (MST edge, shortest-path-tree edge, BFS/DFS tree edge)
  consideredEdges: string[]; // being looked at in this step
  rejectedEdges: string[];   // rejected (would form a cycle, ...)
  distances?: Record<string, number>;
  totalWeight?: number;
}

export const STEP_ALGO_LABELS: Record<StepAlgo, string> = {
  prim: "Prim's MST",
  kruskal: "Kruskal's MST",
  dijkstra: "Dijkstra's shortest paths",
  bfs: 'Breadth-first search',
  dfs: 'Depth-first search',
};

/** Read an edge weight from the many field names an LLM might use. */
export function readWeight(e: any): number | undefined {
  if (!e) return undefined;
  const candidates = [
    e.weight, e.cost, e.w, e.distance, e.length, e.value,
    e.data?.weight, e.data?.cost, e.data?.w, e.data?.distance, e.data?.value, e.data?.label,
    e.label,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    if (typeof c === 'string' && c.trim() !== '' && Number.isFinite(Number(c))) return Number(c);
  }
  return undefined;
}

export function inferStepAlgo(name?: string | null): StepAlgo | 'none' {
  const a = (name || '').toLowerCase();
  if (/prim/.test(a)) return 'prim';
  if (/kruskal/.test(a)) return 'kruskal';
  if (/mst|spanning/.test(a)) return 'prim';
  if (/dijkstra|shortest/.test(a)) return 'dijkstra';
  if (/bfs|breadth/.test(a)) return 'bfs';
  if (/dfs|depth/.test(a)) return 'dfs';
  return 'none';
}

const name = (nodes: StepNode[], id: string) => nodes.find((n) => n.id === id)?.label ?? id;
const w = (e: StepEdge) => (typeof e.weight === 'number' ? e.weight : 1);
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

export function generateGraphSteps(
  algo: StepAlgo,
  nodes: StepNode[],
  edges: StepEdge[],
  opts: { start?: string; directed?: boolean } = {},
): GraphStepState[] {
  if (!nodes.length) return [];
  const start = opts.start && nodes.some((n) => n.id === opts.start) ? opts.start : nodes[0].id;
  const directed = !!opts.directed;
  switch (algo) {
    case 'prim': return prim(nodes, edges, start);
    case 'kruskal': return kruskal(nodes, edges);
    case 'dijkstra': return dijkstra(nodes, edges, start, directed);
    case 'bfs': return bfs(nodes, edges, start, directed);
    case 'dfs': return dfs(nodes, edges, start, directed);
  }
}

// ---------------------------------------------------------------------------
function prim(nodes: StepNode[], edges: StepEdge[], start: string): GraphStepState[] {
  const steps: GraphStepState[] = [];
  const visited = new Set<string>([start]);
  const accepted: string[] = [];
  let total = 0;
  const L = (e: StepEdge) => `${name(nodes, e.source)}–${name(nodes, e.target)} (${fmt(w(e))})`;

  steps.push({
    title: 'Start',
    description: `Start from ${name(nodes, start)}. It is the first node of the tree. Each step adds the cheapest edge that connects the tree to a node outside it.`,
    visitedNodes: [start], currentNode: start, acceptedEdges: [], consideredEdges: [], rejectedEdges: [], totalWeight: 0,
  });

  while (visited.size < nodes.length) {
    const candidates = edges.filter((e) => visited.has(e.source) !== visited.has(e.target));
    if (!candidates.length) {
      steps.push({
        title: 'Disconnected',
        description: 'No edge connects the tree to the remaining nodes, so the graph is not connected. This is a minimum spanning forest.',
        visitedNodes: [...visited], acceptedEdges: [...accepted], consideredEdges: [], rejectedEdges: [], totalWeight: total,
      });
      break;
    }
    let best = candidates[0];
    for (const c of candidates) if (w(c) < w(best)) best = c;
    const next = visited.has(best.source) ? best.target : best.source;

    steps.push({
      title: 'Find cheapest edge',
      description: `Edges leaving the tree: ${candidates.map(L).join(', ')}. The cheapest is ${L(best)}.`,
      visitedNodes: [...visited], acceptedEdges: [...accepted], consideredEdges: candidates.map((c) => c.id), rejectedEdges: [], totalWeight: total,
    });

    visited.add(next);
    accepted.push(best.id);
    total += w(best);
    steps.push({
      title: 'Add edge',
      description: `Add ${L(best)} and bring ${name(nodes, next)} into the tree. Tree weight is now ${fmt(total)}.`,
      visitedNodes: [...visited], currentNode: next, acceptedEdges: [...accepted], consideredEdges: [], rejectedEdges: [], totalWeight: total,
    });
  }

  if (visited.size === nodes.length) {
    steps.push({
      title: 'Done',
      description: `All ${nodes.length} nodes are connected using ${accepted.length} edges. Minimum spanning tree weight = ${fmt(total)}.`,
      visitedNodes: [...visited], acceptedEdges: [...accepted], consideredEdges: [], rejectedEdges: [], totalWeight: total,
    });
  }
  return steps;
}

// ---------------------------------------------------------------------------
function kruskal(nodes: StepNode[], edges: StepEdge[]): GraphStepState[] {
  const steps: GraphStepState[] = [];
  const sorted = [...edges].sort((a, b) => w(a) - w(b));
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (x: string): string => {
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x)!)!); x = parent.get(x)!; }
    return x;
  };
  const accepted: string[] = [];
  const rejected: string[] = [];
  let total = 0;
  const touched = new Set<string>();
  const L = (e: StepEdge) => `${name(nodes, e.source)}–${name(nodes, e.target)} (${fmt(w(e))})`;

  steps.push({
    title: 'Sort edges',
    description: `Sort all edges by weight: ${sorted.map(L).join(', ')}. Then take them in order, keeping an edge only if it does not create a cycle.`,
    visitedNodes: [], acceptedEdges: [], consideredEdges: [], rejectedEdges: [], totalWeight: 0,
  });

  for (const e of sorted) {
    if (accepted.length === nodes.length - 1) break;
    const ra = find(e.source);
    const rb = find(e.target);
    if (ra !== rb) {
      parent.set(ra, rb);
      accepted.push(e.id);
      total += w(e);
      touched.add(e.source); touched.add(e.target);
      steps.push({
        title: 'Accept edge',
        description: `Consider ${L(e)}: it joins two separate components, so add it. Total weight = ${fmt(total)}.`,
        visitedNodes: [...touched], acceptedEdges: [...accepted], consideredEdges: [], rejectedEdges: [...rejected], totalWeight: total,
      });
    } else {
      rejected.push(e.id);
      steps.push({
        title: 'Reject edge',
        description: `Consider ${L(e)}: ${name(nodes, e.source)} and ${name(nodes, e.target)} are already connected, so this edge would form a cycle. Skip it.`,
        visitedNodes: [...touched], acceptedEdges: [...accepted], consideredEdges: [], rejectedEdges: [...rejected], totalWeight: total,
      });
    }
  }

  steps.push({
    title: 'Done',
    description: `Selected ${accepted.length} edges. Minimum spanning tree weight = ${fmt(total)}.`,
    visitedNodes: [...touched], acceptedEdges: [...accepted], consideredEdges: [], rejectedEdges: [...rejected], totalWeight: total,
  });
  return steps;
}

// ---------------------------------------------------------------------------
function neighbours(edges: StepEdge[], u: string, directed: boolean): { v: string; e: StepEdge }[] {
  const out: { v: string; e: StepEdge }[] = [];
  for (const e of edges) {
    if (e.source === u) out.push({ v: e.target, e });
    else if (!directed && e.target === u) out.push({ v: e.source, e });
  }
  return out;
}

function dijkstra(nodes: StepNode[], edges: StepEdge[], start: string, directed: boolean): GraphStepState[] {
  const steps: GraphStepState[] = [];
  const dist: Record<string, number> = {};
  nodes.forEach((n) => (dist[n.id] = Infinity));
  dist[start] = 0;
  const via = new Map<string, string>(); // node -> edge id used for its best distance
  const done = new Set<string>();
  const snapshot = () => ({ ...dist });
  const treeEdges = () => [...done].map((n) => via.get(n)).filter(Boolean) as string[];

  steps.push({
    title: 'Start',
    description: `Distance to ${name(nodes, start)} is 0; every other node starts at ∞. Repeatedly settle the closest unsettled node and relax its edges.`,
    visitedNodes: [], currentNode: start, acceptedEdges: [], consideredEdges: [], rejectedEdges: [], distances: snapshot(),
  });

  while (done.size < nodes.length) {
    let u: string | undefined;
    for (const n of nodes) if (!done.has(n.id) && dist[n.id] < Infinity && (u === undefined || dist[n.id] < dist[u])) u = n.id;
    if (u === undefined) break;
    done.add(u);
    const updates: string[] = [];
    const considered: string[] = [];
    for (const { v, e } of neighbours(edges, u, directed)) {
      if (done.has(v)) continue;
      considered.push(e.id);
      const nd = dist[u] + w(e);
      if (nd < dist[v]) {
        dist[v] = nd;
        via.set(v, e.id);
        updates.push(`${name(nodes, v)} = ${fmt(nd)}`);
      }
    }
    steps.push({
      title: `Settle ${name(nodes, u)}`,
      description: `Settle ${name(nodes, u)} (distance ${fmt(dist[u])}). ` + (updates.length ? `Improved: ${updates.join(', ')}.` : 'No distances improved.'),
      visitedNodes: [...done], currentNode: u, acceptedEdges: treeEdges(), consideredEdges: considered, rejectedEdges: [], distances: snapshot(),
    });
  }

  steps.push({
    title: 'Done',
    description: 'All reachable nodes are settled. Green edges form the shortest-path tree.',
    visitedNodes: [...done], acceptedEdges: treeEdges(), consideredEdges: [], rejectedEdges: [], distances: snapshot(),
  });
  return steps;
}

// ---------------------------------------------------------------------------
function bfs(nodes: StepNode[], edges: StepEdge[], start: string, directed: boolean): GraphStepState[] {
  const steps: GraphStepState[] = [];
  const seen = new Set<string>([start]);
  const visited: string[] = [];
  const tree: string[] = [];
  const queue: string[] = [start];

  steps.push({
    title: 'Start',
    description: `Put ${name(nodes, start)} in the queue. Visit nodes in the order they were discovered, level by level.`,
    visitedNodes: [], currentNode: start, acceptedEdges: [], consideredEdges: [], rejectedEdges: [],
  });

  while (queue.length) {
    const u = queue.shift()!;
    visited.push(u);
    const found: string[] = [];
    const considered: string[] = [];
    for (const { v, e } of neighbours(edges, u, directed)) {
      if (!seen.has(v)) { seen.add(v); queue.push(v); tree.push(e.id); considered.push(e.id); found.push(name(nodes, v)); }
    }
    steps.push({
      title: `Visit ${name(nodes, u)}`,
      description: `Visit ${name(nodes, u)}. ` + (found.length ? `Discovered ${found.join(', ')} and added to the queue.` : 'No new neighbours.') + (queue.length ? ` Queue: ${queue.map((q) => name(nodes, q)).join(', ')}.` : ' Queue is empty.'),
      visitedNodes: [...visited], currentNode: u, acceptedEdges: [...tree], consideredEdges: considered, rejectedEdges: [],
    });
  }
  steps.push({ title: 'Done', description: `Visit order: ${visited.map((v) => name(nodes, v)).join(' → ')}.`, visitedNodes: [...visited], acceptedEdges: [...tree], consideredEdges: [], rejectedEdges: [] });
  return steps;
}

function dfs(nodes: StepNode[], edges: StepEdge[], start: string, directed: boolean): GraphStepState[] {
  const steps: GraphStepState[] = [];
  const seen = new Set<string>();
  const visited: string[] = [];
  const tree: string[] = [];

  const visit = (u: string, via?: StepEdge, from?: string) => {
    seen.add(u);
    visited.push(u);
    if (via) tree.push(via.id);
    steps.push({
      title: `Visit ${name(nodes, u)}`,
      description: from ? `Go from ${name(nodes, from)} to ${name(nodes, u)} and keep going deeper.` : `Start at ${name(nodes, u)} and go as deep as possible before backtracking.`,
      visitedNodes: [...visited], currentNode: u, acceptedEdges: [...tree], consideredEdges: via ? [via.id] : [], rejectedEdges: [],
    });
    for (const { v, e } of neighbours(edges, u, directed)) {
      if (!seen.has(v)) {
        visit(v, e, u);
        steps.push({
          title: `Back to ${name(nodes, u)}`,
          description: `${name(nodes, v)} is finished, so backtrack to ${name(nodes, u)} and try its next neighbour.`,
          visitedNodes: [...visited], currentNode: u, acceptedEdges: [...tree], consideredEdges: [], rejectedEdges: [],
        });
      }
    }
  };
  visit(start);
  steps.push({ title: 'Done', description: `Visit order: ${visited.map((v) => name(nodes, v)).join(' → ')}.`, visitedNodes: [...visited], acceptedEdges: [...tree], consideredEdges: [], rejectedEdges: [] });
  return steps;
}