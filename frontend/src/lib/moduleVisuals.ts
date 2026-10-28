import type { LessonVisualSpec } from '../types/lessonVisual';

// All examples are fixed, local teaching data. No model output or random layout.
const traversal: LessonVisualSpec = {
  type: 'diagram', title: 'Worked example: traverse a six-vertex graph',
  description: 'Start at A and visit neighbors alphabetically. Edges: A–B, A–C, B–D, B–E, C–F. BFS: A → B → C → D → E → F. DFS: A → B → D → E → C → F. The highlighted edges show the first BFS level.',
  nodes: [
    { id: 'A', label: 'A · start', x: 320, y: 40, highlight: true },
    { id: 'B', label: 'B', x: 180, y: 140 }, { id: 'C', label: 'C', x: 460, y: 140 },
    { id: 'D', label: 'D', x: 80, y: 250 }, { id: 'E', label: 'E', x: 270, y: 250 }, { id: 'F', label: 'F', x: 510, y: 250 },
  ],
  edges: [{ from: 'A', to: 'B', highlight: true }, { from: 'A', to: 'C', highlight: true }, { from: 'B', to: 'D' }, { from: 'B', to: 'E' }, { from: 'C', to: 'F' }],
};

const growth: LessonVisualSpec = {
  type: 'line', title: 'Worked example: how operation counts grow',
  description: 'Exact values for the functions shown. At n = 16: log₂ n = 4, n = 16, n log₂ n = 64, n² = 256. Each step on the vertical log scale represents multiplication, so the smaller curves remain visible.',
  xKey: 'n', xLabel: 'Input size n', yLabel: 'Operations', yScale: 'log',
  data: [{ n: 2, log: 1, linear: 2, nlog: 2, square: 4 }, { n: 4, log: 2, linear: 4, nlog: 8, square: 16 }, { n: 8, log: 3, linear: 8, nlog: 24, square: 64 }, { n: 16, log: 4, linear: 16, nlog: 64, square: 256 }],
  series: [{ key: 'log', name: 'log₂ n', color: '#10b981' }, { key: 'linear', name: 'n', color: '#3b82f6' }, { key: 'nlog', name: 'n log₂ n', color: '#a78bfa' }, { key: 'square', name: 'n²', color: '#f59e0b' }],
};

export const MODULE_VISUALS: Record<string, LessonVisualSpec[]> = {
  'Recursion': [{
    type: 'diagram', title: 'Worked example: factorial(4)', directed: true, diagramHeight: 380,
    description: 'Follow the calls downward: fact(4) → fact(3) → fact(2) → fact(1). The highlighted base case returns 1. Unwind upward: fact(2) = 2 × 1 = 2; fact(3) = 3 × 2 = 6; fact(4) = 4 × 6 = 24.',
    nodes: [{ id: 'f4', label: 'fact(4) = 24', x: 320, y: 40 }, { id: 'f3', label: 'fact(3) = 6', x: 320, y: 140 }, { id: 'f2', label: 'fact(2) = 2', x: 320, y: 240 }, { id: 'f1', label: 'fact(1) = 1', x: 320, y: 340, highlight: true }],
    edges: [{ from: 'f4', to: 'f3', label: '4 ×' }, { from: 'f3', to: 'f2', label: '3 ×' }, { from: 'f2', to: 'f1', label: '2 ×' }],
  }],
  'Binary Search': [{
    type: 'diagram', title: 'Worked example: find 13 in a sorted array', directed: true,
    description: 'Array [1, 3, 5, 7, 9, 11, 13], zero-based indices 0–6. First midpoint is index 3 (7): search right. Next midpoint is index 5 (11): search right again. Index 6 contains 13: found in 3 comparisons.',
    nodes: [{ id: 'first', label: 'a[3] = 7', x: 110, y: 140 }, { id: 'second', label: 'a[5] = 11', x: 320, y: 140 }, { id: 'found', label: 'a[6] = 13', x: 530, y: 140, highlight: true }],
    edges: [{ from: 'first', to: 'second', label: '13 > 7' }, { from: 'second', to: 'found', label: '13 > 11' }],
  }],
  'Graph Traversal (BFS/DFS)': [traversal],
  'Sorting Algorithms': [{
    type: 'bar', title: 'Worked example: sort [5, 2, 4, 1, 3]',
    description: 'Each bar is an array value, not a runtime estimate. Compare the original positions with the ascending result [1, 2, 3, 4, 5]. For insertion sort, inserting 2 into the sorted prefix [5] produces [2, 5, 4, 1, 3].',
    xKey: 'position', xLabel: 'Array position (zero-based)', yLabel: 'Value',
    data: [{ position: '0', before: 5, after: 1 }, { position: '1', before: 2, after: 2 }, { position: '2', before: 4, after: 3 }, { position: '3', before: 1, after: 4 }, { position: '4', before: 3, after: 5 }],
    series: [{ key: 'before', name: 'Before sorting', color: '#a78bfa' }, { key: 'after', name: 'After sorting', color: '#10b981' }],
  }],
  'Binary Trees': [{
    type: 'diagram', title: 'Worked example: binary search tree',
    description: 'Insert 8, 4, 12, 2, 6, 10, 14. Every left subtree contains smaller values and every right subtree contains larger values. Inorder: 2, 4, 6, 8, 10, 12, 14. Search for 6 follows 8 → 4 → 6 (highlighted).',
    nodes: [{ id: '8', label: '8 · root', x: 320, y: 40, highlight: true }, { id: '4', label: '4', x: 180, y: 140, highlight: true }, { id: '12', label: '12', x: 460, y: 140 }, { id: '2', label: '2', x: 80, y: 250 }, { id: '6', label: '6 · found', x: 240, y: 250, highlight: true }, { id: '10', label: '10', x: 400, y: 250 }, { id: '14', label: '14', x: 560, y: 250 }],
    edges: [{ from: '8', to: '4', highlight: true }, { from: '8', to: '12' }, { from: '4', to: '2' }, { from: '4', to: '6', highlight: true }, { from: '12', to: '10' }, { from: '12', to: '14' }],
  }],
  'Big-O Notation': [growth],
  'Module 7 & 8_ Complexity Theory and Emerging Topics': [{
    type: 'line', title: 'Worked example: polynomial versus exponential growth',
    description: 'Exact function values on a logarithmic vertical axis. At n = 16, n² = 256, n³ = 4,096, and 2ⁿ = 65,536. The exponential curve overtakes both polynomials; these are function values, not measured runtimes.',
    xKey: 'n', xLabel: 'Input size n', yLabel: 'Function value', yScale: 'log',
    data: [{ n: 2, q: 4, c: 8, e: 4 }, { n: 4, q: 16, c: 64, e: 16 }, { n: 8, q: 64, c: 512, e: 256 }, { n: 12, q: 144, c: 1728, e: 4096 }, { n: 16, q: 256, c: 4096, e: 65536 }],
    series: [{ key: 'q', name: 'n²', color: '#f59e0b' }, { key: 'c', name: 'n³', color: '#a78bfa' }, { key: 'e', name: '2ⁿ', color: '#ef4444' }],
  }],
  'Module 8.2 - EMERGING TOPICS': [{
    type: 'diagram', title: 'Online example: LRU cache updates', directed: true,
    description: 'Capacity 3; entries run least to most recently used. After requests A, B, C, the cache is [A,B,C]. A hit on A moves it to the end: [B,C,A]. Request D evicts B: [C,A,D]. FIFO would instead keep insertion order on the hit and evict A.',
    nodes: [{ id: 'filled', label: '[A, B, C]', x: 100, y: 140 }, { id: 'hit', label: '[B, C, A]', x: 320, y: 140 }, { id: 'evict', label: '[C, A, D]', x: 540, y: 140, highlight: true }],
    edges: [{ from: 'filled', to: 'hit', label: 'hit A' }, { from: 'hit', to: 'evict', label: 'miss D' }],
  }, {
    type: 'bar', title: 'Quantum example: Grover measurement probabilities',
    description: 'Four basis states; |10⟩ is marked. Initially every probability is 0.25. A phase oracle alone leaves those probabilities unchanged. After oracle plus diffusion, one ideal Grover iteration gives |10⟩ probability 1 and the other states probability 0.',
    xKey: 'state', xLabel: 'Basis state', yLabel: 'Measurement probability',
    data: [{ state: '|00⟩', before: .25, after: 0 }, { state: '|01⟩', before: .25, after: 0 }, { state: '|10⟩', before: .25, after: 1 }, { state: '|11⟩', before: .25, after: 0 }],
    series: [{ key: 'before', name: 'Before amplification', color: '#a78bfa' }, { key: 'after', name: 'After one iteration', color: '#10b981' }],
  }],
  'GROUP 2 - ALGORITHM ANALYSIS': [growth],
  'GROUP 3 - RECURRENCE RELATIONS': [{
    type: 'diagram', title: 'Worked example: T(n) = 2T(n/2) + n', directed: true,
    description: 'For n = 8, split into two size-4 problems and then four size-2 problems. Work per level is 8, then 4 + 4 = 8, then 2 + 2 + 2 + 2 = 8. There are log₂ n non-base levels, giving Θ(n log n) total work (with constant-time base cases).',
    nodes: [{ id: '8', label: 'n = 8', x: 320, y: 40, highlight: true }, { id: '4a', label: 'n = 4', x: 180, y: 140 }, { id: '4b', label: 'n = 4', x: 460, y: 140 }, { id: '2a', label: 'n = 2', x: 80, y: 250 }, { id: '2b', label: 'n = 2', x: 240, y: 250 }, { id: '2c', label: 'n = 2', x: 400, y: 250 }, { id: '2d', label: 'n = 2', x: 560, y: 250 }],
    edges: [{ from: '8', to: '4a' }, { from: '8', to: '4b' }, { from: '4a', to: '2a' }, { from: '4a', to: '2b' }, { from: '4b', to: '2c' }, { from: '4b', to: '2d' }],
  }],
  'GROUP 4 - ALGORITHM DESIGN TECHNIQUES': [{
    type: 'diagram', title: 'Worked example: greedy versus optimal coin change', directed: true,
    description: 'Coins {1, 3, 4}, target 6. Greedy takes 4 → 1 → 1 (3 coins). Dynamic programming finds 3 → 3 (2 coins). The highlighted choices each take a coin of value 3 to reach the optimal solution. This shows why a locally largest choice is not always globally optimal.',
    nodes: [{ id: 'start', label: 'Target 6', x: 90, y: 150 }, { id: 'g4', label: 'Remaining 2', x: 250, y: 60 }, { id: 'g1', label: 'Remaining 1', x: 410, y: 60 }, { id: 'g0', label: '0 · 3 coins', x: 560, y: 60 }, { id: 'd3', label: 'Remaining 3', x: 320, y: 250, highlight: true }, { id: 'd0', label: '0 · 2 coins', x: 560, y: 250, highlight: true }],
    edges: [{ from: 'start', to: 'g4', label: '−4' }, { from: 'g4', to: 'g1', label: '−1' }, { from: 'g1', to: 'g0', label: '−1' }, { from: 'start', to: 'd3', label: '−3', highlight: true }, { from: 'd3', to: 'd0', label: '−3', highlight: true }],
  }],
  'GROUP 5 - GRAPH ALGORITHM': [{
    type: 'diagram', title: 'Worked example: Dijkstra’s shortest path',
    description: 'Undirected edges carry nonnegative weights. Starting at A: d(A) = 0, d(B) = 2, d(C) = 3 via B, d(D) = 4 via B. The highlighted shortest path from A to D is A → B → D, cost 2 + 2 = 4; A → C → D costs 5 + 3 = 8.',
    nodes: [{ id: 'A', label: 'A · d = 0', x: 90, y: 150, highlight: true }, { id: 'B', label: 'B · d = 2', x: 320, y: 45, highlight: true }, { id: 'C', label: 'C · d = 3', x: 320, y: 255 }, { id: 'D', label: 'D · d = 4', x: 550, y: 150, highlight: true }],
    edges: [{ from: 'A', to: 'B', label: '2', highlight: true }, { from: 'A', to: 'C', label: '5' }, { from: 'B', to: 'C', label: '1' }, { from: 'B', to: 'D', label: '2', highlight: true }, { from: 'C', to: 'D', label: '3' }],
  }],
  'Module6_Advanced_Algorithms': [{
    type: 'diagram', title: 'Worked example: maximum flow = 12', directed: true,
    description: 'Edge labels are flow/capacity. Send 7 along S → A → T and 5 along S → B → T. Total flow is 12. The cut {S, A} | {B, T} has capacity 5 + 7 = 12, proving that no larger flow is possible.',
    nodes: [{ id: 'S', label: 'S · source', x: 90, y: 150, highlight: true }, { id: 'A', label: 'A', x: 320, y: 45 }, { id: 'B', label: 'B', x: 320, y: 255 }, { id: 'T', label: 'T · sink', x: 550, y: 150, highlight: true }],
    edges: [{ from: 'S', to: 'A', label: '7/10', highlight: true }, { from: 'A', to: 'T', label: '7/7', highlight: true }, { from: 'S', to: 'B', label: '5/5', highlight: true }, { from: 'B', to: 'T', label: '5/8', highlight: true }],
  }],
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/[\s_–—-]+/g, ' ');
}

export function getModuleVisuals(title: string): LessonVisualSpec[] {
  const normalized = normalizeTitle(title || '');
  const key = Object.keys(MODULE_VISUALS).find(candidate => normalizeTitle(candidate) === normalized);
  return key ? MODULE_VISUALS[key] : [];
}
