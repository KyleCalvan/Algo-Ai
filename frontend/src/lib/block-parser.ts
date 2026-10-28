/**
 * Streaming Block Parser
 * Parses SSE stream chunks into structured visualization blocks
 * Handles incremental JSON parsing for visualization specs
 */

import type {
  VisualizationBlock,
  VisualizationSpec,
  StreamingBlock,
  ParsedVisualizationBlock,
  VisualizationType,
} from '../types/visualization';

// Special markers for visualization blocks in the stream
const VIZ_START_MARKER = '[VIZ_BLOCK_START]';
const VIZ_END_MARKER = '[VIZ_BLOCK_END]';
const VIZ_DELTA_MARKER = '[VIZ_BLOCK_DELTA]';

// Buffer for incomplete JSON
interface BlockBuffer {
  id: string;
  type: VisualizationType;
  buffer: string;
  complete: boolean;
  spec: Partial<VisualizationSpec>;
  sequence: number;
  timestamp: number;
}

export interface ParseResult {
  text: string;           // Regular text content
  blocks: StreamingBlock[];  // Visualization blocks (may be partial)
  completeBlocks: ParsedVisualizationBlock[];  // Fully parsed, validated blocks
}

/**
 * Parse SSE event data for visualization blocks
 * Returns text content and any visualization blocks found
 */
export function parseSSEDataForBlocks(data: string, existingBuffers: Map<string, BlockBuffer> = new Map()): ParseResult {
  const result: ParseResult = {
    text: '',
    blocks: [],
    completeBlocks: [],
  };

  // Split by lines to process each line
  const lines = data.split('\n');
  let currentText = '';

  for (const line of lines) {
    // Check for visualization block markers
    if (line.includes(VIZ_START_MARKER)) {
      // Extract block ID and type
      const match = line.match(new RegExp(`${VIZ_START_MARKER}\\s+(\\w+)\\s+(\\w+)`));
      if (match) {
        const [, blockId, blockType] = match;
        if (isValidVisualizationType(blockType)) {
          const buffer: BlockBuffer = {
            id: blockId,
            type: blockType,
            buffer: '',
            complete: false,
            spec: {},
            sequence: Date.now(),
            timestamp: Date.now(),
          };
          existingBuffers.set(blockId, buffer);
        }
      }
      // Don't include marker in text output
      continue;
    }

    if (line.includes(VIZ_DELTA_MARKER)) {
      // Delta update for existing block
      const match = line.match(new RegExp(`${VIZ_DELTA_MARKER}\\s+(\\w+)\\s+(.+)`));
      if (match) {
        const [, blockId, deltaJson] = match;
        const buffer = existingBuffers.get(blockId);
        if (buffer) {
          try {
            const delta = JSON.parse(deltaJson);
            buffer.spec = deepMerge(buffer.spec, delta);
            buffer.timestamp = Date.now();
            result.blocks.push({
              id: blockId,
              type: buffer.type,
              partialSpec: { ...buffer.spec },
              complete: false,
              delta,
              timestamp: buffer.timestamp,
              sequence: buffer.sequence,
            });
          } catch {
            // Invalid delta JSON, ignore
          }
        }
      }
      continue;
    }

    if (line.includes(VIZ_END_MARKER)) {
      // Block complete
      const match = line.match(new RegExp(`${VIZ_END_MARKER}\\s+(\\w+)`));
      if (match) {
        const [, blockId] = match;
        const buffer = existingBuffers.get(blockId);
        if (buffer) {
          buffer.complete = true;
          // Parse final spec
          try {
            const spec = JSON.parse(buffer.buffer) as VisualizationSpec;
            buffer.spec = spec;
            const parsedBlock = validateAndCreateBlock(buffer);
            result.completeBlocks.push(parsedBlock);
            result.blocks.push({
              id: blockId,
              type: buffer.type,
              partialSpec: spec,
              complete: true,
              timestamp: buffer.timestamp,
              sequence: buffer.sequence,
            });
          } catch (e) {
            // Invalid final JSON, create block with partial spec
            const parsedBlock = validateAndCreateBlock(buffer);
            result.completeBlocks.push(parsedBlock);
            result.blocks.push({
              id: blockId,
              type: buffer.type,
              partialSpec: buffer.spec,
              complete: true,
              timestamp: buffer.timestamp,
              sequence: buffer.sequence,
            });
          }
          existingBuffers.delete(blockId);
        }
      }
      continue;
    }

    // Check if we're inside a visualization block (accumulating JSON)
    let inBlock = false;
    for (const buffer of existingBuffers.values()) {
      if (!buffer.complete) {
        // This line belongs to the block's JSON
        buffer.buffer += line + '\n';
        inBlock = true;
        break;
      }
    }

    if (!inBlock) {
      currentText += line + '\n';
    }
  }

  result.text = currentText.trimEnd();
  return result;
}

// ============================================================================
// Fence + brace-matching extraction (robust to nested JSON, AI repair)
// ============================================================================

/**
 * Extract the full top-level JSON object starting at `start` (which must be
 * the index of the first `{`). String-aware brace matching — unlike a lazy
 * regex, this correctly handles arbitrarily nested objects and braces inside
 * string values. Returns null when the object is not closed (incomplete
 * stream).
 */
function extractJsonObject(text: string, start: number): { json: string; end: number } | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return { json: text.slice(start, i + 1), end: i + 1 };
    }
  }
  return null;
}

/** JSON.parse with light AI-output repairs (trailing commas, single quotes). */
function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through to repairs */
  }
  try {
    const repaired = raw.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired);
  } catch {
    /* fall through */
  }
  try {
    const repaired = raw
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

// Fences the model may use to wrap a visualization block.
const VIZ_FENCE_RE = /```(?:viz|viz-block|json)[^\n]*\n/gi;

/**
 * Normalize a parsed block object into a VisualizationBlock, tolerating AI
 * output that puts the type payload directly on the block (no nested
 * `spec.<type>` key) and inferring chart axis keys when omitted.
 */
function normalizeBlockData(obj: any): VisualizationBlock | null {
  if (!obj || typeof obj !== 'object') return null;
  const type = obj.type;
  if (!isValidVisualizationType(type)) return null;

  let spec: any = obj.spec;
  if (!spec || typeof spec !== 'object') {
    // Bare payload: wrap it under the type key.
    if (type === 'graph' && (obj.nodes || obj.edges)) spec = { graph: obj };
    else if (type === 'chart' && (obj.data || obj.type)) spec = { chart: obj };
    else if (type === 'algorithm' && (obj.steps || obj.algorithm)) spec = { algorithm: obj };
    else if (type === 'math' && (obj.expressions || obj.xRange)) spec = { math: obj };
    else if (type === 'table' && obj.columns) spec = { table: obj };
    else if (type === 'diagram' && obj.definition) spec = { diagram: obj };
    else return null;
  } else {
    // Flattened payloads: models often put the type payload directly under
    // `spec` (e.g. spec.nodes) instead of `spec.graph`. Wrap it.
    if (type === 'graph' && !spec.graph && (spec.nodes || spec.edges)) spec = { graph: spec };
    else if (type === 'chart' && !spec.chart && (spec.data || spec.xKey || spec.yKeys)) spec = { chart: spec };
    else if (type === 'algorithm' && !spec.algorithm && (spec.steps || spec.algorithm)) spec = { algorithm: spec };
    else if (type === 'math' && !spec.math && (spec.expressions || spec.xRange)) spec = { math: spec };
    else if (type === 'table' && !spec.table && spec.columns) spec = { table: spec };
    else if (type === 'diagram' && !spec.diagram && spec.definition) spec = { diagram: spec };
  }

  // Chart inference: models following the protocol omit xKey/yKeys.
  if (type === 'chart' && spec.chart && typeof spec.chart === 'object') {
    const c = spec.chart;
    const rows = Array.isArray(c.data) ? c.data : [];
    if (rows.length > 0 && rows[0] && typeof rows[0] === 'object' && !c.xKey) {
      const keys = Object.keys(rows[0]);
      if (keys.length >= 2) {
        c.xKey = keys[0];
        c.yKeys = keys.slice(1);
      } else if (keys.length === 1) {
        c.xKey = keys[0];
      }
    }
    if (Array.isArray(c.series) && c.series.length > 0 && !(Array.isArray(c.yKeys) && c.yKeys.length)) {
      const fromSeries = c.series.map((s: any) => (s && typeof s === 'object' ? s.key : s)).filter(Boolean);
      if (fromSeries.length) c.yKeys = fromSeries;
    }
    if (!(Array.isArray(c.yKeys) && c.yKeys.length)) c.yKeys = [];
    if (!c.data) c.data = [];
  }

  if (type === 'graph' && spec.graph && typeof spec.graph === 'object') {
    if (!Array.isArray(spec.graph.nodes)) return null;
    if (!Array.isArray(spec.graph.edges)) spec.graph.edges = [];
    const nodeIds = new Set<string>();
    // Keep a lookup from alternate keys (lower-case id, label) to canonical id
    // so edges that reference nodes by label or a slightly different id still
    // resolve instead of being silently dropped.
    const alias = new Map<string, string>();
    const registerAlias = (key: unknown, id: string) => {
      if (typeof key === 'string' && key.trim()) alias.set(key.trim().toLowerCase(), id);
    };
    spec.graph.nodes = spec.graph.nodes
      .filter((n: any) => n && typeof n === 'object')
      .map((n: any) => {
        const id = typeof n.id === 'string' && n.id ? n.id : `node-${Math.random().toString(36).slice(2, 8)}`;
        nodeIds.add(id);
        registerAlias(id, id);
        const data = n.data && typeof n.data === 'object' ? { ...n.data } : {};
        if (!data.label) data.label = n.label || id;
        registerAlias(data.label, id);
        if (!n.position || typeof n.position !== 'object') n.position = { x: 0, y: 0 };
        return { ...n, id, data };
      });
    const resolveEndpoint = (val: unknown): string | null => {
      if (typeof val !== 'string' || !val.trim()) return null;
      const key = val.trim().toLowerCase();
      if (nodeIds.has(val)) return val;
      if (alias.has(key)) return alias.get(key)!;
      // Fallback: unique suffix match (e.g. "A" matches "node-A")
      const matches = [...nodeIds].filter((id) => id.toLowerCase().endsWith(key) || key.endsWith(id.toLowerCase()));
      if (matches.length === 1) return matches[0];
      return null;
    };
    spec.graph.edges = spec.graph.edges
      .filter((e: any) => e && typeof e === 'object')
      .map((e: any, i: number) => {
        const src = resolveEndpoint(e.source);
        const tgt = resolveEndpoint(e.target);
        if (!src || !tgt || src === tgt) return null;
        return {
          ...e,
          source: src,
          target: tgt,
          id: typeof e.id === 'string' && e.id ? e.id : `edge-${i}`,
        };
      })
      .filter(Boolean);
  }

  // Algorithm inference: the protocol distinguishes the CATEGORY
  // (spec.type: 'sorting' | 'searching' | 'tree' | 'graph' | 'recursion' |
  // 'dynamic-programming' | 'custom') from the specific algorithm name
  // (spec.algorithm: 'binary-search', 'bubble-sort', ...). Models routinely
  // collapse the two into a single `type` field — normalize either shape so
  // the step animator dispatches and renders correctly.
  if (type === 'algorithm' && spec.algorithm && typeof spec.algorithm === 'object') {
    const a = spec.algorithm;
    const ALGO_CATEGORIES = ['sorting', 'searching', 'tree', 'graph', 'recursion', 'dynamic-programming', 'custom'];
    const name = typeof a.algorithm === 'string' ? a.algorithm : typeof a.name === 'string' ? a.name : (typeof a.type === 'string' ? a.type : '');
    a.algorithm = name || 'algorithm';
    const t = typeof a.type === 'string' ? a.type.toLowerCase() : '';
    if (!ALGO_CATEGORIES.includes(t)) {
      a.type = inferAlgorithmCategory(a.algorithm || t);
    }
    if (!Array.isArray(a.steps)) a.steps = [];
    if (a.currentStep === undefined) a.currentStep = 0;
  }

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : crypto.randomUUID(),
    type,
    spec: spec as VisualizationSpec,
    title: obj.title,
    description: obj.description,
  };
}

/** Map a specific algorithm name to the renderer's category. */
function inferAlgorithmCategory(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('sort')) return 'sorting';
  if (n.includes('search')) return 'searching';
  if (n.includes('bst') || n.includes('tree')) return 'tree';
  if (/(^|[^a-z])(bfs|dfs|dijkstra|topological|mst|shortest)([^a-z]|$)/.test(n)) return 'graph';
  if (n.includes('factorial') || n.includes('fibonacci') || n.includes('recursion')) return 'recursion';
  if (n.includes('dp') || n.includes('dynamic')) return 'dynamic-programming';
  return 'custom';
}

/**
 * Find the fence ranges + block objects in `content`.
 * A fence counts only when its JSON payload extracts to a valid viz object;
 * otherwise the fence is left in the text (it is just a code block).
 * Unclosed fences (in-progress streaming) are reported as `openFenceStart`.
 */
function findVizFences(content: string): {
  blocks: VisualizationBlock[];
  removeRanges: Array<[number, number]>;
  openFenceStart: number | null;
} {
  const blocks: VisualizationBlock[] = [];
  const removeRanges: Array<[number, number]> = [];
  let openFenceStart: number | null = null;

  VIZ_FENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = VIZ_FENCE_RE.exec(content)) !== null) {
    const fenceStart = m.index;
    const payloadStart = m.index + m[0].length;
    const closeIdx = content.indexOf('```', payloadStart);
    if (closeIdx === -1) {
      // In-progress (unclosed) fence — the stream is still delivering JSON.
      openFenceStart = fenceStart;
      break;
    }
    const payload = content.slice(payloadStart, closeIdx);
    const braceStart = payload.indexOf('{');
    if (braceStart === -1) {
      // Not a viz payload — leave as a normal code block.
      continue;
    }
    const extracted = extractJsonObject(payload, braceStart);
    if (!extracted) {
      // JSON not closed yet even though the fence is — treat as in-progress.
      openFenceStart = fenceStart;
      break;
    }
    const obj = tryParseJson(extracted.json);
    const block = normalizeBlockData(obj);
    if (!block) {
      // Parsed but not a visualization (e.g. a normal ```json code block).
      continue;
    }
    blocks.push(block);
    removeRanges.push([fenceStart, closeIdx + 3]);
  }

  return { blocks, removeRanges, openFenceStart };
}

/**
 * Parse a complete JSON block from model output (non-streaming).
 * Supports:
 *   ```viz { ... }```        ```viz-block { ... }```
 *   ```json { "type": "graph", ... }```   (viz-typed JSON fences)
 *   {"viz": { ... }}         (inline wrapper objects)
 * Extraction uses string-aware brace matching, so nested specs parse
 * reliably; light repairs tolerate common AI JSON slips.
 */
export function parseBlocksFromContent(content: string): { text: string; blocks: ParsedVisualizationBlock[] } {
  const blocks: ParsedVisualizationBlock[] = [];

  const { blocks: fencedBlocks, removeRanges } = findVizFences(content);
  for (const b of fencedBlocks) blocks.push(validateBlock(b));

  // Remove matched fences from the text.
  let text = content;
  for (const [start, end] of removeRanges.slice().sort((a, b) => b[0] - a[0])) {
    text = text.slice(0, start) + text.slice(end);
  }

  // Inline wrapper objects: {"viz": {...}}
  const inline = parseInlineVizObjects(text);
  text = inline.text;
  for (const b of inline.blocks) blocks.push(b);

  return { text: text.trim(), blocks };
}

/**
 * Live-display variant: returns the content the user should see while a
 * response is (still) streaming. Complete viz blocks are removed; an
 * in-progress (unclosed) viz fence hides everything from its opening fence
 * onward, so the student never watches raw JSON being typed.
 */
export function stripVizForDisplay(content: string): string {
  if (!content) return content;
  if (
    content.indexOf('```viz') === -1 &&
    content.indexOf('```viz-block') === -1 &&
    content.indexOf('```json') === -1
  ) {
    return content;
  }
  const { removeRanges, openFenceStart } = findVizFences(content);
  let text = content;
  for (const [start, end] of removeRanges.slice().sort((a, b) => b[0] - a[0])) {
    text = text.slice(0, start) + text.slice(end);
  }
  if (openFenceStart !== null) {
    // An open fence always comes after all closed ones — cut from there.
    text = text.slice(0, openFenceStart);
  }
  return text.trimEnd();
}

/**
 * Alternative parsing: Look for special JSON objects in the stream
 * Model outputs: {"viz": {"id": "...", "type": "graph", "spec": {...}}}
 */
export function parseInlineVizObjects(text: string): { text: string; blocks: ParsedVisualizationBlock[] } {
  const blocks: ParsedVisualizationBlock[] = [];
  const removeRanges: Array<[number, number]> = [];

  const wrapperRe = /\{\s*"viz"\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = wrapperRe.exec(text)) !== null) {
    // The wrapper object starts at m.index; extract it fully.
    const extracted = extractJsonObject(text, m.index);
    if (!extracted) break; // unclosed wrapper — still streaming
    const obj = tryParseJson(extracted.json);
    const inner = (obj as any)?.viz;
    const block = normalizeBlockData(inner);
    if (block) {
      blocks.push(validateBlock(block));
      removeRanges.push([m.index, extracted.end]);
    }
    wrapperRe.lastIndex = extracted.end;
  }

  let cleanText = text;
  for (const [start, end] of removeRanges.slice().sort((a, b) => b[0] - a[0])) {
    cleanText = cleanText.slice(0, start) + cleanText.slice(end);
  }

  return { text: cleanText.trim(), blocks };
}

/**
 * Main streaming parser - combines multiple parsing strategies
 */
export class StreamingBlockParser {
  private buffers = new Map<string, BlockBuffer>();
  private blockSequence = 0;
  private onBlockComplete?: (block: ParsedVisualizationBlock) => void;
  private onBlockUpdate?: (block: StreamingBlock) => void;

  constructor(options?: {
    onBlockComplete?: (block: ParsedVisualizationBlock) => void;
    onBlockUpdate?: (block: StreamingBlock) => void;
  }) {
    this.onBlockComplete = options?.onBlockComplete;
    this.onBlockUpdate = options?.onBlockUpdate;
  }

  /**
   * Process a chunk of SSE data
   */
  processChunk(data: string): { text: string; blocks: StreamingBlock[] } {
    const result = parseSSEDataForBlocks(data, this.buffers);

    // Notify about block updates
    for (const block of result.blocks) {
      this.onBlockUpdate?.(block);
    }

    // Notify about complete blocks
    for (const block of result.completeBlocks) {
      this.onBlockComplete?.(block);
    }

    return {
      text: result.text,
      blocks: result.blocks,
    };
  }

  /**
   * Process complete message content (for non-streaming or final message)
   */
  processComplete(content: string): { text: string; blocks: ParsedVisualizationBlock[] } {
    // Try multiple parsing strategies
    let { text, blocks } = parseBlocksFromContent(content);

    // Also try inline objects
    const inlineResult = parseInlineVizObjects(text);
    text = inlineResult.text;
    blocks = [...blocks, ...inlineResult.blocks];

    // Notify about complete blocks
    for (const block of blocks) {
      this.onBlockComplete?.(block);
    }

    return { text, blocks };
  }

  /**
   * Get current incomplete buffers (for persistence)
   */
  getBuffers(): Map<string, BlockBuffer> {
    return new Map(this.buffers);
  }

  /**
   * Restore buffers (for persistence across reloads)
   */
  restoreBuffers(buffers: Map<string, BlockBuffer>): void {
    this.buffers = new Map(buffers);
  }

  /**
   * Clear all buffers
   */
  clear(): void {
    this.buffers.clear();
    this.blockSequence = 0;
  }
}

// ============================================================================
// Validation
// ============================================================================

function isValidVisualizationType(type: string): type is VisualizationType {
  return ['graph', 'chart', 'algorithm', 'math', 'table', 'diagram'].includes(type);
}

function validateBlock(block: VisualizationBlock): ParsedVisualizationBlock {
  const errors: string[] = [];

  if (!block.id) errors.push('Missing block ID');
  if (!block.type) errors.push('Missing block type');
  if (!block.spec) errors.push('Missing block spec');

  // Type-specific validation
  if (block.spec) {
    switch (block.type) {
      case 'graph': {
        const graph = block.spec.graph;
        if (!graph?.nodes?.length) errors.push('Graph must have at least one node');
        if (graph && !graph.edges) graph.edges = [];
        break;
      }
      case 'chart': {
        const chart = block.spec.chart;
        if (!chart?.data?.length) errors.push('Chart must have data');
        if (!chart?.xKey) errors.push('Chart must have xKey');
        if (!chart?.yKeys?.length) errors.push('Chart must have at least one yKey');
        break;
      }
      case 'algorithm': {
        const algorithm = block.spec.algorithm;
        if (!algorithm?.algorithm) errors.push('Algorithm must have algorithm name');
        if (!algorithm?.steps?.length) errors.push('Algorithm must have steps');
        break;
      }
      case 'math': {
        const math = block.spec.math;
        if (!math?.expressions?.length) errors.push('Math must have expressions');
        break;
      }
      case 'table': {
        const table = block.spec.table;
        if (!table?.columns?.length) errors.push('Table must have columns');
        if (table && !table.data) table.data = [];
        break;
      }
      case 'diagram': {
        const diagram = block.spec.diagram;
        if (!diagram?.definition) errors.push('Diagram must have definition');
        break;
      }
    }
  }

  return {
    ...block,
    valid: errors.length === 0,
    validationErrors: errors.length > 0 ? errors : undefined,
    renderKey: `${block.id}-${block.type}-${JSON.stringify(block.spec).length}`,
  };
}

function validateAndCreateBlock(buffer: BlockBuffer): ParsedVisualizationBlock {
  const block: VisualizationBlock = {
    id: buffer.id,
    type: buffer.type,
    spec: buffer.spec as VisualizationSpec,
  };
  return validateBlock(block);
}

// ============================================================================
// Utility Functions
// ============================================================================

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Generate a streaming block ID
 */
export function generateBlockId(): string {
  return `viz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a visualization block for streaming
 */
export function createStreamingBlock(
  type: VisualizationType,
  initialSpec: Partial<VisualizationSpec> = {}
): { id: string; startMarker: string } {
  const id = generateBlockId();
  const startMarker = `${VIZ_START_MARKER} ${id} ${type}`;
  return { id, startMarker };
}

/**
 * Create a delta update for streaming
 */
export function createDeltaMarker(blockId: string, delta: Partial<VisualizationSpec>): string {
  return `${VIZ_DELTA_MARKER} ${blockId} ${JSON.stringify(delta)}`;
}

/**
 * Create an end marker for streaming
 */
export function createEndMarker(blockId: string): string {
  return `${VIZ_END_MARKER} ${blockId}`;
}

/**
 * Serialize a complete visualization block for model output
 */
export function serializeBlockForModel(block: VisualizationBlock): string {
  return `\`\`\`viz-block\n${JSON.stringify(block, null, 2)}\n\`\`\``;
}

/**
 * Serialize an inline visualization object for model output
 */
export function serializeInlineVizForModel(block: VisualizationBlock): string {
  return `{"viz":${JSON.stringify(block)}}`;
}