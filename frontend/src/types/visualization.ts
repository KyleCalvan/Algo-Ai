// Visualization Types for AI Tutor
// These types define the structured communication protocol between AI and UI
//
// CHANGES vs previous version are marked with "// CHANGED:" comments.

import type React from 'react'; // CHANGED: explicit import (React.CSSProperties / ReactNode are used below)

// ============================================================================
// Base Types
// ============================================================================

export interface VisualizationBlock {
  id: string;
  type: VisualizationType;
  // NOTE: the spec is WRAPPED by type, e.g. { type: 'chart', spec: { chart: {...} } }
  // VisualizationRenderer reads spec.chart / spec.graph / spec.math / ...
  spec: VisualizationSpec;
  streaming?: boolean;  // If true, spec arrives incrementally
  title?: string;
  description?: string;
}

export type VisualizationType =
  | 'graph'
  | 'chart'
  | 'algorithm'
  | 'math'
  | 'table'
  | 'diagram';

export interface VisualizationSpec {
  // Graph visualizations (trees, linked lists, graphs, flowcharts)
  graph?: GraphSpec;

  // Chart visualizations (line, bar, scatter, histograms)
  chart?: ChartSpec;

  // Algorithm animations (sorting, searching, tree ops)
  algorithm?: AlgorithmSpec;

  // Mathematical function plots
  math?: MathSpec;

  // Data tables
  table?: TableSpec;

  // Diagram (Mermaid-based)
  diagram?: DiagramSpec;

  // Interactive controls config
  controls?: VisualizationControls;
}

// ============================================================================
// Graph Visualization (React Flow based)
// ============================================================================

export interface GraphSpec {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: GraphLayout;
  directed?: boolean;
  algorithm?: GraphAlgorithm | null;
  startNode?: string;
  // CHANGED: 'LR' lays hierarchical graphs out left-to-right (flow networks)
  direction?: 'TB' | 'LR';
  highlight?: GraphHighlight;
  animation?: AnimationConfig;
  viewport?: ViewportConfig;
  // For interactive exploration
  interactive?: boolean;
  onNodeClick?: 'highlight' | 'expand' | 'inspect' | 'none';
  onEdgeClick?: 'highlight' | 'inspect' | 'none';
}

export type GraphLayout = 'hierarchical' | 'force' | 'circular' | 'dagre' | 'grid' | 'preset';

// Free-form names like 'prims-mst' also work: the graph component infers the layout from keywords
// (prim/kruskal/mst -> force layout, undirected; flow/ford/dinic -> left-to-right; tsp -> circle).
export type GraphAlgorithm = 'bfs' | 'dfs' | 'dijkstra' | 'topological' | 'mst' | 'prim' | 'kruskal' | 'shortest-path' | 'max-flow' | 'tsp' | null;

export interface GraphHighlight {
  nodes: string[];
  edges: string[];
  // Style overrides for highlighted elements
  nodeStyle?: Partial<NodeStyle>;
  edgeStyle?: Partial<EdgeStyle>;
}

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  color: string;
  fontSize: number;
  fontWeight: number;
  padding: { x: number; y: number };
  // CHANGED: sizing props the node component reads
  minWidth?: number;
  maxWidth?: number;
  // For special states
  visited?: boolean;
  current?: boolean;
  start?: boolean;
  target?: boolean;
  error?: boolean;
}

export interface EdgeStyle {
  // CHANGED: `stroke` is the real CSS/SVG property React Flow applies.
  // `strokeColor` is kept (optional, deprecated) so existing specs still type-check,
  // but it has no visual effect on its own.
  stroke?: string;
  /** @deprecated use `stroke` */
  strokeColor?: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated: boolean;
  // For special states
  traversed?: boolean;
  current?: boolean;
  shortestPath?: boolean;
}

export interface GraphNode {
  id: string;
  type?: string;  // For custom node types
  // CHANGED: optional. The graph component auto-lays out nodes that have no
  // (distinct) positions, so AI-emitted graphs don't need to compute coordinates.
  position?: { x: number; y: number };
  data: GraphNodeData;
  style?: Partial<NodeStyle>;
  // For layout algorithms
  parentId?: string;
  extent?: 'parent' | 'none';
  // For animation
  animated?: boolean;
  selected?: boolean;
  draggable?: boolean;
  // For hierarchical layout
  level?: number;
  order?: number;
}

export interface GraphNodeData {
  // CHANGED: optional; the node component falls back to data.key, then the node id
  label?: string;
  // Additional data for specific visualizations
  value?: string | number;
  description?: string;
  // For linked list nodes
  next?: string;
  prev?: string; // CHANGED: used by the list-node renderer
  // For tree nodes
  left?: string;
  right?: string;
  // For graph algorithms
  distance?: number;
  predecessor?: string;
  visited?: boolean;
  inQueue?: boolean;
  // CHANGED: node colouring flags
  current?: boolean;
  start?: boolean;
  target?: boolean;
  error?: boolean;
  highlighted?: boolean;
  // For recursion tree
  callId?: number;
  depth?: number;
  functionName?: string; // CHANGED: presence switches the node to "recursion call" rendering
  returnValue?: any;
  parameters?: Record<string, any>;
  // CHANGED: state flags the node colour/legend read
  active?: boolean;
  returning?: boolean;
  completed?: boolean;
  color?: string;
  // CHANGED: per-node style override read by the node component (from data, not node.style)
  style?: Partial<NodeStyle>;
  // Custom data
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;  // For custom edge types
  label?: string;
  labelBgColor?: string;
  labelStyle?: Partial<EdgeStyle>;
  style?: Partial<EdgeStyle>;
  animated?: boolean;
  // For directed graphs
  markerEnd?: 'arrow' | 'arrowclosed' | 'none';
  // For algorithms. `weight` (MST/shortest path) or `capacity` (+ optional `flow`, shown as flow/capacity)
  // are displayed on the edge automatically unless `label` is set.
  weight?: number;
  capacity?: number;
  flow?: number;
  traversed?: boolean;  // drawn thick green (e.g. edge accepted into the MST)
  highlighted?: boolean;
  current?: boolean;    // drawn amber (edge being considered)
  // For hierarchical layout
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ViewportConfig {
  x: number;
  y: number;
  zoom: number;
  // Fit view to content
  fitView?: boolean;
  fitViewOptions?: { padding: number; includeHiddenNodes: boolean; minZoom: number; maxZoom: number };
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  stagger?: number;
  // For algorithm step animations
  stepDuration?: number;
  // For node/edge appear/disappear
  enterDuration?: number;
  exitDuration?: number;
}

// ============================================================================
// Chart Visualization (Recharts based)
// ============================================================================

export interface ChartSpec {
  type: ChartType;
  data: ChartDataPoint[];
  xKey: string;
  // CHANGED: optional if `series` is given (the chart derives keys from series)
  yKeys?: string[];
  xLabel?: string;
  yLabel?: string;
  series?: ChartSeries[];
  animation?: AnimationConfig;
  // Axis configuration
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  // Tooltip
  tooltip?: TooltipConfig;
  // Legend
  legend?: LegendConfig;
  // Grid
  grid?: GridConfig;
  // Responsive
  responsive?: boolean;
  // For comparison charts
  comparison?: ComparisonConfig;
  // Interactive
  interactive?: boolean;
  onDataPointClick?: 'highlight' | 'inspect' | 'none';
}

// NOTE: 'radar' and 'composed' are not implemented by ChartVisualization yet
// (they currently fall back to a line chart).
export type ChartType = 'line' | 'bar' | 'scatter' | 'area' | 'pie' | 'radar' | 'histogram' | 'composed';

export interface ChartDataPoint {
  [key: string]: string | number | Date | null;
}

export interface ChartSeries {
  key: string;
  name: string;
  type?: ChartType;
  color?: string;
  strokeWidth?: number;
  dot?: boolean | DotConfig;
  activeDot?: DotConfig;
  // For area charts
  fillOpacity?: number;
  // For bar charts
  barSize?: number;
  radius?: number[];
  // For composed charts
  yAxisId?: string;
}

export interface DotConfig {
  r: number;
  strokeWidth: number;
  stroke: string;
  fill: string;
}

export interface AxisConfig {
  type?: 'number' | 'category' | 'time';
  domain?: [number | string | Date, number | string | Date] | 'auto';
  tickCount?: number;
  tickFormatter?: (value: any) => string;
  label?: { value: string; position: 'inside' | 'outside' | 'center' | 'left' | 'right' | 'top' | 'bottom' };
  scale?: 'linear' | 'log' | 'pow' | 'sqrt' | 'identity' | 'time' | 'band' | 'point';
  allowDecimals?: boolean;
  orientation?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TooltipConfig {
  enabled?: boolean;
  formatter?: (value: any, name: string, props: any) => React.ReactNode;
  contentStyle?: React.CSSProperties;
  labelFormatter?: (label: any) => string;
}

export interface LegendConfig {
  enabled?: boolean;
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  iconType?: 'line' | 'square' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
}

export interface GridConfig {
  horizontal?: boolean;
  vertical?: boolean;
  strokeDasharray?: string;
  stroke?: string;
}

export interface ComparisonConfig {
  baselineKey: string;
  comparisonKeys: string[];
  showDifference?: boolean;
  differenceType?: 'absolute' | 'percentage';
}

// ============================================================================
// Algorithm Animation
// ============================================================================

export interface AlgorithmSpec {
  type: AlgorithmType;
  algorithm: string;  // e.g., 'bubble-sort', 'binary-search', 'bst-insert'
  // CHANGED: optional playback fields. The component defaults them
  // (currentStep 0, speed 1, autoPlay false) and only needs `steps`.
  initialState?: AlgorithmState;
  steps: AlgorithmStep[];
  currentStep?: number;
  speed?: number;  // steps per second
  autoPlay?: boolean;
  // Visual configuration
  visualConfig?: AlgorithmVisualConfig;
  // For step-by-step explanation
  explanations?: AlgorithmExplanation[];
}

export type AlgorithmType = 'sorting' | 'searching' | 'tree' | 'graph' | 'recursion' | 'dynamic-programming' | 'custom';

export interface AlgorithmState {
  // Array-based algorithms (sorting, searching)
  array?: (string | number)[];
  arrayColors?: string[];
  // Tree-based algorithms
  tree?: TreeNodeData;
  // Graph-based algorithms
  graph?: { nodes: GraphNode[]; edges: GraphEdge[] };
  // Recursion
  callStack?: CallStackFrame[];
  // Custom state
  [key: string]: any;
}

export interface AlgorithmStep {
  index: number;
  description: string;
  state: AlgorithmState;
  // Highlighted elements
  highlight?: {
    arrayIndices?: number[];
    nodeIds?: string[];
    edgeIds?: string[];
    callStackIndices?: number[];
  };
  // Operations performed
  operations?: AlgorithmOperation[];
  // Metadata
  metadata?: Record<string, any>;
  // For branching algorithms
  branch?: string;
  parentStep?: number;
}

export interface AlgorithmOperation {
  type: 'compare' | 'swap' | 'assign' | 'visit' | 'enqueue' | 'dequeue' | 'push' | 'pop' | 'call' | 'return' | 'highlight' | 'unhighlight';
  elements: (string | number)[];
  details?: string;
}

export interface AlgorithmExplanation {
  stepIndex: number;
  title: string;
  content: string;
  // For code highlighting
  codeLines?: number[];
  // For visual reference
  visualReference?: {
    type: 'array' | 'tree' | 'graph' | 'stack';
    elements: (string | number)[];
  };
}

export interface AlgorithmVisualConfig {
  // Array visualization
  array?: {
    cellWidth: number;
    cellHeight: number;
    spacing: number;
    fontSize: number;
    showIndices: boolean;
    indexPosition: 'top' | 'bottom';
    colorScheme: 'default' | 'viridis' | 'categorical';
  };
  // Tree visualization
  tree?: {
    nodeRadius: number;
    levelSpacing: number;
    siblingSpacing: number;
    showValues: boolean;
    showNulls: boolean;
  };
  // Graph visualization
  graph?: {
    nodeSize: number;
    edgeLength: number;
    showWeights: boolean;
    showDistances: boolean;
  };
  // Recursion tree
  recursion?: {
    nodeWidth: number;
    nodeHeight: number;
    horizontalSpacing: number;
    verticalSpacing: number;
    showReturnValues: boolean;
    showParameters: boolean;
  };
}

export interface TreeNodeData {
  id: string;
  value: string | number;
  left?: TreeNodeData;
  right?: TreeNodeData;
  parent?: string;
  // For visualization
  x?: number;
  y?: number;
  highlighted?: boolean;
  visited?: boolean;
}

export interface CallStackFrame {
  id: number;
  functionName: string;
  parameters: Record<string, any>;
  localVariables?: Record<string, any>;
  returnValue?: any;
  lineNumber?: number;
  isActive?: boolean;
  isReturning?: boolean;
}

// ============================================================================
// Math Visualization (Function Plots)
// ============================================================================

export interface MathSpec {
  expressions: MathExpression[];
  xRange: [number, number];
  yRange?: [number, number];
  // Values for free variables other than x, e.g. { a: 2, b: -1 } for "a*x^2 + b*x".
  // Names used in an expression but missing here default to 1.
  parameters?: Record<string, number>;
  interactive?: boolean;
  // Axis
  xAxis?: MathAxisConfig;
  yAxis?: MathAxisConfig;
  // Grid
  grid?: MathGridConfig;
  // Plot options
  plotOptions?: PlotOptions;
  // Annotations
  annotations?: MathAnnotation[];
}

export interface MathExpression {
  // CHANGED: optional (nothing reads it; AI output usually omits it)
  id?: string;
  expression: string;  // e.g., "x^2", "sin(x)", "a*x^2 + b*x + c"
  label?: string;
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  // CHANGED: createMathSpec() already set these two but the type didn't allow them
  visible?: boolean;
  parameters?: Record<string, number>;
  // For parametric (not yet implemented by MathVisualization)
  parametric?: { x: string; y: string; tRange: [number, number] };
  // For polar (not yet implemented)
  polar?: boolean;
  // Domain restrictions
  domain?: [number, number];
  // Show derivative/integral (not yet implemented)
  showDerivative?: boolean;
  showIntegral?: boolean;
  integralRange?: [number, number];
}

export interface MathAxisConfig {
  label?: string;
  showGrid: boolean;
  ticks?: number;
  tickFormat?: (value: number) => string;
  scale?: 'linear' | 'log';
}

export interface MathGridConfig {
  show: boolean;
  color: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export interface PlotOptions {
  resolution?: number;  // Points per unit
  adaptive?: boolean;   // Adaptive sampling
  showPoints?: boolean;
  pointRadius?: number;
  // For area under curve
  fillArea?: boolean;
  fillColor?: string;
  fillOpacity?: number;
}

export interface MathAnnotation {
  type: 'point' | 'line' | 'region' | 'text';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  label?: string;
  color?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// Table Visualization
// ============================================================================

export interface TableSpec {
  columns: TableColumn[];
  data: TableRow[];
  // Features
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  // Selection
  selectable?: boolean;
  selectionMode?: 'single' | 'multiple';
  // Styling
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  // Column resizing
  resizable?: boolean;
  // Fixed columns
  fixedColumns?: { left: number; right: number };
}

export interface TableColumn {
  key: string;
  header: string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'object';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  // Custom render
  render?: (value: any, row: TableRow) => React.ReactNode;
  // For formatting
  format?: (value: any) => string;
}

export interface TableRow {
  // CHANGED: optional; the table falls back to the row index as the React key
  id?: string | number;
  [key: string]: any;
}

// ============================================================================
// Diagram Visualization (Mermaid-based)
// ============================================================================

export interface DiagramSpec {
  type: DiagramType;
  definition: string;  // Mermaid syntax
  // For interactive diagrams
  interactive?: boolean;
  // Theme
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  // Config
  config?: MermaidConfig;
}

export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'journey'
  | 'gantt'
  | 'pie'
  | 'gitgraph'
  | 'mindmap'
  | 'timeline'
  | 'quadrant';

export interface MermaidConfig {
  flowchart?: { curve?: 'basis' | 'linear' | 'cardinal' | 'monotone'; htmlLabels?: boolean; useMaxWidth?: boolean };
  sequence?: { diagramMarginX?: number; diagramMarginY?: number; actorMargin?: number; width?: number; height?: number; boxMargin?: number; boxTextMargin?: number; noteMargin?: number; messageMargin?: number; };
  class?: { useMaxWidth?: boolean };
  state?: { useMaxWidth?: boolean };
  er?: { useMaxWidth?: boolean };
  journey?: { useMaxWidth?: boolean };
  gantt?: { useMaxWidth?: boolean; numberSectionStyles?: number };
}

// ============================================================================
// Controls Configuration
// ============================================================================

export interface VisualizationControls {
  // Playback controls (for animations)
  playPause?: boolean;
  stepForward?: boolean;
  stepBackward?: boolean;
  reset?: boolean;
  speedControl?: boolean;
  // View controls
  zoom?: boolean;
  pan?: boolean;
  fitView?: boolean;
  fullscreen?: boolean;
  // Graph specific
  layoutToggle?: boolean;
  minimap?: boolean;
  // Chart specific
  legendToggle?: boolean;
  axisToggle?: boolean;
  dataPointInspect?: boolean;
  // Math specific
  parameterSliders?: boolean;
  derivativeToggle?: boolean;
  integralToggle?: boolean;
  // Export
  exportImage?: boolean;
  exportData?: boolean;
  // Custom actions
  customActions?: CustomAction[];
}

export interface CustomAction {
  id: string;
  label: string;
  icon?: string;
  action: 'callback' | 'prompt' | 'navigate';
  payload?: any;
}

// ============================================================================
// Streaming & Parsing
// ============================================================================

export interface StreamingBlock {
  id: string;
  type: VisualizationType;
  // Partial spec - builds up over stream
  partialSpec: Partial<VisualizationSpec>;
  // Whether the block is complete
  complete: boolean;
  // For incremental updates
  delta?: Partial<VisualizationSpec>;
  // Metadata
  timestamp: number;
  sequence: number;
}

// Parsed block ready for rendering
export interface ParsedVisualizationBlock extends VisualizationBlock {
  // Validation status
  valid: boolean;
  validationErrors?: string[];
  // Render key (changes when spec changes significantly)
  renderKey: string;
}

// ============================================================================
// Extended ChatMessage (add to existing types)
// ============================================================================

// This extends the existing ChatMessage from types/index.ts
// We'll merge this in types/index.ts
export interface ChatMessageWithVisualizations {
  visualizations?: VisualizationBlock[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type VisualizationComponentProps = {
  block: VisualizationBlock;
  // For streaming updates
  isStreaming?: boolean;
  streamState?: {
    content: string;
    phase: string;
  };
  // Interaction callbacks
  onInteraction?: (action: VisualizationInteraction) => void;
  // Size constraints
  maxWidth?: number;
  maxHeight?: number;
  // Theme
  theme?: 'light' | 'dark';
};

export interface VisualizationInteraction {
  // CHANGED: the components actually emit the snake_case names below, so the old
  // kebab-case-only union never matched real events. Both styles are accepted.
  type:
    | 'node-click' | 'edge-click' | 'data-point-click' | 'step-change' | 'parameter-change' | 'viewport-change' | 'control-action'
    | 'node_click' | 'node_drag' | 'viewport_change' | 'legend_click' | 'parameter_change' | 'range_change'
    | 'play_pause' | 'sort' | 'row_click';
  // CHANGED: optional - components don't set these; the list wrapper adds blockIndex
  blockId?: string;
  payload?: any;
  timestamp?: number;
  blockIndex?: number;
  [key: string]: any;
}

// ============================================================================
// Algorithm Implementations (for frontend generation)
// ============================================================================

export interface AlgorithmDefinition {
  id: string;
  name: string;
  type: AlgorithmType;
  category: string;
  description: string;
  complexity: {
    time: string;
    space: string;
  };
  // Input schema for generating initial state
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; default?: any }>;
    required: string[];
  };
  // Generate steps from input
  generateSteps: (input: Record<string, any>) => AlgorithmStep[];
  // Default visual config
  defaultVisualConfig?: AlgorithmVisualConfig;
  // Supported visualizations
  supportedVisualizations: ('array' | 'tree' | 'graph' | 'stack')[];
}

// Built-in algorithms registry
export const BUILTIN_ALGORITHMS: Record<string, AlgorithmDefinition> = {};

// Algorithm step generators (implemented in lib/algorithms/)
export interface AlgorithmGenerator {
  (input: Record<string, any>): AlgorithmStep[];
}