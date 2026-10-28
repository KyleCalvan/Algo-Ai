/**
 * Sorting Algorithm Visualizations
 * Generates step-by-step states for algorithm animations
 */

import type { AlgorithmStep, AlgorithmState, AlgorithmVisualConfig } from '../../types/visualization';

// ============================================================================
// Bubble Sort
// ============================================================================

export function generateBubbleSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  // Initial state
  steps.push({
    index: 0,
    description: `Initial array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Compare step
      steps.push({
        index: stepIndex++,
        description: `Compare ${arr[j]} and ${arr[j + 1]}`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
        highlight: { arrayIndices: [j, j + 1] },
        operations: [{ type: 'compare', elements: [j, j + 1], details: `Comparing ${arr[j]} > ${arr[j + 1]}` }],
      });

      if (arr[j] > arr[j + 1]) {
        // Swap step
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;

        steps.push({
          index: stepIndex++,
          description: `Swap ${arr[j + 1]} and ${arr[j]} (${arr[j + 1]} > ${arr[j]})`,
          state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
          highlight: { arrayIndices: [j, j + 1] },
          operations: [
            { type: 'swap', elements: [j, j + 1], details: `Swapped ${arr[j + 1]} and ${arr[j]}` },
            { type: 'assign', elements: [j], details: `arr[${j}] = ${arr[j]}` },
            { type: 'assign', elements: [j + 1], details: `arr[${j + 1}] = ${arr[j + 1]}` },
          ],
        });
      } else {
        steps.push({
          index: stepIndex++,
          description: `No swap needed (${arr[j]} ≤ ${arr[j + 1]})`,
          state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
          highlight: { arrayIndices: [j, j + 1] },
          operations: [],
        });
      }
    }
    // Mark last element as sorted
    steps.push({
      index: stepIndex++,
      description: `Element at index ${n - i - 1} (${arr[n - i - 1]}) is now in correct position`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx >= n - i - 1 ? '#22c55e' : c) },
      highlight: { arrayIndices: [n - i - 1] },
      operations: [{ type: 'highlight', elements: [n - i - 1], details: 'Marked as sorted' }],
    });
  }

  // Final state
  steps.push({
    index: stepIndex,
    description: `Sorted array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#22c55e') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Insertion Sort
// ============================================================================

export function generateInsertionSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    index: 0,
    description: `Initial array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;

    steps.push({
      index: stepIndex++,
      description: `Take element ${key} at index ${i} as key`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx === i ? '#f59e0b' : c) },
      highlight: { arrayIndices: [i] },
      operations: [{ type: 'highlight', elements: [i], details: `Key = ${key}` }],
    });

    while (j >= 0 && arr[j] > key) {
      steps.push({
        index: stepIndex++,
        description: `Compare ${arr[j]} with key ${key}`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx === i ? '#f59e0b' : (idx === j ? '#ef4444' : c)) },
        highlight: { arrayIndices: [j, i] },
        operations: [{ type: 'compare', elements: [j, i], details: `Comparing ${arr[j]} > ${key}` }],
      });

      arr[j + 1] = arr[j];
      steps.push({
        index: stepIndex++,
        description: `Shift ${arr[j]} to the right`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx === i ? '#f59e0b' : (idx === j ? '#ef4444' : c)) },
        highlight: { arrayIndices: [j, j + 1] },
        operations: [{ type: 'assign', elements: [j + 1], details: `arr[${j + 1}] = ${arr[j]}` }],
      });

      j--;
    }

    arr[j + 1] = key;
    steps.push({
      index: stepIndex++,
      description: `Insert key ${key} at position ${j + 1}`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx <= i ? '#22c55e' : c) },
      highlight: { arrayIndices: [j + 1] },
      operations: [{ type: 'assign', elements: [j + 1], details: `arr[${j + 1}] = ${key}` }],
    });
  }

  steps.push({
    index: stepIndex,
    description: `Sorted array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#22c55e') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Selection Sort
// ============================================================================

export function generateSelectionSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    index: 0,
    description: `Initial array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push({
      index: stepIndex++,
      description: `Find minimum from index ${i} to ${n - 1}`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx < i ? '#22c55e' : c) },
      highlight: { arrayIndices: [i] },
      operations: [],
    });

    for (let j = i + 1; j < n; j++) {
      steps.push({
        index: stepIndex++,
        description: `Compare ${arr[j]} with current minimum ${arr[minIdx]}`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
          if (idx < i) return '#22c55e';
          if (idx === minIdx) return '#f59e0b';
          if (idx === j) return '#ef4444';
          return c;
        }) },
        highlight: { arrayIndices: [minIdx, j] },
        operations: [{ type: 'compare', elements: [minIdx, j], details: `Comparing ${arr[j]} < ${arr[minIdx]}` }],
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        steps.push({
          index: stepIndex++,
          description: `New minimum found: ${arr[minIdx]} at index ${minIdx}`,
          state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
            if (idx < i) return '#22c55e';
            if (idx === minIdx) return '#f59e0b';
            return c;
          }) },
          highlight: { arrayIndices: [minIdx] },
          operations: [{ type: 'highlight', elements: [minIdx], details: `New min index = ${minIdx}` }],
        });
      }
    }

    if (minIdx !== i) {
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;

      steps.push({
        index: stepIndex++,
        description: `Swap ${arr[minIdx]} and ${arr[i]}`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
          if (idx <= i) return '#22c55e';
          return c;
        }) },
        highlight: { arrayIndices: [i, minIdx] },
        operations: [
          { type: 'swap', elements: [i, minIdx], details: `Swapped ${arr[minIdx]} and ${arr[i]}` },
        ],
      });
    } else {
      steps.push({
        index: stepIndex++,
        description: `Element at index ${i} is already the minimum`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx <= i ? '#22c55e' : c) },
        highlight: { arrayIndices: [i] },
        operations: [],
      });
    }
  }

  steps.push({
    index: stepIndex,
    description: `Sorted array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#22c55e') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Merge Sort
// ============================================================================

interface MergeSortFrame {
  arr: number[];
  left: number;
  right: number;
  mid?: number;
  merged?: boolean;
  tempArr?: number[];
}

export function generateMergeSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    index: 0,
    description: `Initial array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;
  const tempArr = new Array(n);

  function mergeSort(l: number, r: number): void {
    if (l >= r) return;

    const mid = Math.floor((l + r) / 2);

    steps.push({
      index: stepIndex++,
      description: `Split range [${l}, ${r}] at mid=${mid}`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx >= l && idx <= r ? '#f59e0b' : c) },
      highlight: { arrayIndices: Array.from({ length: r - l + 1 }, (_, i) => l + i) },
      operations: [{ type: 'highlight', elements: Array.from({ length: r - l + 1 }, (_, i) => l + i), details: `Split [${l}-${r}]` }],
    });

    mergeSort(l, mid);
    mergeSort(mid + 1, r);

    // Merge
    steps.push({
      index: stepIndex++,
      description: `Merge sorted halves [${l}-${mid}] and [${mid+1}-${r}]`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx >= l && idx <= r ? '#f59e0b' : c) },
      highlight: { arrayIndices: Array.from({ length: r - l + 1 }, (_, i) => l + i) },
      operations: [{ type: 'highlight', elements: Array.from({ length: r - l + 1 }, (_, i) => l + i), details: `Merging` }],
    });

    let i = l, j = mid + 1, k = l;
    while (i <= mid && j <= r) {
      steps.push({
        index: stepIndex++,
        description: `Compare ${arr[i]} and ${arr[j]}`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
          if (idx === i || idx === j) return '#ef4444';
          if (idx >= l && idx <= r) return '#f59e0b';
          return c;
        }) },
        highlight: { arrayIndices: [i, j] },
        operations: [{ type: 'compare', elements: [i, j], details: `Comparing ${arr[i]} <= ${arr[j]}` }],
      });

      if (arr[i] <= arr[j]) {
        tempArr[k++] = arr[i++];
      } else {
        tempArr[k++] = arr[j++];
      }
    }

    while (i <= mid) tempArr[k++] = arr[i++];
    while (j <= r) tempArr[k++] = arr[j++];

    for (let idx = l; idx <= r; idx++) {
      arr[idx] = tempArr[idx];
    }

    steps.push({
      index: stepIndex++,
      description: `Merged: [${arr.slice(l, r + 1).join(', ')}]`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx >= l && idx <= r ? '#22c55e' : (idx < l ? '#22c55e' : c)) },
      highlight: { arrayIndices: Array.from({ length: r - l + 1 }, (_, i) => l + i) },
      operations: [{ type: 'assign', elements: Array.from({ length: r - l + 1 }, (_, i) => l + i), details: `Copied back` }],
    });
  }

  mergeSort(0, n - 1);

  steps.push({
    index: stepIndex,
    description: `Sorted array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#22c55e') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Quick Sort
// ============================================================================

export function generateQuickSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    index: 0,
    description: `Initial array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;

  function quickSort(low: number, high: number): void {
    if (low >= high) return;

    // Partition
    const pivot = arr[high];
    let i = low - 1;

    steps.push({
      index: stepIndex++,
      description: `Partition [${low}-${high}] with pivot ${pivot}`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
        if (idx === high) return '#f59e0b'; // pivot
        if (idx >= low && idx <= high) return '#8b5cf6';
        return c;
      }) },
      highlight: { arrayIndices: [high] },
      operations: [{ type: 'highlight', elements: [high], details: `Pivot = ${pivot}` }],
    });

    for (let j = low; j < high; j++) {
      steps.push({
        index: stepIndex++,
        description: `Compare ${arr[j]} with pivot ${pivot}`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
          if (idx === high) return '#f59e0b';
          if (idx === j) return '#ef4444';
          if (idx >= low && idx <= high) return '#8b5cf6';
          return c;
        }) },
        highlight: { arrayIndices: [j, high] },
        operations: [{ type: 'compare', elements: [j, high], details: `${arr[j]} <= ${pivot}?` }],
      });

      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;

          steps.push({
            index: stepIndex++,
            description: `Swap ${arr[j]} and ${arr[i]} (${arr[j]} <= ${pivot})`,
            state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
              if (idx === high) return '#f59e0b';
              if (idx >= low && idx <= high) return '#8b5cf6';
              return c;
            }) },
            highlight: { arrayIndices: [i, j] },
            operations: [{ type: 'swap', elements: [i, j], details: `Swapped` }],
          });
        }
      }
    }

    // Place pivot
    const pivotPos = i + 1;
    const temp = arr[pivotPos];
    arr[pivotPos] = arr[high];
    arr[high] = temp;

    steps.push({
      index: stepIndex++,
      description: `Place pivot ${pivot} at index ${pivotPos}`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx === pivotPos ? '#22c55e' : (idx < pivotPos && idx >= low ? '#22c55e' : (idx > pivotPos && idx <= high ? '#22c55e' : c))) },
      highlight: { arrayIndices: [pivotPos, high] },
      operations: [{ type: 'swap', elements: [pivotPos, high], details: `Pivot placed` }],
    });

    quickSort(low, pivotPos - 1);
    quickSort(pivotPos + 1, high);
  }

  quickSort(0, n - 1);

  steps.push({
    index: stepIndex,
    description: `Sorted array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#22c55e') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Heap Sort
// ============================================================================

export function generateHeapSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    index: 0,
    description: `Initial array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  steps.push({
    index: stepIndex++,
    description: `Max heap built: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#8b5cf6') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    steps.push({
      index: stepIndex++,
      description: `Extract max ${arr[0]} (swap with ${arr[i]})`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx > i ? '#22c55e' : (idx === 0 || idx === i ? '#ef4444' : '#8b5cf6')) },
      highlight: { arrayIndices: [0, i] },
      operations: [{ type: 'swap', elements: [0, i], details: `Swap root with last` }],
    });

    const temp = arr[0];
    arr[0] = arr[i];
    arr[i] = temp;

    heapify(i, 0);
  }

  steps.push({
    index: stepIndex,
    description: `Sorted array: [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#22c55e') },
    highlight: { arrayIndices: Array.from({ length: n }, (_, i) => i) },
    operations: [],
  });

  function heapify(size: number, root: number): void {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size && arr[left] > arr[largest]) largest = left;
    if (right < size && arr[right] > arr[largest]) largest = right;

    if (largest !== root) {
      const temp = arr[root];
      arr[root] = arr[largest];
      arr[largest] = temp;
      heapify(size, largest);
    }
  }

  return steps;
}

// ============================================================================
// Binary Search
// ============================================================================

export function generateBinarySearchSteps(array: number[], target: number): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array].sort((a, b) => a - b);
  const n = arr.length;

  steps.push({
    index: 0,
    description: `Search for ${target} in sorted array [${arr.join(', ')}]`,
    state: { array: [...arr], arrayColors: Array(n).fill('#6366f1') },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;
  let left = 0, right = n - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      index: stepIndex++,
      description: `Check middle element at index ${mid}: ${arr[mid]}`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
        if (idx < left || idx > right) return '#d4d4d8';
        if (idx === mid) return '#f59e0b';
        return '#8b5cf6';
      }) },
      highlight: { arrayIndices: [mid] },
      operations: [{ type: 'compare', elements: [mid], details: `arr[${mid}] = ${arr[mid]} vs target ${target}` }],
    });

    if (arr[mid] === target) {
      steps.push({
        index: stepIndex++,
        description: `Found ${target} at index ${mid}!`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => idx === mid ? '#22c55e' : (idx < left || idx > right ? '#d4d4d8' : '#8b5cf6')) },
        highlight: { arrayIndices: [mid] },
        operations: [{ type: 'highlight', elements: [mid], details: `Target found!` }],
      });
      break;
    } else if (arr[mid] < target) {
      steps.push({
        index: stepIndex++,
        description: `${arr[mid]} < ${target}, search right half`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
          if (idx < left || idx > right) return '#d4d4d8';
          if (idx === mid) return '#ef4444';
          return '#8b5cf6';
        }) },
        highlight: { arrayIndices: [mid] },
        operations: [{ type: 'highlight', elements: [mid], details: `Move left to ${mid + 1}` }],
      });
      left = mid + 1;
    } else {
      steps.push({
        index: stepIndex++,
        description: `${arr[mid]} > ${target}, search left half`,
        state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => {
          if (idx < left || idx > right) return '#d4d4d8';
          if (idx === mid) return '#ef4444';
          return '#8b5cf6';
        }) },
        highlight: { arrayIndices: [mid] },
        operations: [{ type: 'highlight', elements: [mid], details: `Move right to ${mid - 1}` }],
      });
      right = mid - 1;
    }
  }

  if (left > right) {
    steps.push({
      index: stepIndex,
      description: `${target} not found in array`,
      state: { array: [...arr], arrayColors: Array(n).fill('#6366f1').map((c, idx) => '#ef4444') },
      highlight: { arrayIndices: [] },
      operations: [{ type: 'highlight', elements: [], details: `Not found` }],
    });
  }

  return steps;
}

// ============================================================================
// Visual Configs
// ============================================================================

export const sortingVisualConfig: AlgorithmVisualConfig = {
  array: {
    cellWidth: 50,
    cellHeight: 50,
    spacing: 4,
    fontSize: 14,
    showIndices: true,
    indexPosition: 'bottom',
    colorScheme: 'default',
  },
};

export const searchingVisualConfig: AlgorithmVisualConfig = {
  array: {
    cellWidth: 50,
    cellHeight: 50,
    spacing: 4,
    fontSize: 14,
    showIndices: true,
    indexPosition: 'bottom',
    colorScheme: 'default',
  },
};