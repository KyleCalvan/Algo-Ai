/**
 * Graph Algorithm Visualizations
 * Generates step-by-step states for BFS, DFS, Dijkstra, etc.
 */

import type { AlgorithmStep, AlgorithmState, AlgorithmVisualConfig, GraphNode, GraphEdge } from '../../types/visualization';

// ============================================================================
// Graph Helpers
// ============================================================================

function createGraphNodes(values: (string | number)[], positions: { x: number; y: number }[]): GraphNode[] {
  return values.map((value, index) => ({
    id: `node-${index}`,
    position: positions[index] || { x: index * 120, y: 100 },
    data: {
      label: String(value),
      value,
      visited: false,
      distance: Infinity,
      predecessor: undefined,
    },
    style: {
      backgroundColor: '#6366f1',
      borderColor: '#4f46e5',
      borderWidth: 2,
      borderRadius: 8,
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 600,
      padding: { x: 12, y: 8 },
    },
  }));
}

function createGraphEdges(edges: Array<{ source: number; target: number; weight?: number; directed?: boolean }>, nodeIds: string[]): GraphEdge[] {
  return edges.map((edge, index) => ({
    id: `edge-${index}`,
    source: nodeIds[edge.source],
    target: nodeIds[edge.target],
    label: edge.weight !== undefined ? String(edge.weight) : undefined,
    style: {
      strokeColor: '#94a3b8',
      strokeWidth: 2,
      animated: false,
    },
    markerEnd: edge.directed ? 'arrowclosed' : 'none',
    weight: edge.weight,
  }));
}

function getGridPositions(count: number, cols: number = 4, spacing: number = 120): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions.push({ x: col * spacing + 60, y: row * spacing + 60 });
  }
  return positions;
}

function getCircularPositions(count: number, radius: number = 200, centerX: number = 300, centerY: number = 200): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return positions;
}

function cloneGraphState(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: nodes.map(n => ({ ...n, data: { ...n.data }, style: { ...n.style } })),
    edges: edges.map(e => ({ ...e, style: { ...e.style } })),
  };
}

function applyHighlight(nodes: GraphNode[], edges: GraphEdge[], highlight: { nodes: string[]; edges: string[] }, nodeStyle?: Partial<any>, edgeStyle?: Partial<any>): void {
  for (const node of nodes) {
    if (highlight.nodes.includes(node.id)) {
      node.style = { ...node.style, ...nodeStyle };
    }
  }
  for (const edge of edges) {
    if (highlight.edges.includes(edge.id)) {
      edge.style = { ...edge.style, ...edgeStyle };
    }
  }
}

// ============================================================================
// Breadth-First Search (BFS)
// ============================================================================

export interface BFSInput {
  nodes: (string | number)[];
  edges: Array<{ source: number; target: number; directed?: boolean }>;
  startNode: number;
}

export function generateBFSSteps(input: BFSInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { nodes: nodeValues, edges: edgeList, startNode } = input;
  const nodeCount = nodeValues.length;

  // Create initial graph
  const positions = getCircularPositions(nodeCount);
  let nodes = createGraphNodes(nodeValues, positions);
  const nodeIds = nodes.map(n => n.id);
  let edges = createGraphEdges(edgeList, nodeIds);

  // Build adjacency list
  const adj: number[][] = Array(nodeCount).fill(null).map(() => []);
  for (const edge of edgeList) {
    adj[edge.source].push(edge.target);
    if (!edge.directed) adj[edge.target].push(edge.source);
  }

  steps.push({
    index: 0,
    description: `BFS starting from node ${nodeValues[startNode]}`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [nodes[startNode].id] },
    operations: [{ type: 'visit', elements: [startNode], details: `Start at ${nodeValues[startNode]}` }],
  });

  let stepIndex = 1;
  const visited = new Set<number>();
  const queue: number[] = [startNode];
  visited.add(startNode);

  // Update start node style
  nodes[startNode].data.visited = true;
  nodes[startNode].style = { ...nodes[startNode].style, backgroundColor: '#22c55e', borderColor: '#16a34a' };

  while (queue.length > 0) {
    const current = queue.shift()!;

    steps.push({
      index: stepIndex++,
      description: `Dequeue and visit ${nodeValues[current]}`,
      state: { graph: cloneGraphState(nodes, edges) },
      highlight: { nodeIds: [nodes[current].id] },
      operations: [{ type: 'dequeue', elements: [current], details: `Visit ${nodeValues[current]}` }],
    });

    // Check neighbors
    for (const neighbor of adj[current]) {
      const edgeId = edges.findIndex(e =>
        (e.source === nodes[current].id && e.target === nodes[neighbor].id) ||
        (e.target === nodes[current].id && e.source === nodes[neighbor].id)
      );

      if (!visited.has(neighbor)) {
        steps.push({
          index: stepIndex++,
          description: `Check neighbor ${nodeValues[neighbor]} of ${nodeValues[current]}`,
          state: { graph: cloneGraphState(nodes, edges) },
          highlight: { nodeIds: [nodes[current].id, nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
          operations: [
            { type: 'visit', elements: [neighbor], details: `Check neighbor ${nodeValues[neighbor]}` },
            { type: 'highlight', elements: [nodes[neighbor].id], details: 'Highlight edge' },
          ],
        });

        visited.add(neighbor);
        queue.push(neighbor);
        nodes[neighbor].data.visited = true;
        nodes[neighbor].data.distance = (nodes[current].data.distance as number) + 1;
        nodes[neighbor].data.predecessor = nodes[current].id;
        nodes[neighbor].style = { ...nodes[neighbor].style, backgroundColor: '#3b82f6', borderColor: '#2563eb' };

        if (edgeId >= 0) {
          edges[edgeId].style = { ...edges[edgeId].style, strokeColor: '#3b82f6', strokeWidth: 3, animated: true };
        }

        steps.push({
          index: stepIndex++,
          description: `Enqueue ${nodeValues[neighbor]} (distance: ${nodes[neighbor].data.distance})`,
          state: { graph: cloneGraphState(nodes, edges) },
          highlight: { nodeIds: [nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
          operations: [{ type: 'enqueue', elements: [neighbor], details: `Enqueue ${nodeValues[neighbor]}` }],
        });
      } else {
        steps.push({
          index: stepIndex++,
          description: `Neighbor ${nodeValues[neighbor]} already visited`,
          state: { graph: cloneGraphState(nodes, edges) },
          highlight: { nodeIds: [nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
          operations: [],
        });
      }
    }
  }

  steps.push({
    index: stepIndex,
    description: `BFS complete. All reachable nodes visited.`,
    state: { graph: cloneGraphState(nodes, edges) },
    highlight: { nodeIds: nodes.filter(n => n.data.visited).map(n => n.id) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Depth-First Search (DFS)
// ============================================================================

export interface DFSInput {
  nodes: (string | number)[];
  edges: Array<{ source: number; target: number; directed?: boolean }>;
  startNode: number;
}

export function generateDFSSteps(input: DFSInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { nodes: nodeValues, edges: edgeList, startNode } = input;
  const nodeCount = nodeValues.length;

  const positions = getCircularPositions(nodeCount);
  let nodes = createGraphNodes(nodeValues, positions);
  const nodeIds = nodes.map(n => n.id);
  let edges = createGraphEdges(edgeList, nodeIds);

  const adj: number[][] = Array(nodeCount).fill(null).map(() => []);
  for (const edge of edgeList) {
    adj[edge.source].push(edge.target);
    if (!edge.directed) adj[edge.target].push(edge.source);
  }

  steps.push({
    index: 0,
    description: `DFS starting from node ${nodeValues[startNode]}`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [nodes[startNode].id] },
    operations: [{ type: 'visit', elements: [startNode], details: `Start at ${nodeValues[startNode]}` }],
  });

  let stepIndex = 1;
  const visited = new Set<number>();
  const stack: Array<{ node: number; parent: number | null; iterator: number }> = [];

  function dfsRecursive(current: number, parent: number | null): void {
    visited.add(current);
    nodes[current].data.visited = true;
    nodes[current].style = { ...nodes[current].style, backgroundColor: '#22c55e', borderColor: '#16a34a' };

    steps.push({
      index: stepIndex++,
      description: `Visit ${nodeValues[current]}`,
      state: { graph: cloneGraphState(nodes, edges) },
      highlight: { nodeIds: [nodes[current].id] },
      operations: [{ type: 'visit', elements: [current], details: `Visit ${nodeValues[current]}` }],
    });

    for (const neighbor of adj[current]) {
      const edgeId = edges.findIndex(e =>
        (e.source === nodes[current].id && e.target === nodes[neighbor].id) ||
        (e.target === nodes[current].id && e.source === nodes[neighbor].id)
      );

      steps.push({
        index: stepIndex++,
        description: `Check neighbor ${nodeValues[neighbor]} of ${nodeValues[current]}`,
        state: { graph: cloneGraphState(nodes, edges) },
        highlight: { nodeIds: [nodes[current].id, nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
        operations: [{ type: 'visit', elements: [neighbor], details: `Check ${nodeValues[neighbor]}` }],
      });

      if (!visited.has(neighbor)) {
        if (edgeId >= 0) {
          edges[edgeId].style = { ...edges[edgeId].style, strokeColor: '#22c55e', strokeWidth: 3 };
        }
        dfsRecursive(neighbor, current);
      } else {
        steps.push({
          index: stepIndex++,
          description: `Neighbor ${nodeValues[neighbor]} already visited (back edge)`,
          state: { graph: cloneGraphState(nodes, edges) },
          highlight: { nodeIds: [nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
          operations: [],
        });
        if (edgeId >= 0) {
          edges[edgeId].style = { ...edges[edgeId].style, strokeColor: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' };
        }
      }
    }

    steps.push({
      index: stepIndex++,
      description: `Backtrack from ${nodeValues[current]}`,
      state: { graph: cloneGraphState(nodes, edges) },
      highlight: { nodeIds: [nodes[current].id] },
      operations: [{ type: 'highlight', elements: [current], details: `Backtrack` }],
    });
  }

  dfsRecursive(startNode, null);

  steps.push({
    index: stepIndex,
    description: `DFS complete. All reachable nodes visited.`,
    state: { graph: cloneGraphState(nodes, edges) },
    highlight: { nodeIds: nodes.filter(n => n.data.visited).map(n => n.id) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Dijkstra's Algorithm
// ============================================================================

export interface DijkstraInput {
  nodes: (string | number)[];
  edges: Array<{ source: number; target: number; weight: number; directed?: boolean }>;
  startNode: number;
  targetNode?: number;
}

export function generateDijkstraSteps(input: DijkstraInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { nodes: nodeValues, edges: edgeList, startNode, targetNode } = input;
  const nodeCount = nodeValues.length;

  const positions = getCircularPositions(nodeCount);
  let nodes = createGraphNodes(nodeValues, positions);
  const nodeIds = nodes.map(n => n.id);
  let edges = createGraphEdges(edgeList, nodeIds);

  const adj: Array<Array<{ to: number; weight: number }>> = Array(nodeCount).fill(null).map(() => []);
  for (const edge of edgeList) {
    adj[edge.source].push({ to: edge.target, weight: edge.weight });
    if (!edge.directed) adj[edge.target].push({ to: edge.source, weight: edge.weight });
  }

  steps.push({
    index: 0,
    description: `Dijkstra from ${nodeValues[startNode]}${targetNode !== undefined ? ` to ${nodeValues[targetNode]}` : ''}`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [nodes[startNode].id] },
    operations: [{ type: 'visit', elements: [startNode], details: `Initialize distances` }],
  });

  let stepIndex = 1;
  const distances: number[] = Array(nodeCount).fill(Infinity);
  const visited = new Set<number>();
  const previous: (string | null)[] = Array(nodeCount).fill(null);
  distances[startNode] = 0;
  nodes[startNode].data.distance = 0;

  // Priority queue simulation
  const pq: Array<{ dist: number; node: number }> = [{ dist: 0, node: startNode }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: current, dist: currentDist } = pq.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    steps.push({
      index: stepIndex++,
      description: `Extract min: ${nodeValues[current]} (distance: ${currentDist})`,
      state: { graph: cloneGraphState(nodes, edges) },
      highlight: { nodeIds: [nodes[current].id] },
      operations: [{ type: 'visit', elements: [current], details: `Visit ${nodeValues[current]}, dist=${currentDist}` }],
    });

    nodes[current].data.visited = true;
    nodes[current].style = { ...nodes[current].style, backgroundColor: '#22c55e', borderColor: '#16a34a' };

    if (targetNode !== undefined && current === targetNode) {
      steps.push({
        index: stepIndex++,
        description: `Target ${nodeValues[targetNode]} reached!`,
        state: { graph: cloneGraphState(nodes, edges) },
        highlight: { nodeIds: [nodes[targetNode].id] },
        operations: [{ type: 'highlight', elements: [targetNode], details: 'Target found!' }],
      });
      break;
    }

    for (const { to: neighbor, weight } of adj[current]) {
      if (visited.has(neighbor)) continue;

      const edgeId = edges.findIndex(e =>
        (e.source === nodes[current].id && e.target === nodes[neighbor].id) ||
        (e.target === nodes[current].id && e.source === nodes[neighbor].id)
      );

      const newDist = currentDist + weight;

      steps.push({
        index: stepIndex++,
        description: `Relax edge to ${nodeValues[neighbor]}: ${distances[neighbor] === Infinity ? '∞' : distances[neighbor]} → ${newDist}`,
        state: { graph: cloneGraphState(nodes, edges) },
        highlight: { nodeIds: [nodes[current].id, nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
        operations: [{ type: 'compare', elements: [neighbor], details: `New dist = ${currentDist} + ${weight} = ${newDist}` }],
      });

      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        previous[neighbor] = nodes[current].id;
        nodes[neighbor].data.distance = newDist;
        nodes[neighbor].data.predecessor = nodes[current].id;

        pq.push({ dist: newDist, node: neighbor });

        if (edgeId >= 0) {
          edges[edgeId].style = { ...edges[edgeId].style, strokeColor: '#3b82f6', strokeWidth: 3, animated: true };
        }

        steps.push({
          index: stepIndex++,
          description: `Update distance to ${nodeValues[neighbor]} = ${newDist}`,
          state: { graph: cloneGraphState(nodes, edges) },
          highlight: { nodeIds: [nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
          operations: [{ type: 'assign', elements: [neighbor], details: `distance[${neighbor}] = ${newDist}` }],
        });
      }
    }
  }

  // Highlight shortest path if target found
  if (targetNode !== undefined && previous[targetNode] !== null) {
    const path: string[] = [];
    let curr: number | null = targetNode;
    while (curr !== null) {
      path.unshift(nodes[curr].id);
      const prevId: string | null = previous[curr];
      curr = prevId ? nodes.findIndex(n => n.id === prevId) : null;
    }

    const pathEdges: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edgeId = edges.findIndex(e =>
        (e.source === path[i] && e.target === path[i + 1]) ||
        (e.target === path[i] && e.source === path[i + 1])
      );
      if (edgeId >= 0) pathEdges.push(edges[edgeId].id);
    }

    for (const nodeId of path) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) node.style = { ...node.style, backgroundColor: '#f59e0b', borderColor: '#d97706' };
    }
    for (const edgeId of pathEdges) {
      const edge = edges.find(e => e.id === edgeId);
      if (edge) edge.style = { ...edge.style, strokeColor: '#f59e0b', strokeWidth: 4 };
    }

    steps.push({
      index: stepIndex++,
      description: `Shortest path: ${path.map(id => nodes.find(n => n.id === id)?.data.label).join(' → ')}`,
      state: { graph: cloneGraphState(nodes, edges) },
      highlight: { nodeIds: path, edgeIds: pathEdges },
      operations: [{ type: 'highlight', elements: path, details: 'Shortest path highlighted' }],
    });
  }

  steps.push({
    index: stepIndex,
    description: `Dijkstra complete.`,
    state: { graph: cloneGraphState(nodes, edges) },
    highlight: { nodeIds: nodes.filter(n => n.data.visited).map(n => n.id) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Topological Sort
// ============================================================================

export interface TopologicalInput {
  nodes: (string | number)[];
  edges: Array<{ source: number; target: number }>;
}

export function generateTopologicalSteps(input: TopologicalInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { nodes: nodeValues, edges: edgeList } = input;
  const nodeCount = nodeValues.length;

  const positions = getGridPositions(nodeCount);
  let nodes = createGraphNodes(nodeValues, positions);
  const nodeIds = nodes.map(n => n.id);
  let edges = createGraphEdges(edgeList, nodeIds);

  const adj: number[][] = Array(nodeCount).fill(null).map(() => []);
  const inDegree: number[] = Array(nodeCount).fill(0);
  for (const edge of edgeList) {
    adj[edge.source].push(edge.target);
    inDegree[edge.target]++;
  }

  steps.push({
    index: 0,
    description: `Topological sort on DAG with ${nodeCount} nodes`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [] },
    operations: [],
  });

  let stepIndex = 1;
  const queue: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const result: number[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    steps.push({
      index: stepIndex++,
      description: `Process node ${nodeValues[current]} (in-degree: 0)`,
      state: { graph: cloneGraphState(nodes, edges) },
      highlight: { nodeIds: [nodes[current].id] },
      operations: [{ type: 'visit', elements: [current], details: `Add ${nodeValues[current]} to result` }],
    });

    nodes[current].data.visited = true;
    nodes[current].style = { ...nodes[current].style, backgroundColor: '#22c55e', borderColor: '#16a34a' };

    for (const neighbor of adj[current]) {
      const edgeId = edges.findIndex(e => e.source === nodes[current].id && e.target === nodes[neighbor].id);
      inDegree[neighbor]--;

      steps.push({
        index: stepIndex++,
        description: `Decrease in-degree of ${nodeValues[neighbor]} to ${inDegree[neighbor]}`,
        state: { graph: cloneGraphState(nodes, edges) },
        highlight: { nodeIds: [nodes[current].id, nodes[neighbor].id], edgeIds: edgeId >= 0 ? [edges[edgeId].id] : [] },
        operations: [{ type: 'assign', elements: [neighbor], details: `in-degree[${neighbor}] = ${inDegree[neighbor]}` }],
      });

      if (edgeId >= 0) {
        edges[edgeId].style = { ...edges[edgeId].style, strokeColor: '#22c55e', strokeWidth: 3 };
      }

      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
        steps.push({
          index: stepIndex++,
          description: `${nodeValues[neighbor]} now has in-degree 0, enqueue`,
          state: { graph: cloneGraphState(nodes, edges) },
          highlight: { nodeIds: [nodes[neighbor].id] },
          operations: [{ type: 'enqueue', elements: [neighbor], details: `Enqueue ${nodeValues[neighbor]}` }],
        });
      }
    }
  }

  steps.push({
    index: stepIndex,
    description: `Topological order: ${result.map(i => nodeValues[i]).join(' → ')}`,
    state: { graph: cloneGraphState(nodes, edges) },
    highlight: { nodeIds: result.map(i => nodes[i].id) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Visual Configs
// ============================================================================

export const graphVisualConfig: AlgorithmVisualConfig = {
  graph: {
    nodeSize: 40,
    edgeLength: 150,
    showWeights: true,
    showDistances: true,
  },
};