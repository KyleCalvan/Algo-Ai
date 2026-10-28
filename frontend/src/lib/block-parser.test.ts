import { describe, it, expect } from 'vitest';
import { parseBlocksFromContent } from './block-parser';

const SAMPLE = `Here is a graph.

\`\`\`viz
{
  "id": "simple-graph",
  "type": "graph",
  "spec": {
    "nodes": [
      { "id": "a", "data": { "label": "A" } },
      { "id": "b", "data": { "label": "B" } }
    ],
    "edges": [
      { "id": "e1", "source": "a", "target": "b", "markerEnd": "arrowclosed" }
    ],
    "layout": "force"
  }
}
\`\`\`
`;

describe('block parser graph', () => {
  it('parses a viz graph block', () => {
    const { text, blocks } = parseBlocksFromContent(SAMPLE);
    expect(blocks).toHaveLength(1);
    const b: any = blocks[0];
    expect(b.type).toBe('graph');
    expect(b.valid).toBe(true);
    expect(b.spec.graph.nodes).toHaveLength(2);
    expect(b.spec.graph.edges).toHaveLength(1);
    expect(text).not.toContain('```viz');
  });
});