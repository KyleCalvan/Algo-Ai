// Algorithm Animation Engine - Barrel Export
// Real-Time Visual AI Tutor - Algorithm Implementations

// Sorting Algorithms
import {
  generateBubbleSortSteps,
  generateInsertionSortSteps,
  generateSelectionSortSteps,
  generateMergeSortSteps,
  generateQuickSortSteps,
  generateHeapSortSteps,
  generateBinarySearchSteps,
  sortingVisualConfig,
  searchingVisualConfig,
} from './sorting';
export {
  generateBubbleSortSteps,
  generateInsertionSortSteps,
  generateSelectionSortSteps,
  generateMergeSortSteps,
  generateQuickSortSteps,
  generateHeapSortSteps,
  generateBinarySearchSteps,
  sortingVisualConfig,
  searchingVisualConfig,
} from './sorting';

// Graph Algorithms
import {
  generateBFSSteps,
  generateDFSSteps,
  generateDijkstraSteps,
  generateTopologicalSteps,
  graphVisualConfig,
  type BFSInput,
  type DFSInput,
  type DijkstraInput,
  type TopologicalInput,
} from './graph';
export {
  generateBFSSteps,
  generateDFSSteps,
  generateDijkstraSteps,
  generateTopologicalSteps,
  type BFSInput,
  type DFSInput,
  type DijkstraInput,
  type TopologicalInput,
  graphVisualConfig,
} from './graph';

// Tree Algorithms
import {
  generateBSTInsertSteps,
  generateBSTSearchSteps,
  generateBSTDeleteSteps,
  generateBSTTraversalSteps,
  generateLinkedListSteps,
  treeVisualConfig,
  linkedListVisualConfig,
  type BSTInsertInput,
  type BSTSearchInput,
  type BSTDeleteInput,
  type BSTTraversalInput,
  type LinkedListInput,
} from './trees';
export {
  generateBSTInsertSteps,
  generateBSTSearchSteps,
  generateBSTDeleteSteps,
  generateBSTTraversalSteps,
  generateLinkedListSteps,
  type BSTInsertInput,
  type BSTSearchInput,
  type BSTDeleteInput,
  type BSTTraversalInput,
  type LinkedListInput,
  treeVisualConfig,
  linkedListVisualConfig,
} from './trees';

// Recursion Algorithms
import {
  generateFactorialSteps,
  generateFibonacciSteps,
  generateRecursiveBinarySearchSteps,
  generateHanoiSteps,
  recursionVisualConfig,
  type FactorialInput,
  type FibonacciInput,
  type RecursiveBinarySearchInput,
  type HanoiInput,
} from './recursion';
export {
  generateFactorialSteps,
  generateFibonacciSteps,
  generateRecursiveBinarySearchSteps,
  generateHanoiSteps,
  type FactorialInput,
  type FibonacciInput,
  type RecursiveBinarySearchInput,
  type HanoiInput,
  recursionVisualConfig,
} from './recursion';

// Unified Algorithm Runner
export interface AlgorithmGenerator<Input, Step> {
  generate: (input: Input, ...args: any[]) => Step[];
  visualConfig: any;
}

export const ALGORITHM_GENERATORS: Record<string, AlgorithmGenerator<any, any>> = {
  // Sorting
  'bubble-sort': { generate: generateBubbleSortSteps, visualConfig: sortingVisualConfig },
  'insertion-sort': { generate: generateInsertionSortSteps, visualConfig: sortingVisualConfig },
  'selection-sort': { generate: generateSelectionSortSteps, visualConfig: sortingVisualConfig },
  'merge-sort': { generate: generateMergeSortSteps, visualConfig: sortingVisualConfig },
  'quick-sort': { generate: generateQuickSortSteps, visualConfig: sortingVisualConfig },
  'heap-sort': { generate: generateHeapSortSteps, visualConfig: sortingVisualConfig },
  'binary-search': { generate: generateBinarySearchSteps, visualConfig: searchingVisualConfig },

  // Graph
  'bfs': { generate: generateBFSSteps, visualConfig: graphVisualConfig },
  'dfs': { generate: generateDFSSteps, visualConfig: graphVisualConfig },
  'dijkstra': { generate: generateDijkstraSteps, visualConfig: graphVisualConfig },
  'topological-sort': { generate: generateTopologicalSteps, visualConfig: graphVisualConfig },

  // Trees
  'bst-insert': { generate: generateBSTInsertSteps, visualConfig: treeVisualConfig },
  'bst-search': { generate: generateBSTSearchSteps, visualConfig: treeVisualConfig },
  'bst-delete': { generate: generateBSTDeleteSteps, visualConfig: treeVisualConfig },
  'bst-traversal': { generate: generateBSTTraversalSteps, visualConfig: treeVisualConfig },
  'linkedlist': { generate: generateLinkedListSteps, visualConfig: linkedListVisualConfig },

  // Recursion
  'factorial': { generate: generateFactorialSteps, visualConfig: recursionVisualConfig },
  'fibonacci': { generate: generateFibonacciSteps, visualConfig: recursionVisualConfig },
  'recursive-binary-search': { generate: generateRecursiveBinarySearchSteps, visualConfig: recursionVisualConfig },
  'hanoi': { generate: generateHanoiSteps, visualConfig: recursionVisualConfig },
};

export function getAlgorithmGenerator(name: string) {
  return ALGORITHM_GENERATORS[name];
}

export function listAvailableAlgorithms(): string[] {
  return Object.keys(ALGORITHM_GENERATORS);
}

export function getAlgorithmsByType(type: string): string[] {
  const typeMap: Record<string, string[]> = {
    sorting: ['bubble-sort', 'insertion-sort', 'selection-sort', 'merge-sort', 'quick-sort', 'heap-sort', 'binary-search'],
    graph: ['bfs', 'dfs', 'dijkstra', 'topological-sort'],
    tree: ['bst-insert', 'bst-search', 'bst-delete', 'bst-traversal'],
    list: ['linkedlist'],
    recursion: ['factorial', 'fibonacci', 'recursive-binary-search', 'hanoi'],
  };
  return typeMap[type] || [];
}