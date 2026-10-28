/**
 * Tree Algorithm Visualizations
 * BST operations, traversals, etc.
 */

import type { AlgorithmStep, AlgorithmState, AlgorithmVisualConfig, GraphNode, GraphEdge, TreeNodeData } from '../../types/visualization';

// ============================================================================
// Tree Helpers
// ============================================================================

interface TreeNode {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  parent: TreeNode | null;
  x: number;
  y: number;
  highlighted: boolean;
  visited: boolean;
  isNew: boolean;
}

function createTreeNode(value: number, id: string): TreeNode {
  return {
    id,
    value,
    left: null,
    right: null,
    parent: null,
    x: 0,
    y: 0,
    highlighted: false,
    visited: false,
    isNew: false,
  };
}

function calculatePositions(node: TreeNode | null, depth: number, x: number, spacing: number, positions: Map<string, { x: number; y: number }>): number {
  if (!node) return x;

  const leftEnd = calculatePositions(node.left, depth + 1, x, spacing, positions);
  const currentX = leftEnd + spacing / 2;
  node.x = currentX;
  node.y = depth * 80;
  positions.set(node.id, { x: currentX, y: node.y });
  return calculatePositions(node.right, depth + 1, currentX + spacing / 2, spacing, positions);
}

function treeToGraphNodes(root: TreeNode | null): GraphNode[] {
  const nodes: GraphNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  calculatePositions(root, 0, 200, 100, positions);

  function traverse(node: TreeNode | null) {
    if (!node) return;
    const pos = positions.get(node.id) || { x: node.x, y: node.y };
    nodes.push({
      id: node.id,
      position: pos,
      data: {
        label: String(node.value),
        value: node.value,
        visited: node.visited,
        highlighted: node.highlighted,
        isNew: node.isNew,
      },
      style: {
        backgroundColor: node.isNew ? '#f59e0b' : (node.highlighted ? '#ef4444' : (node.visited ? '#22c55e' : '#6366f1')),
        borderColor: node.isNew ? '#d97706' : (node.highlighted ? '#dc2626' : (node.visited ? '#16a34a' : '#4f46e5')),
        borderWidth: node.highlighted || node.isNew ? 3 : 2,
        borderRadius: 8,
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 600,
        padding: { x: 12, y: 8 },
      },
    });
    traverse(node.left);
    traverse(node.right);
  }
  traverse(root);
  return nodes;
}

function treeToGraphEdges(root: TreeNode | null): GraphEdge[] {
  const edges: GraphEdge[] = [];
  let edgeIndex = 0;

  function traverse(node: TreeNode | null) {
    if (!node) return;
    if (node.left) {
      edges.push({
        id: `edge-${edgeIndex++}`,
        source: node.id,
        target: node.left.id,
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
    if (node.right) {
      edges.push({
        id: `edge-${edgeIndex++}`,
        source: node.id,
        target: node.right.id,
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
    traverse(node.left);
    traverse(node.right);
  }
  traverse(root);
  return edges;
}

function cloneTreeState(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: nodes.map(n => ({ ...n, data: { ...n.data }, style: { ...n.style } })),
    edges: edges.map(e => ({ ...e, style: { ...e.style } })),
  };
}

function findNode(root: TreeNode | null, id: string): TreeNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return findNode(root.left, id) || findNode(root.right, id);
}

// ============================================================================
// BST Insert
// ============================================================================

export interface BSTInsertInput {
  initialValues: number[];
  insertValue: number;
}

export function generateBSTInsertSteps(input: BSTInsertInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { initialValues, insertValue } = input;

  // Build initial tree
  let root: TreeNode | null = null;
  let nodeCounter = 0;

  function insertNode(node: TreeNode | null, value: number, parent: TreeNode | null): TreeNode {
    if (!node) {
      const newNode = createTreeNode(value, `node-${nodeCounter++}`);
      newNode.parent = parent;
      return newNode;
    }
    if (value < node.value) {
      node.left = insertNode(node.left, value, node);
    } else {
      node.right = insertNode(node.right, value, node);
    }
    return node;
  }

  for (const val of initialValues) {
    root = insertNode(root, val, null);
  }

  // Initial state
  let nodes = treeToGraphNodes(root);
  let edges = treeToGraphEdges(root);

  steps.push({
    index: 0,
    description: `Initial BST with values: [${initialValues.join(', ')}]`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [], edgeIds: [] },
    operations: [],
  });

  let stepIndex = 1;
  let current = root;
  let parent: TreeNode | null = null;
  const path: TreeNode[] = [];

  // Find insertion point
  while (current) {
    path.push(current);
    current.highlighted = true;
    nodes = treeToGraphNodes(root);
    edges = treeToGraphEdges(root);

    steps.push({
      index: stepIndex++,
      description: `Compare ${insertValue} with ${current.value}`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id] },
      operations: [{ type: 'compare', elements: [current.id], details: `${insertValue} ${insertValue < current.value ? '<' : '≥'} ${current.value}` }],
    });

    current.highlighted = false;
    parent = current;
    if (insertValue < current.value) {
      current = current.left;
    } else {
      current = current.right;
    }
  }

  // Insert new node
  const newNode = createTreeNode(insertValue, `node-${nodeCounter++}`);
  newNode.isNew = true;
  newNode.parent = parent!;

  if (insertValue < parent!.value) {
    parent!.left = newNode;
  } else {
    parent!.right = newNode;
  }

  nodes = treeToGraphNodes(root);
  edges = treeToGraphEdges(root);

  steps.push({
    index: stepIndex++,
    description: `Insert ${insertValue} as ${insertValue < parent!.value ? 'left' : 'right'} child of ${parent!.value}`,
    state: { graph: cloneTreeState(nodes, edges) },
    highlight: { nodeIds: [newNode.id, parent!.id] },
    operations: [{ type: 'assign', elements: [newNode.id], details: `Create new node with value ${insertValue}` }],
  });

  // Final state - remove highlight
  newNode.isNew = false;
  nodes = treeToGraphNodes(root);
  edges = treeToGraphEdges(root);

  steps.push({
    index: stepIndex,
    description: `BST after insertion: in-order traversal gives sorted order`,
    state: { graph: cloneTreeState(nodes, edges) },
    highlight: { nodeIds: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// BST Search
// ============================================================================

export interface BSTSearchInput {
  initialValues: number[];
  searchValue: number;
}

export function generateBSTSearchSteps(input: BSTSearchInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { initialValues, searchValue } = input;

  let root: TreeNode | null = null;
  let nodeCounter = 0;

  function insertNode(node: TreeNode | null, value: number, parent: TreeNode | null): TreeNode {
    if (!node) {
      const newNode = createTreeNode(value, `node-${nodeCounter++}`);
      newNode.parent = parent;
      return newNode;
    }
    if (value < node.value) {
      node.left = insertNode(node.left, value, node);
    } else {
      node.right = insertNode(node.right, value, node);
    }
    return node;
  }

  for (const val of initialValues) {
    root = insertNode(root, val, null);
  }

  let nodes = treeToGraphNodes(root);
  let edges = treeToGraphEdges(root);

  steps.push({
    index: 0,
    description: `Search for ${searchValue} in BST`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [], edgeIds: [] },
    operations: [],
  });

  let stepIndex = 1;
  let current = root;
  let found = false;

  while (current) {
    current.highlighted = true;
    nodes = treeToGraphNodes(root);
    edges = treeToGraphEdges(root);

    steps.push({
      index: stepIndex++,
      description: `Compare ${searchValue} with ${current.value}`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id] },
      operations: [{ type: 'compare', elements: [current.id], details: `${searchValue} ${searchValue === current.value ? '=' : (searchValue < current.value ? '<' : '>')} ${current.value}` }],
    });

    if (searchValue === current.value) {
      found = true;
      current.visited = true;
      nodes = treeToGraphNodes(root);
      edges = treeToGraphEdges(root);

      steps.push({
        index: stepIndex++,
        description: `Found ${searchValue}!`,
        state: { graph: cloneTreeState(nodes, edges) },
        highlight: { nodeIds: [current.id] },
        operations: [{ type: 'visit', elements: [current.id], details: 'Target found!' }],
      });
      break;
    }

    current.highlighted = false;
    if (searchValue < current.value) {
      current = current.left;
    } else {
      current = current.right;
    }
  }

  if (!found) {
    steps.push({
      index: stepIndex,
      description: `${searchValue} not found in BST`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [] },
      operations: [],
    });
  } else {
    steps.push({
      index: stepIndex,
      description: `Search complete`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [] },
      operations: [],
    });
  }

  return steps;
}

// ============================================================================
// BST Delete
// ============================================================================

export interface BSTDeleteInput {
  initialValues: number[];
  deleteValue: number;
}

export function generateBSTDeleteSteps(input: BSTDeleteInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { initialValues, deleteValue } = input;

  let root: TreeNode | null = null;
  let nodeCounter = 0;

  function insertNode(node: TreeNode | null, value: number, parent: TreeNode | null): TreeNode {
    if (!node) {
      const newNode = createTreeNode(value, `node-${nodeCounter++}`);
      newNode.parent = parent;
      return newNode;
    }
    if (value < node.value) {
      node.left = insertNode(node.left, value, node);
    } else {
      node.right = insertNode(node.right, value, node);
    }
    return node;
  }

  for (const val of initialValues) {
    root = insertNode(root, val, null);
  }

  let nodes = treeToGraphNodes(root);
  let edges = treeToGraphEdges(root);

  steps.push({
    index: 0,
    description: `Initial BST: [${initialValues.join(', ')}]`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [], edgeIds: [] },
    operations: [],
  });

  let stepIndex = 1;
  let current = root;
  let parent: TreeNode | null = null;

  // Find node to delete
  while (current && current.value !== deleteValue) {
    current.highlighted = true;
    nodes = treeToGraphNodes(root);
    edges = treeToGraphEdges(root);

    steps.push({
      index: stepIndex++,
      description: `Compare ${deleteValue} with ${current.value}`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id] },
      operations: [{ type: 'compare', elements: [current.id], details: `${deleteValue} ${deleteValue < current.value ? '<' : '>'} ${current.value}` }],
    });

    current.highlighted = false;
    parent = current;
    if (deleteValue < current.value) {
      current = current.left;
    } else {
      current = current.right;
    }
  }

  if (!current) {
    steps.push({
      index: stepIndex,
      description: `${deleteValue} not found in BST`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [] },
      operations: [],
    });
    return steps;
  }

  // Found node to delete
  current.highlighted = true;
  nodes = treeToGraphNodes(root);
  edges = treeToGraphEdges(root);

  steps.push({
    index: stepIndex++,
    description: `Found node ${deleteValue} to delete`,
    state: { graph: cloneTreeState(nodes, edges) },
    highlight: { nodeIds: [current.id] },
    operations: [{ type: 'visit', elements: [current.id], details: 'Node found for deletion' }],
  });

  // Case 1: No children
  if (!current.left && !current.right) {
    steps.push({
      index: stepIndex++,
      description: `Node has no children, simply remove it`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id, parent?.id || ''].filter(Boolean) },
      operations: [{ type: 'highlight', elements: [current.id], details: 'Remove leaf node' }],
    });

    if (parent) {
      if (parent.left === current) parent.left = null;
      else parent.right = null;
    } else {
      root = null;
    }
  }
  // Case 2: One child
  else if (!current.left || !current.right) {
    const child = current.left || current.right!;
    steps.push({
      index: stepIndex++,
      description: `Node has one child (${child.value}), replace with child`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id, child.id] },
      operations: [{ type: 'assign', elements: [child.id], details: 'Replace with child' }],
    });

    if (parent) {
      if (parent.left === current) parent.left = child;
      else parent.right = child;
    } else {
      root = child;
    }
    child.parent = parent;
  }
  // Case 3: Two children
  else {
    steps.push({
      index: stepIndex++,
      description: `Node has two children, find inorder successor`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id] },
      operations: [],
    });

    // Find inorder successor (leftmost in right subtree)
    let successor = current.right;
    let succParent = current;
    while (successor.left) {
      succParent = successor;
      successor = successor.left;
    }

    successor.highlighted = true;
    nodes = treeToGraphNodes(root);
    edges = treeToGraphEdges(root);

    steps.push({
      index: stepIndex++,
      description: `Inorder successor is ${successor.value}`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id, successor.id] },
      operations: [{ type: 'visit', elements: [successor.id], details: `Successor = ${successor.value}` }],
    });

    // Copy successor value to current
    current.value = successor.value;
    steps.push({
      index: stepIndex++,
      description: `Copy successor value (${successor.value}) to current node`,
      state: { graph: cloneTreeState(nodes, edges) },
      highlight: { nodeIds: [current.id] },
      operations: [{ type: 'assign', elements: [current.id], details: `value = ${successor.value}` }],
    });

    // Delete successor (which has at most one child)
    const succChild = successor.right;
    if (succParent.left === successor) {
      succParent.left = succChild;
    } else {
      succParent.right = succChild;
    }
    if (succChild) succChild.parent = succParent;
  }

  // Final state
  nodes = treeToGraphNodes(root);
  edges = treeToGraphEdges(root);

  steps.push({
    index: stepIndex,
    description: `BST after deletion`,
    state: { graph: cloneTreeState(nodes, edges) },
    highlight: { nodeIds: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Tree Traversals
// ============================================================================

export interface BSTTraversalInput {
  initialValues: number[];
  traversalType: 'inorder' | 'preorder' | 'postorder';
}

export function generateBSTTraversalSteps(input: BSTTraversalInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { initialValues, traversalType } = input;

  let root: TreeNode | null = null;
  let nodeCounter = 0;

  function insertNode(node: TreeNode | null, value: number, parent: TreeNode | null): TreeNode {
    if (!node) {
      const newNode = createTreeNode(value, `node-${nodeCounter++}`);
      newNode.parent = parent;
      return newNode;
    }
    if (value < node.value) {
      node.left = insertNode(node.left, value, node);
    } else {
      node.right = insertNode(node.right, value, node);
    }
    return node;
  }

  for (const val of initialValues) {
    root = insertNode(root, val, null);
  }

  let nodes = treeToGraphNodes(root);
  let edges = treeToGraphEdges(root);

  const traversalNames: Record<string, string> = {
    inorder: 'Inorder (Left, Root, Right)',
    preorder: 'Preorder (Root, Left, Right)',
    postorder: 'Postorder (Left, Right, Root)',
  };

  steps.push({
    index: 0,
    description: `${traversalNames[traversalType]} traversal of BST`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [] },
    operations: [],
  });

  let stepIndex = 1;
  const result: number[] = [];

  function traverse(node: TreeNode | null) {
    if (!node) return;

    if (traversalType === 'preorder') {
      node.visited = true;
      result.push(node.value);
      nodes = treeToGraphNodes(root);
      edges = treeToGraphEdges(root);

      steps.push({
        index: stepIndex++,
        description: `Visit ${node.value} (preorder)`,
        state: { graph: cloneTreeState(nodes, edges) },
        highlight: { nodeIds: [node.id] },
        operations: [{ type: 'visit', elements: [node.id], details: `Output: ${node.value}` }],
      });
    }

    traverse(node.left);

    if (traversalType === 'inorder') {
      node.visited = true;
      result.push(node.value);
      nodes = treeToGraphNodes(root);
      edges = treeToGraphEdges(root);

      steps.push({
        index: stepIndex++,
        description: `Visit ${node.value} (inorder)`,
        state: { graph: cloneTreeState(nodes, edges) },
        highlight: { nodeIds: [node.id] },
        operations: [{ type: 'visit', elements: [node.id], details: `Output: ${node.value}` }],
      });
    }

    traverse(node.right);

    if (traversalType === 'postorder') {
      node.visited = true;
      result.push(node.value);
      nodes = treeToGraphNodes(root);
      edges = treeToGraphEdges(root);

      steps.push({
        index: stepIndex++,
        description: `Visit ${node.value} (postorder)`,
        state: { graph: cloneTreeState(nodes, edges) },
        highlight: { nodeIds: [node.id] },
        operations: [{ type: 'visit', elements: [node.id], details: `Output: ${node.value}` }],
      });
    }
  }

  traverse(root);

  nodes = treeToGraphNodes(root);
  edges = treeToGraphEdges(root);

  steps.push({
    index: stepIndex,
    description: `Traversal complete: [${result.join(', ')}]`,
    state: { graph: cloneTreeState(nodes, edges) },
    highlight: { nodeIds: [] },
    operations: [],
  });

  return steps;
}

// ============================================================================
// Linked List Operations
// ============================================================================

interface ListNode {
  id: string;
  value: number;
  next: ListNode | null;
  x: number;
  y: number;
  highlighted: boolean;
  isNew: boolean;
  visited: boolean;
}

function createListNode(value: number, id: string): ListNode {
  return {
    id,
    value,
    next: null,
    x: 0,
    y: 0,
    highlighted: false,
    isNew: false,
    visited: false,
  };
}

function listToGraphNodes(head: ListNode | null): GraphNode[] {
  const nodes: GraphNode[] = [];
  let current = head;
  let index = 0;
  while (current) {
    current.x = index * 160 + 100;
    current.y = 150;
    nodes.push({
      id: current.id,
      position: { x: current.x, y: current.y },
      data: {
        label: String(current.value),
        value: current.value,
        next: current.next?.id,
        highlighted: current.highlighted,
        isNew: current.isNew,
      },
      style: {
        backgroundColor: current.isNew ? '#f59e0b' : (current.highlighted ? '#ef4444' : '#6366f1'),
        borderColor: current.isNew ? '#d97706' : (current.highlighted ? '#dc2626' : '#4f46e5'),
        borderWidth: current.highlighted || current.isNew ? 3 : 2,
        borderRadius: 8,
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 600,
        padding: { x: 16, y: 12 },
      },
    });
    current = current.next;
    index++;
  }
  return nodes;
}

function listToGraphEdges(head: ListNode | null): GraphEdge[] {
  const edges: GraphEdge[] = [];
  let current = head;
  let edgeIndex = 0;
  while (current && current.next) {
    edges.push({
      id: `edge-${edgeIndex++}`,
      source: current.id,
      target: current.next.id,
      style: {
        strokeColor: '#94a3b8',
        strokeWidth: 3,
        animated: false,
      },
      markerEnd: 'arrowclosed',
      sourceHandle: 'right',
      targetHandle: 'left',
    });
    current = current.next;
  }
  return edges;
}

function cloneListState(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: nodes.map(n => ({ ...n, data: { ...n.data }, style: { ...n.style } })),
    edges: edges.map(e => ({ ...e, style: { ...e.style } })),
  };
}

export interface LinkedListInput {
  initialValues: number[];
  operation: 'insert-head' | 'insert-tail' | 'insert-at' | 'delete-head' | 'delete-tail' | 'delete-value' | 'search' | 'reverse';
  value?: number;
  index?: number;
}

export function generateLinkedListSteps(input: LinkedListInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const { initialValues, operation, value, index } = input;

  // Build initial list
  let head: ListNode | null = null;
  let tail: ListNode | null = null;
  let nodeCounter = 0;

  for (const val of initialValues) {
    const newNode = createListNode(val, `node-${nodeCounter++}`);
    if (!head) {
      head = newNode;
      tail = newNode;
    } else {
      tail!.next = newNode;
      tail = newNode;
    }
  }

  let nodes = listToGraphNodes(head);
  let edges = listToGraphEdges(head);

  steps.push({
    index: 0,
    description: `Initial linked list: [${initialValues.join(' → ')}]`,
    state: { graph: { nodes: [...nodes], edges: [...edges] } },
    highlight: { nodeIds: [], edgeIds: [] },
    operations: [],
  });

  let stepIndex = 1;

  switch (operation) {
    case 'insert-head': {
      const newNode = createListNode(value!, `node-${nodeCounter++}`);
      newNode.isNew = true;
      newNode.next = head;
      head = newNode;

      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);

      steps.push({
        index: stepIndex++,
        description: `Insert ${value} at head`,
        state: { graph: cloneListState(nodes, edges) },
        highlight: { nodeIds: [newNode.id] },
        operations: [{ type: 'assign', elements: [newNode.id], details: `newNode.next = head; head = newNode` }],
      });

      newNode.isNew = false;
      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);
      break;
    }

    case 'insert-tail': {
      const newNode = createListNode(value!, `node-${nodeCounter++}`);
      newNode.isNew = true;
      if (!head) {
        head = newNode;
      } else {
        tail!.next = newNode;
      }
      tail = newNode;

      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);

      steps.push({
        index: stepIndex++,
        description: `Insert ${value} at tail`,
        state: { graph: cloneListState(nodes, edges) },
        highlight: { nodeIds: [newNode.id] },
        operations: [{ type: 'assign', elements: [newNode.id], details: `tail.next = newNode; tail = newNode` }],
      });

      newNode.isNew = false;
      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);
      break;
    }

    case 'insert-at': {
      if (index === undefined) {
        // Fallback to insert-tail if no index provided
        const newNode = createListNode(value!, `node-${nodeCounter++}`);
        newNode.isNew = true;
        if (!head) {
          head = newNode;
        } else {
          tail!.next = newNode;
        }
        tail = newNode;

        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Insert ${value} at tail (no index provided)`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [newNode.id] },
          operations: [{ type: 'assign', elements: [newNode.id], details: `tail.next = newNode; tail = newNode` }],
        });

        newNode.isNew = false;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);
        break;
      }

      if (index === 0) {
        // Same as insert-head
        const newNode = createListNode(value!, `node-${nodeCounter++}`);
        newNode.isNew = true;
        newNode.next = head;
        head = newNode;

        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Insert ${value} at index 0 (head)`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [newNode.id] },
          operations: [],
        });
      } else {
        let current = head;
        let prev: ListNode | null = null;
        let i = 0;
        while (current && i < index) {
          current.highlighted = true;
          nodes = listToGraphNodes(head);
          edges = listToGraphEdges(head);

          steps.push({
            index: stepIndex++,
            description: `Traverse to index ${i}: ${current.value}`,
            state: { graph: cloneListState(nodes, edges) },
            highlight: { nodeIds: [current.id] },
            operations: [{ type: 'visit', elements: [current.id], details: `Move to next` }],
          });

          current.highlighted = false;
          prev = current;
          current = current.next;
          i++;
        }

        const newNode = createListNode(value!, `node-${nodeCounter++}`);
        newNode.isNew = true;
        newNode.next = current;
        if (prev) prev.next = newNode;
        else head = newNode;
        if (!current) tail = newNode;

        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Insert ${value} at index ${index}`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [newNode.id, prev?.id || ''].filter(Boolean) },
          operations: [{ type: 'assign', elements: [newNode.id], details: `newNode.next = current; prev.next = newNode` }],
        });

        newNode.isNew = false;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);
      }
      break;
    }

    case 'delete-head': {
      if (!head) break;
      const oldHead = head;
      oldHead.highlighted = true;
      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);

      steps.push({
        index: stepIndex++,
        description: `Delete head node (${oldHead.value})`,
        state: { graph: cloneListState(nodes, edges) },
        highlight: { nodeIds: [oldHead.id] },
        operations: [{ type: 'highlight', elements: [oldHead.id], details: 'Remove head' }],
      });

      head = head.next;
      if (!head) tail = null;

      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);
      break;
    }

    case 'delete-tail': {
      if (!head) break;
      if (!head.next) {
        // Single node
        head.highlighted = true;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Delete only node (${head.value})`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [head.id] },
          operations: [],
        });
        head = null;
        tail = null;
      } else {
        let current = head;
        let prev: ListNode | null = null;
        while (current.next) {
          current.highlighted = true;
          nodes = listToGraphNodes(head);
          edges = listToGraphEdges(head);

          steps.push({
            index: stepIndex++,
            description: `Traverse to find tail`,
            state: { graph: cloneListState(nodes, edges) },
            highlight: { nodeIds: [current.id] },
            operations: [{ type: 'visit', elements: [current.id], details: 'Move to next' }],
          });

          current.highlighted = false;
          prev = current;
          current = current.next;
        }

        current.highlighted = true;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Delete tail node (${current.value})`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [current.id, prev!.id] },
          operations: [{ type: 'highlight', elements: [current.id], details: 'prev.next = null' }],
        });

        prev!.next = null;
        tail = prev;
      }
      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);
      break;
    }

    case 'delete-value': {
      let current = head;
      let prev: ListNode | null = null;
      while (current) {
        current.highlighted = true;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Check ${current.value} == ${value}?`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [current.id] },
          operations: [{ type: 'compare', elements: [current.id], details: `${current.value} === ${value}` }],
        });

        if (current.value === value) {
          if (prev) {
            prev.next = current.next;
            if (!current.next) tail = prev;
          } else {
            head = current.next;
            if (!head) tail = null;
          }

          current.highlighted = true;
          nodes = listToGraphNodes(head);
          edges = listToGraphEdges(head);

          steps.push({
            index: stepIndex++,
            description: `Delete node with value ${value}`,
            state: { graph: cloneListState(nodes, edges) },
            highlight: { nodeIds: [current.id, prev?.id || ''].filter(Boolean) },
            operations: [{ type: 'highlight', elements: [current.id], details: 'Remove node' }],
          });
          break;
        }

        current.highlighted = false;
        prev = current;
        current = current.next;
      }
      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);
      break;
    }

    case 'search': {
      let current = head;
      let i = 0;
      let found = false;
      while (current) {
        current.highlighted = true;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Check index ${i}: ${current.value} == ${value}?`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [current.id] },
          operations: [{ type: 'compare', elements: [current.id], details: `${current.value} === ${value}` }],
        });

        if (current.value === value) {
          found = true;
          current.visited = true;
          nodes = listToGraphNodes(head);
          edges = listToGraphEdges(head);

          steps.push({
            index: stepIndex++,
            description: `Found ${value} at index ${i}!`,
            state: { graph: cloneListState(nodes, edges) },
            highlight: { nodeIds: [current.id] },
            operations: [{ type: 'visit', elements: [current.id], details: `Found at index ${i}` }],
          });
          break;
        }

        current.highlighted = false;
        current = current.next;
        i++;
      }

      if (!found) {
        steps.push({
          index: stepIndex,
          description: `${value} not found in list`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [] },
          operations: [],
        });
        return steps;
      }
      break;
    }

    case 'reverse': {
      let prev: ListNode | null = null;
      let current = head;
      let next: ListNode | null = null;

      while (current) {
        current.highlighted = true;
        nodes = listToGraphNodes(head);
        edges = listToGraphEdges(head);

        steps.push({
          index: stepIndex++,
          description: `Reverse pointer at ${current.value}`,
          state: { graph: cloneListState(nodes, edges) },
          highlight: { nodeIds: [current.id, prev?.id || ''].filter(Boolean) },
          operations: [{ type: 'assign', elements: [current.id], details: `next = current.next; current.next = prev; prev = current; current = next` }],
        });

        next = current.next;
        current.next = prev;
        prev = current;
        current = next;
      }

      head = prev;
      nodes = listToGraphNodes(head);
      edges = listToGraphEdges(head);

      steps.push({
        index: stepIndex++,
        description: `List reversed`,
        state: { graph: cloneListState(nodes, edges) },
        highlight: { nodeIds: [] },
        operations: [],
      });
      break;
    }
  }

  steps.push({
    index: stepIndex,
    description: `Final list: [${getListValues(head).join(' → ')}]`,
    state: { graph: cloneListState(nodes, edges) },
    highlight: { nodeIds: [] },
    operations: [],
  });

  return steps;
}

function getListValues(head: ListNode | null): number[] {
  const values: number[] = [];
  let current = head;
  while (current) {
    values.push(current.value);
    current = current.next;
  }
  return values;
}

// ============================================================================
// Visual Configs
// ============================================================================

export const treeVisualConfig: AlgorithmVisualConfig = {
  tree: {
    nodeRadius: 24,
    levelSpacing: 80,
    siblingSpacing: 100,
    showValues: true,
    showNulls: false,
  },
};

export const linkedListVisualConfig: AlgorithmVisualConfig = {
  array: {
    cellWidth: 80,
    cellHeight: 50,
    spacing: 4,
    fontSize: 14,
    showIndices: false,
    indexPosition: 'bottom',
    colorScheme: 'default',
  },
};