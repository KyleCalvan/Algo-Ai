// Visualizations Components - Barrel Export
// Real-Time Visual AI Tutor Components

// Core Visualization Components
export { GraphVisualization, createGraphSpec, applyHierarchicalLayout, applyForceLayout } from './GraphVisualization';
export { ChartVisualization, createChartSpec, createFunctionPlotSpec, createMultiFunctionPlotSpec } from './ChartVisualization';
export { AlgorithmVisualization, createAlgorithmSpec } from './AlgorithmVisualization';
export { MathVisualization, createMathSpec, createQuickPlot } from './MathVisualization';

// Renderer & Utilities
export {
  VisualizationRenderer,
  VisualizationList,
  VisualizationCard,
  TableVisualization,
  DiagramVisualization,
} from './VisualizationRenderer';

// Re-export types for convenience
export type {
  VisualizationBlock,
  VisualizationSpec,
  GraphSpec,
  ChartSpec,
  AlgorithmSpec,
  MathSpec,
  TableSpec,
  DiagramSpec,
  VisualizationControls,
  VisualizationType,
  AlgorithmType,
  GraphNode,
  GraphEdge,
  GraphNodeData,
  ChartDataPoint,
  ChartSeries,
  AlgorithmStep,
  AlgorithmState,
  MathExpression,
  StreamingBlock,
  ParsedVisualizationBlock,
  VisualizationInteraction,
  GraphLayout,
  GraphAlgorithm,
  ChartType,
} from '../../types/visualization';