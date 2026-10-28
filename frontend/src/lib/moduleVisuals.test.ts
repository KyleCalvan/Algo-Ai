import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LESSONS } from './lessons';
import { EXTRA_LESSONS } from './lessonsExtra';
import { getModuleVisuals, MODULE_VISUALS } from './moduleVisuals';
import { LessonDiagram } from '../components/LessonDiagram';

describe('fixed module examples', () => {
  it.each(Object.keys({ ...LESSONS, ...EXTRA_LESSONS }))('provides a worked graph for %s', title => {
    const examples = getModuleVisuals(title);
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.some(example => example.type === 'diagram' || example.type === 'bar' || example.type === 'line')).toBe(true);
  });

  it('matches imported titles with spacing, case, and separator variations', () => {
    expect(getModuleVisuals('  module6 advanced algorithms ')).toEqual(MODULE_VISUALS.Module6_Advanced_Algorithms);
    expect(getModuleVisuals('GROUP 5 – GRAPH ALGORITHM')).toEqual(MODULE_VISUALS['GROUP 5 - GRAPH ALGORITHM']);
    expect(getModuleVisuals('Unrelated uploaded lesson')).toEqual([]);
  });

  it('renders every diagram with valid endpoints, visible labels, and accessible descriptions', () => {
    for (const visual of Object.values(MODULE_VISUALS).flat()) {
      if (visual.type !== 'diagram') continue;
      const nodes = visual.nodes || [];
      expect(nodes.length).toBeGreaterThan(1);
      expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
      for (const node of nodes) {
        expect(node.x).toBeGreaterThanOrEqual(55);
        expect(node.x).toBeLessThanOrEqual(585);
        expect(node.y).toBeGreaterThanOrEqual(23);
        expect(node.y).toBeLessThanOrEqual((visual.diagramHeight || 300) - 23);
      }
      for (const edge of visual.edges || []) {
        expect(nodes.some(node => node.id === edge.from)).toBe(true);
        expect(nodes.some(node => node.id === edge.to)).toBe(true);
      }
      const html = renderToStaticMarkup(createElement(LessonDiagram, { visual }));
      expect(html).toContain('role="img"');
      expect(html).toContain('<desc>');
      expect(html).not.toContain('NaN');
      for (const node of nodes) expect(html).toContain(node.label);
    }
  });

  it('keeps log charts positive and encodes actual function values', () => {
    const chart = getModuleVisuals('Big-O Notation')[0];
    expect(chart.yScale).toBe('log');
    for (const point of chart.data || []) {
      const n = Number(point.n);
      expect(point.log).toBe(Math.log2(n));
      expect(point.linear).toBe(n);
      expect(point.nlog).toBe(n * Math.log2(n));
      expect(point.square).toBe(n * n);
    }
    for (const visual of Object.values(MODULE_VISUALS).flat()) {
      if (visual.yScale !== 'log') continue;
      for (const point of visual.data || []) {
        for (const series of visual.series || []) expect(Number(point[series.key])).toBeGreaterThan(0);
      }
    }
  });

  it('shows the same array values before and after sorting', () => {
    const data = getModuleVisuals('Sorting Algorithms')[0].data || [];
    const sorted = data.map(point => point.before).sort((a, b) => Number(a) - Number(b));
    expect(data.map(point => point.after)).toEqual(sorted);
  });
});
