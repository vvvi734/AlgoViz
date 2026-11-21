import { describe, expect, it } from 'vitest';
import { ALGORITHM_FLOWS } from '../../domain/guides/algorithmFlows';
import type { FlowSection } from '../../domain/guides/flowTypes';
import {
  FLOW_LAYOUT,
  flowNodeRect,
  flowRectsOverlap,
  flowSegmentHitsRect,
  flowTextUnits,
  layoutFlowSection,
  type FlowEdgeGeometry,
  type FlowRect,
  type FlowSegment,
} from './flowLayout';

const identity = (key: string) => key;

function deflate(rect: FlowRect, amount: number): FlowRect {
  return {
    left: rect.left + amount,
    top: rect.top + amount,
    right: rect.right - amount,
    bottom: rect.bottom - amount,
    width: rect.width - amount * 2,
    height: rect.height - amount * 2,
  };
}

function collinearOverlap(a: FlowSegment, b: FlowSegment): number {
  const horizontal = Math.abs(a.y1 - a.y2) < 0.1 && Math.abs(b.y1 - b.y2) < 0.1;
  if (horizontal && Math.abs(a.y1 - b.y1) < 0.1) {
    return (
      Math.min(Math.max(a.x1, a.x2), Math.max(b.x1, b.x2)) -
      Math.max(Math.min(a.x1, a.x2), Math.min(b.x1, b.x2))
    );
  }
  const vertical = Math.abs(a.x1 - a.x2) < 0.1 && Math.abs(b.x1 - b.x2) < 0.1;
  if (vertical && Math.abs(a.x1 - b.x1) < 0.1) {
    return (
      Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2)) -
      Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2))
    );
  }
  return 0;
}

function edgePairs(layout: ReturnType<typeof layoutFlowSection>): Array<{
  edge: FlowEdgeGeometry;
  segment: FlowSegment;
}> {
  return layout.edges.flatMap((edge) => edge.segments.map((segment) => ({ edge, segment })));
}

function checkSection(section: FlowSection, lang: 'zh' | 'en') {
  const layout = layoutFlowSection(section, lang, identity);
  const nodes = [...layout.nodes.values()];
  const nodeRects = nodes.map(flowNodeRect);
  const segments = edgePairs(layout);

  for (const node of nodes) {
    const rect = flowNodeRect(node);
    expect(rect.left, `${node.node.id} left edge`).toBeGreaterThanOrEqual(0);
    expect(rect.top, `${node.node.id} top edge`).toBeGreaterThanOrEqual(0);
    expect(rect.right, `${node.node.id} right edge`).toBeLessThanOrEqual(layout.width);
    expect(rect.bottom, `${node.node.id} bottom edge`).toBeLessThanOrEqual(layout.height);
    expect(node.label.width, `${node.node.id} label width`).toBeLessThanOrEqual(node.width - 12);
    const textHeight = node.label.height + (node.detail ? 6 + node.detail.height : 0);
    expect(textHeight, `${node.node.id} text height`).toBeLessThanOrEqual(node.height - 6);
  }

  for (let i = 0; i < nodeRects.length; i += 1) {
    for (let j = i + 1; j < nodeRects.length; j += 1) {
      expect(
        flowRectsOverlap(nodeRects[i]!, nodeRects[j]!),
        `${nodes[i]!.node.id} overlaps ${nodes[j]!.node.id}`,
      ).toBe(false);
    }
  }

  for (const item of segments) {
    for (const rect of nodeRects) {
      expect(
        flowSegmentHitsRect(item.segment, deflate(rect, 2)),
        `${item.edge.edge.from}->${item.edge.edge.to} crosses a node body`,
      ).toBe(false);
    }
  }

  const labels = layout.edges.flatMap((edge) => (edge.label ? [{ edge, box: edge.label.box }] : []));
  for (const edge of layout.edges) {
    if (edge.branch && !edge.edge.back) {
      expect(edge.label, `${edge.edge.from}->${edge.edge.to} lost its label`).not.toBeNull();
    }
    if (!edge.label) continue;
    expect(edge.label.box.width).toBeGreaterThanOrEqual(
      flowTextUnits(edge.label.text) * FLOW_LAYOUT.edgeFont + 8,
    );
    expect(edge.label.box.height).toBe(FLOW_LAYOUT.edgeLabelHeight);
    expect(edge.label.box.left).toBeGreaterThanOrEqual(0);
    expect(edge.label.box.top).toBeGreaterThanOrEqual(0);
    expect(edge.label.box.right).toBeLessThanOrEqual(layout.width);
    expect(edge.label.box.bottom).toBeLessThanOrEqual(layout.height);
    for (const rect of nodeRects) {
      expect(
        flowRectsOverlap(edge.label.box, rect),
        `${edge.label.text} overlaps a node`,
      ).toBe(false);
    }
  }

  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      expect(
        flowRectsOverlap(labels[i]!.box, labels[j]!.box),
        `${labels[i]!.edge.edge.from} label overlaps ${labels[j]!.edge.edge.from} label`,
      ).toBe(false);
    }
  }

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i]!;
      const b = segments[j]!;
      if (a.edge === b.edge) continue;
      expect(
        collinearOverlap(a.segment, b.segment),
        `${a.edge.edge.from}->${a.edge.edge.to} overlaps ${b.edge.edge.from}->${b.edge.edge.to}`,
      ).toBeLessThanOrEqual(2);
    }
  }

  const exitPorts = new Map<string, Set<string>>();
  for (const edge of layout.edges) {
    const first = edge.segments[0];
    if (!first) continue;
    const point = `${first.x1.toFixed(1)}:${first.y1.toFixed(1)}`;
    const ports = exitPorts.get(edge.edge.from) ?? new Set<string>();
    expect(ports.has(point), `${edge.edge.from} reuses an exit port`).toBe(false);
    ports.add(point);
    exitPorts.set(edge.edge.from, ports);
  }

  const channels = new Set<number>();
  for (const [index, item] of layout.loops.entries()) {
    expect(item.number).toBe(index + 1);
    expect(item.text.trim()).not.toBe('');
    expect(channels.has(item.badgeX), `duplicate loop channel ${item.badgeX}`).toBe(false);
    channels.add(item.badgeX);
    expect(item.badgeX).toBeGreaterThanOrEqual(0);
    expect(item.badgeX).toBeLessThanOrEqual(layout.width);
    expect(item.badgeY).toBeGreaterThanOrEqual(0);
    expect(item.badgeY).toBeLessThanOrEqual(layout.height);
  }
  for (let i = 0; i < layout.loops.length; i += 1) {
    for (let j = i + 1; j < layout.loops.length; j += 1) {
      const a = layout.loops[i]!;
      const b = layout.loops[j]!;
      expect(
        Math.abs(a.badgeX - b.badgeX) < 16 && Math.abs(a.badgeY - b.badgeY) < 16,
        `loop badges ${a.number}/${b.number} overlap`,
      ).toBe(false);
    }
  }

  return layout;
}

describe('algorithm flow layout geometry', () => {
  it.each(Object.keys(ALGORITHM_FLOWS))('%s stays legible in both languages', (algorithmId) => {
    const flow = ALGORITHM_FLOWS[algorithmId]!;
    for (const section of flow.sections) {
      checkSection(section, 'zh');
      checkSection(section, 'en');
    }
  });

  it('separates every polynomial loop into its own channel and numbered legend entry', () => {
    const section = ALGORITHM_FLOWS['polynomial-add']!.sections[0]!;
    const layout = layoutFlowSection(section, 'zh', identity);
    const loopEdges = section.edges.filter((edge) => edge.back);

    expect(loopEdges).toHaveLength(6);
    expect(layout.loops).toHaveLength(loopEdges.length);
    expect(new Set(layout.loops.map((item) => item.badgeX)).size).toBe(loopEdges.length);
    expect(layout.loops.map((item) => item.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(layout.loops.every((item) => item.text.length > 0)).toBe(true);
  });

  it('gives each decision branch a label that cannot be covered by a node', () => {
    for (const [algorithmId, flow] of Object.entries(ALGORITHM_FLOWS)) {
      for (const section of flow.sections) {
        const layout = layoutFlowSection(section, 'zh', identity);
        for (const edge of layout.edges) {
          if (edge.edge.back) continue;
          if (edge.edge.kind !== 'yes' && edge.edge.kind !== 'no') continue;
          expect(edge.label, `${algorithmId}/${section.id}/${edge.edge.from}`).not.toBeNull();
          expect(edge.label!.box.width).toBeGreaterThan(edge.label!.text.length);
        }
      }
    }
  });
});
