/**
 * Recursion Visualizations
 * Recursion trees, call stacks, etc.
 */

import type { AlgorithmStep, AlgorithmState, AlgorithmVisualConfig, GraphNode, GraphEdge, CallStackFrame } from '../../types/visualization';

// ============================================================================
// Recursion Helpers
// ============================================================================

interface RecursionCall {
  id: number;
  functionName: string;
  parameters: Record<string, any>;
  depth: number;
  startTime: number;
  endTime?: number;
  returnValue?: any;
  children: RecursionCall[];
  parentId: number | null;
  completed: boolean;
  returning: boolean;
}

let callIdCounter = 0;

function resetCallIdCounter() {
  callIdCounter = 0;
}

function createCall(functionName: string, parameters: Record<string, any>, depth: number, parentId: number | null): RecursionCall {
  return {
    id: callIdCounter++,
    functionName,
    parameters,
    depth,
    startTime: Date.now(),
    children: [],
    parentId,
    completed: false,
    returning: false,
  };
}

function callsToGraphNodes(calls: RecursionCall[]): GraphNode[] {
  const nodes: GraphNode[] = [];
  const positions = new Map<number, { x: number; y: number }>();

  function layout(call: RecursionCall, depth: number, x: number): number {
    if (call.children.length === 0) {
      positions.set(call.id, { x, y: depth * 100 });
      return x + 120;
    }

    let currentX = x;
    for (const child of call.children) {
      currentX = layout(child, depth + 1, currentX);
    }
    const centerX = (positions.get(call.children[0].id)!.x + positions.get(call.children[call.children.length - 1].id)!.x) / 2;
    positions.set(call.id, { x: centerX, y: depth * 100 });
    return currentX;
  }

  // Find roots (calls with no parent)
  const roots = calls.filter(c => c.parentId === null);
  let currentX = 100;
  for (const root of roots) {
    currentX = layout(root, 0, currentX);
  }

  for (const call of calls) {
    const pos = positions.get(call.id) || { x: 0, y: 0 };
    const isActive = !call.completed && !call.returning;
    const isReturning = call.returning;
    const isCompleted = call.completed;

    nodes.push({
      id: `call-${call.id}`,
      position: pos,
      data: {
        label: `${call.functionName}(${Object.entries(call.parameters).map(([k, v]) => `${k}=${v}`).join(', ')})`,
        functionName: call.functionName,
        parameters: call.parameters,
        returnValue: call.returnValue,
        depth: call.depth,
        callId: call.id,
        completed: isCompleted,
        returning: isReturning,
        active: isActive,
      },
      style: {
        backgroundColor: isReturning ? '#f59e0b' : (isActive ? '#ef4444' : (isCompleted ? '#22c55e' : '#6366f1')),
        borderColor: isReturning ? '#d97706' : (isActive ? '#dc2626' : (isCompleted ? '#16a34a' : '#4f46e5')),
        borderWidth: isActive || isReturning ? 3 : 2,
        borderRadius: 8,
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 600,
        padding: { x: 10, y: 8 },
      },
    });
  }

  return nodes;
}

function callsToGraphEdges(calls: RecursionCall[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  let edgeIndex = 0;

  for (const call of calls) {
    for (const child of call.children) {
      edges.push({
        id: `edge-${edgeIndex++}`,
        source: `call-${call.id}`,
        target: `call-${child.id}`,
        style: {
          strokeColor: '#94a3b8',
          strokeWidth: 2,
          animated: false,
        },
        markerEnd: 'arrowclosed',
        sourceHandle: 'bottom',
        targetHandle: 'top',
      });
    }
  }
  return edges;
}

function cloneRecursionState(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: nodes.map(n => ({ ...n, data: { ...n.data }, style: { ...n.style } })),
    edges: edges.map(e => ({ ...e, style: { ...e.style } })),
  };
}

function getAllCalls(rootCalls: RecursionCall[]): RecursionCall[] {
  const all: RecursionCall[] = [];
  function collect(call: RecursionCall) {
    all.push(call);
    for (const child of call.children) collect(child);
  }
  for (const root of rootCalls) collect(root);
  return all;
}

function findCallById(calls: RecursionCall[], id: number): RecursionCall | null {
  for (const call of calls) {
    if (call.id === id) return call;
    const found = findCallById(call.children, id);
    if (found) return found;
  }
  return null;
}

function buildCallStack(calls: RecursionCall[]): CallStackFrame[] {
  const stack: CallStackFrame[] = [];

  function addToStack(call: RecursionCall) {
    if (!call.completed) {
      stack.push({
        id: call.id,
        functionName: call.functionName,
        parameters: call.parameters,
        returnValue: call.returnValue,
        isActive: !call.returning && !call.completed,
        isReturning: call.returning,
      });
    }
    for (const child of call.children) {
      addToStack(child);
    }
  }

  for (const root of calls) addToStack(root);
  return stack;
}

// ============================================================================
// Factorial
// ============================================================================

export interface FactorialInput {
  n: number;
}

export function generateFactorialSteps(input: FactorialInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { n } = input;

  const rootCalls: RecursionCall[] = [];
  let stepIndex = 0;

  steps.push({
    index: stepIndex++,
    description: `Compute factorial(${n})`,
    state: { graph: { nodes: [], edges: [] }, callStack: [] },
    highlight: { nodeIds: [], edgeIds: [], callStackIndices: [] },
    operations: [],
  });

  function factorial(n: number, parentId: number | null, depth: number): { call: RecursionCall; returnValue: number; nextStepIndex: number } {
    const call = createCall('factorial', { n }, depth, parentId);

    if (parentId !== null) {
      const parent = findCallById(rootCalls, parentId);
      if (parent) parent.children.push(call);
    } else {
      rootCalls.push(call);
    }

    // Entering function
    let allCalls = getAllCalls(rootCalls);
    let nodes = callsToGraphNodes(allCalls);
    let edges = callsToGraphEdges(allCalls);

    steps.push({
      index: stepIndex++,
      description: `Enter factorial(${n})`,
      state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
      highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
      operations: [{ type: 'call', elements: [call.id], details: `factorial(${n}) called` }],
    });

    let returnValue: number;

    if (n <= 1) {
      // Base case
      call.returnValue = 1;
      call.completed = true;

      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `Base case: factorial(${n}) = 1`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'return', elements: [call.id], details: `Return 1` }],
      });
      returnValue = 1;
    } else {
      // Recursive case
      const childResult = factorial(n - 1, call.id, depth + 1);
      stepIndex = childResult.nextStepIndex;

      // After child returns
      call.returning = true;
      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `factorial(${n - 1}) returned ${childResult.returnValue}, computing ${n} * ${childResult.returnValue}`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'highlight', elements: [call.id], details: `Multiply ${n} * ${childResult.returnValue}` }],
      });

      call.returnValue = n * childResult.returnValue;
      call.completed = true;
      call.returning = false;

      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `Return ${call.returnValue} from factorial(${n})`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'return', elements: [call.id], details: `Return ${call.returnValue}` }],
      });
      returnValue = call.returnValue;
    }

    return { call, returnValue, nextStepIndex: stepIndex };
  }

  resetCallIdCounter();
  const result = factorial(n, null, 0);

  // Final state
  const allCalls = getAllCalls(rootCalls);
  let nodes = callsToGraphNodes(allCalls);
  let edges = callsToGraphEdges(allCalls);

  steps.push({
    index: stepIndex,
    description: `factorial(${n}) = ${result.returnValue}`,
    state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
    highlight: { nodeIds: [], callStackIndices: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Fibonacci
// ============================================================================

export interface FibonacciInput {
  n: number;
}

export function generateFibonacciSteps(input: FibonacciInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { n } = input;

  const rootCalls: RecursionCall[] = [];
  let stepIndex = 0;

  steps.push({
    index: stepIndex++,
    description: `Compute fibonacci(${n})`,
    state: { graph: { nodes: [], edges: [] }, callStack: [] },
    highlight: { nodeIds: [], edgeIds: [], callStackIndices: [] },
    operations: [],
  });

  function fibonacci(n: number, parentId: number | null, depth: number): { call: RecursionCall; returnValue: number; nextStepIndex: number } {
    const call = createCall('fibonacci', { n }, depth, parentId);

    if (parentId !== null) {
      const parent = findCallById(rootCalls, parentId);
      if (parent) parent.children.push(call);
    } else {
      rootCalls.push(call);
    }

    // Entering
    let allCalls = getAllCalls(rootCalls);
    let nodes = callsToGraphNodes(allCalls);
    let edges = callsToGraphEdges(allCalls);

    steps.push({
      index: stepIndex++,
      description: `Enter fibonacci(${n})`,
      state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
      highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
      operations: [{ type: 'call', elements: [call.id], details: `fibonacci(${n})` }],
    });

    let returnValue: number;
    if (n <= 1) {
      call.returnValue = n;
      call.completed = true;

      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `Base case: fibonacci(${n}) = ${n}`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'return', elements: [call.id], details: `Return ${n}` }],
      });
      returnValue = n;
    } else {
      // First recursive call
      const leftResult = fibonacci(n - 1, call.id, depth + 1);
      stepIndex = leftResult.nextStepIndex;

      // Second recursive call
      const rightResult = fibonacci(n - 2, call.id, depth + 1);
      stepIndex = rightResult.nextStepIndex;

      // Combine
      call.returning = true;
      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `fib(${n-1})=${leftResult.returnValue}, fib(${n-2})=${rightResult.returnValue}, sum = ${leftResult.returnValue + rightResult.returnValue}`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'highlight', elements: [call.id], details: `Add ${leftResult.returnValue} + ${rightResult.returnValue}` }],
      });

      call.returnValue = leftResult.returnValue + rightResult.returnValue;
      call.completed = true;
      call.returning = false;

      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `Return ${call.returnValue} from fibonacci(${n})`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'return', elements: [call.id], details: `Return ${call.returnValue}` }],
      });
      returnValue = call.returnValue;
    }

    return { call, returnValue, nextStepIndex: stepIndex };
  }

  resetCallIdCounter();
  const result = fibonacci(n, null, 0);

  // Final
  const allCalls = getAllCalls(rootCalls);
  let nodes = callsToGraphNodes(allCalls);
  let edges = callsToGraphEdges(allCalls);

  steps.push({
    index: stepIndex,
    description: `fibonacci(${n}) = ${result.returnValue}`,
    state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
    highlight: { nodeIds: [], callStackIndices: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Recursive Binary Search
// ============================================================================

export interface RecursiveBinarySearchInput {
  array: number[];
  target: number;
}

export function generateRecursiveBinarySearchSteps(input: RecursiveBinarySearchInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { array: initialArray, target } = input;
  const array = [...initialArray].sort((a, b) => a - b);

  const rootCalls: RecursionCall[] = [];
  let stepIndex = 0;

  steps.push({
    index: stepIndex++,
    description: `Binary search for ${target} in [${array.join(', ')}]`,
    state: { graph: { nodes: [], edges: [] }, callStack: [] },
    highlight: { nodeIds: [], callStackIndices: [] },
    operations: [],
  });

  function binarySearch(left: number, right: number, parentId: number | null, depth: number): { call: RecursionCall; returnValue: number; nextStepIndex: number } {
    const call = createCall('binarySearch', { left, right, target }, depth, parentId);

    if (parentId !== null) {
      const parent = findCallById(rootCalls, parentId);
      if (parent) parent.children.push(call);
    } else {
      rootCalls.push(call);
    }

    let allCalls = getAllCalls(rootCalls);
    let nodes = callsToGraphNodes(allCalls);
    let edges = callsToGraphEdges(allCalls);

    steps.push({
      index: stepIndex++,
      description: `Search range [${left}, ${right}]`,
      state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
      highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
      operations: [{ type: 'call', elements: [call.id], details: `binarySearch(${left}, ${right})` }],
    });

    let returnValue: number;
    if (left > right) {
      call.returnValue = -1;
      call.completed = true;

      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `Base case: left > right, not found`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'return', elements: [call.id], details: `Return -1 (not found)` }],
      });
      returnValue = -1;
    } else {
      const mid = Math.floor((left + right) / 2);
      call.parameters = { left, right, target, mid, midValue: array[mid] };

      allCalls = getAllCalls(rootCalls);
      nodes = callsToGraphNodes(allCalls);
      edges = callsToGraphEdges(allCalls);

      steps.push({
        index: stepIndex++,
        description: `Check middle: arr[${mid}] = ${array[mid]}`,
        state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
        highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
        operations: [{ type: 'compare', elements: [call.id], details: `arr[${mid}] = ${array[mid]} vs target ${target}` }],
      });

      if (array[mid] === target) {
        call.returnValue = mid;
        call.completed = true;

        allCalls = getAllCalls(rootCalls);
        nodes = callsToGraphNodes(allCalls);
        edges = callsToGraphEdges(allCalls);

        steps.push({
          index: stepIndex++,
          description: `Found at index ${mid}!`,
          state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
          highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
          operations: [{ type: 'return', elements: [call.id], details: `Return ${mid}` }],
        });
        returnValue = mid;
      } else if (array[mid] < target) {
        const childResult = binarySearch(mid + 1, right, call.id, depth + 1);
        stepIndex = childResult.nextStepIndex;
        call.returnValue = childResult.returnValue;
        call.completed = true;

        allCalls = getAllCalls(rootCalls);
        nodes = callsToGraphNodes(allCalls);
        edges = callsToGraphEdges(allCalls);

        steps.push({
          index: stepIndex++,
          description: `${array[mid]} < ${target}, search right half`,
          state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
          highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
          operations: [{ type: 'return', elements: [call.id], details: `Return ${childResult.returnValue}` }],
        });
        returnValue = childResult.returnValue;
      } else {
        const childResult = binarySearch(left, mid - 1, call.id, depth + 1);
        stepIndex = childResult.nextStepIndex;
        call.returnValue = childResult.returnValue;
        call.completed = true;

        allCalls = getAllCalls(rootCalls);
        nodes = callsToGraphNodes(allCalls);
        edges = callsToGraphEdges(allCalls);

        steps.push({
          index: stepIndex++,
          description: `${array[mid]} > ${target}, search left half`,
          state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
          highlight: { nodeIds: [`call-${call.id}`], callStackIndices: [0] },
          operations: [{ type: 'return', elements: [call.id], details: `Return ${childResult.returnValue}` }],
        });
        returnValue = childResult.returnValue;
      }
    }

    return { call, returnValue, nextStepIndex: stepIndex };
  }

  resetCallIdCounter();
  const result = binarySearch(0, array.length - 1, null, 0);

  const allCalls = getAllCalls(rootCalls);
  let nodes = callsToGraphNodes(allCalls);
  let edges = callsToGraphEdges(allCalls);

  steps.push({
    index: stepIndex,
    description: result.returnValue >= 0 ? `Found at index ${result.returnValue}` : `Not found`,
    state: { graph: cloneRecursionState(nodes, edges), callStack: buildCallStack(allCalls) },
    highlight: { nodeIds: [], callStackIndices: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Tower of Hanoi
// ============================================================================

export interface HanoiInput {
  disks: number;
}

export function generateHanoiSteps(input: HanoiInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { disks } = input;

  // Represent pegs as arrays
  const pegs: number[][] = [
    Array.from({ length: disks }, (_, i) => disks - i), // Source peg (largest at bottom)
    [], // Auxiliary
    [], // Target
  ];

  const pegNames = ['A (Source)', 'B (Auxiliary)', 'C (Target)'];

  steps.push({
    index: 0,
    description: `Tower of Hanoi with ${disks} disks`,
    state: { pegs: pegs.map(p => [...p]) },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  let stepIndex = 1;

  function hanoi(n: number, from: number, to: number, aux: number): void {
    if (n === 1) {
      const disk = pegs[from].pop()!;
      pegs[to].push(disk);

      steps.push({
        index: stepIndex++,
        description: `Move disk ${disk} from ${pegNames[from]} to ${pegNames[to]}`,
        state: { pegs: pegs.map(p => [...p]) },
        highlight: { arrayIndices: [disk] },
        operations: [{ type: 'assign', elements: [disk], details: `Move disk ${disk}: ${pegNames[from]} → ${pegNames[to]}` }],
      });
      return;
    }

    hanoi(n - 1, from, aux, to);

    const disk = pegs[from].pop()!;
    pegs[to].push(disk);

    steps.push({
      index: stepIndex++,
      description: `Move disk ${disk} from ${pegNames[from]} to ${pegNames[to]}`,
      state: { pegs: pegs.map(p => [...p]) },
      highlight: { arrayIndices: [disk] },
      operations: [{ type: 'assign', elements: [disk], details: `Move disk ${disk}: ${pegNames[from]} → ${pegNames[to]}` }],
    });

    hanoi(n - 1, aux, to, from);
  }

  hanoi(disks, 0, 2, 1);

  steps.push({
    index: stepIndex,
    description: `Complete! All ${disks} disks moved from A to C in ${Math.pow(2, disks) - 1} moves`,
    state: { pegs: pegs.map(p => [...p]) },
    highlight: { arrayIndices: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Visual Configs
// ============================================================================

export const recursionVisualConfig: AlgorithmVisualConfig = {
  recursion: {
    nodeWidth: 200,
    nodeHeight: 60,
    horizontalSpacing: 40,
    verticalSpacing: 100,
    showReturnValues: true,
    showParameters: true,
  },
};