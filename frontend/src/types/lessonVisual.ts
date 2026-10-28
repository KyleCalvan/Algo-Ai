export interface ChartPoint { [key: string]: number | string; }

export interface LessonVisualSpec {
  type: 'svg' | 'bar' | 'line' | 'area' | 'pie' | 'table' | 'process' | 'diagram';
  title: string;
  description: string;
  svg?: string;
  data?: ChartPoint[];
  xKey?: string;
  yKey?: string;
  series?: { key: string; color: string; name?: string }[];
  colors?: string[];
  headers?: string[];
  rows?: (string | number)[][];
  steps?: string[];
  xLabel?: string;
  yLabel?: string;
  yScale?: 'linear' | 'log';
  nodes?: { id: string; label: string; x: number; y: number; highlight?: boolean }[];
  edges?: { from: string; to: string; label?: string; highlight?: boolean }[];
  directed?: boolean;
  diagramHeight?: number;
}
