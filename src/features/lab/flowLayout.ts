import type {
  FlowEdge,
  FlowNode,
  FlowNodeKind,
  FlowSection,
} from '../../domain/guides/flowTypes';
import { plainFlowLabel } from '../../domain/guides/flowPlainLanguage';

/** Pixel constants shared by geometry and the SVG renderer. */
export const FLOW_LAYOUT = {
  nodeWidth: 184,
  decisionWidth: 184,
  terminalWidth: 172,
  nodeGap: 48,
  rowGap: 68,
  padTop: 40,
  padX: 20,
  padBottom: 28,
  loopChannelGap: 16,
  nodeLine: 18,
  detailLine: 17,
  nodeFont: 13.5,
  edgeFont: 12.5,
  edgeLabelHeight: 18,
  edgeLabelPadX: 7,
} as const;

export type FlowLanguage = 'zh' | 'en';

export interface FlowTextBlock {
  lines: string[];
  height: number;
  width: number;
}

export interface FlowRect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface FlowPoint {
  x: number;
  y: number;
}

export interface FlowSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface FlowNodeGeometry {
  node: FlowNode;
  x: number;
  y: number;
  width: number;
  height: number;
  label: FlowTextBlock;
  detail?: FlowTextBlock;
}

export interface FlowEdgeLabelGeometry {
  text: string;
  box: FlowRect;
}

export interface FlowEdgeGeometry {
  edge: FlowEdge;
  path: string;
  segments: FlowSegment[];
  label: FlowEdgeLabelGeometry | null;
  branch: string;
  side: 'left' | 'right' | 'center';
  marker: boolean;
}

export interface FlowLoopLegendItem {
  number: number;
  text: string;
  side: 'left' | 'right';
  badgeX: number;
  badgeY: number;
}

export interface FlowSectionLayout {
  nodes: Map<string, FlowNodeGeometry>;
  edges: FlowEdgeGeometry[];
  loops: FlowLoopLegendItem[];
  width: number;
  height: number;
}

export function flowTextUnits(value: string): number {
  let units = 0;
  for (const char of value) {
    if (char === ' ') units += 0.34;
    else if (/[\u2e80-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(char)) units += 1;
    else if (/[\u0000-\u007f]/.test(char)) units += 0.56;
    else units += 0.9;
  }
  return units;
}

function wrapText(value: string, maxUnits: number, lineHeight: number): FlowTextBlock {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return { lines: [''], height: lineHeight, width: 0 };
  const lines: string[] = [];
  let line = '';
  let used = 0;

  const flush = () => {
    if (line.trim()) lines.push(line.trim());
    line = '';
    used = 0;
  };

  // Split at natural punctuation before falling back to per-character wrapping.
  const rawTokens = normalized.includes(' ') ? (normalized.match(/\S+\s*/g) ?? [normalized]) : [normalized];
  const tokens = rawTokens.flatMap((token) => {
    const source = String(token);
    return source.match(/[^，。！？；：、]+[，。！？；：、]?/g) ?? [source];
  });
  const closingPunctuation = '，。！？；：、）】》”’';
  const openingPunctuation = '（【《“‘';

  for (const token of tokens) {
    const tokenText = String(token);
    const tokenUnits = flowTextUnits(tokenText);
    if (used + tokenUnits <= maxUnits) {
      line += tokenText;
      used += tokenUnits;
      continue;
    }
    if (line.trim()) flush();
    if (tokenUnits <= maxUnits) {
      line = tokenText.trimStart();
      used = flowTextUnits(line);
      continue;
    }
    // A long unbroken token is split by character rather than shrunk: text may
    // never disappear under a clip path. Closing punctuation stays on the
    // previous line, and opening punctuation moves to the next line.
    for (const char of tokenText) {
      const unit = flowTextUnits(char);
      if (used + unit > maxUnits && line.trim()) {
        if (closingPunctuation.includes(char)) {
          line += char;
          used += unit;
          flush();
          continue;
        }
        let carry = '';
        while (line && openingPunctuation.includes(line.at(-1) ?? '')) {
          const last = line.at(-1) ?? '';
          carry = last + carry;
          line = line.slice(0, -1);
          used -= flowTextUnits(last);
        }
        flush();
        line = carry;
        used = flowTextUnits(carry);
      }
      line += char;
      used += unit;
    }
  }
  flush();
  const count = Math.max(1, lines.length);
  const widest = Math.max(0, ...lines.map((item) => flowTextUnits(item)));
  return { lines, height: count * lineHeight, width: widest * FLOW_LAYOUT.nodeFont };
}

function nodeWidth(kind: FlowNodeKind): number {
  if (kind === 'decision') return FLOW_LAYOUT.decisionWidth;
  if (kind === 'start' || kind === 'end') return FLOW_LAYOUT.terminalWidth;
  return FLOW_LAYOUT.nodeWidth;
}

function nodeMaxUnits(node: FlowNode, width: number): number {
  const usable = width - 24;
  if (node.kind === 'decision') return Math.max(7, Math.floor((usable * 0.82) / FLOW_LAYOUT.nodeFont));
  return Math.max(8, Math.floor(usable / FLOW_LAYOUT.nodeFont));
}

export function flowNodeLabel(node: FlowNode, lang: FlowLanguage): string {
  return plainFlowLabel(node.label.zh, node.label.en, lang);
}

function nodeBlocks(node: FlowNode, lang: FlowLanguage, detail: boolean): FlowTextBlock {
  const width = nodeWidth(node.kind);
  const maxUnits = nodeMaxUnits(node, width);
  const value = detail ? node.detail?.[lang] ?? '' : flowNodeLabel(node, lang);
  return wrapText(value, maxUnits, detail ? FLOW_LAYOUT.detailLine : FLOW_LAYOUT.nodeLine);
}

function nodeHeight(node: FlowNode, lang: FlowLanguage): number {
  const label = nodeBlocks(node, lang, false);
  const detail = node.detail ? nodeBlocks(node, lang, true) : null;
  if (node.kind === 'decision') {
    return Math.max(64, label.height + 22 + (detail?.height ?? 0));
  }
  if (node.kind === 'start' || node.kind === 'end') {
    return Math.max(36, label.height + 12 + (detail?.height ?? 0));
  }
  return Math.max(42, label.height + 12 + (detail ? 4 + detail.height : 0));
}

export function rotateFlowEdgeLabel(
  edge: FlowEdge,
  lang: FlowLanguage,
  t: (key: string) => string,
): string {
  if (edge.label) return plainFlowLabel(edge.label.zh, edge.label.en, lang);
  if (edge.kind === 'yes') return t('flowYes');
  if (edge.kind === 'no') return t('flowNo');
  if (edge.back) return t('flowLoopBack');
  if (edge.kind === 'return') return t('flowReturn');
  if (edge.kind === 'call') return t('flowCall');
  return '';
}

export function flowNodeRect(node: FlowNodeGeometry): FlowRect {
  return {
    left: node.x - node.width / 2,
    top: node.y - node.height / 2,
    width: node.width,
    height: node.height,
    right: node.x + node.width / 2,
    bottom: node.y + node.height / 2,
  };
}

function inflate(rect: FlowRect, amount: number): FlowRect {
  return {
    left: rect.left - amount,
    top: rect.top - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
    right: rect.right + amount,
    bottom: rect.bottom + amount,
  };
}

function overlaps(a: FlowRect, b: FlowRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function rectContains(rect: FlowRect, point: FlowPoint): boolean {
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

export function flowRectsOverlap(a: FlowRect, b: FlowRect): boolean {
  return overlaps(a, b);
}

export function flowRectContains(rect: FlowRect, point: FlowPoint): boolean {
  return rectContains(rect, point);
}

export function flowSegmentHitsRect(segment: FlowSegment, rect: FlowRect): boolean {
  return segmentHitsRect(segment, rect);
}

function segmentHitsRect(segment: FlowSegment, rect: FlowRect): boolean {
  const { x1, y1, x2, y2 } = segment;
  if (rectContains(rect, { x: x1, y: y1 }) || rectContains(rect, { x: x2, y: y2 })) return true;
  if (Math.abs(y1 - y2) < 0.01) {
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    return y1 > rect.top && y1 < rect.bottom && right > rect.left && left < rect.right;
  }
  if (Math.abs(x1 - x2) < 0.01) {
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);
    return x1 > rect.left && x1 < rect.right && bottom > rect.top && top < rect.bottom;
  }
  return false;
}

function segmentsToPath(segments: FlowSegment[]): string {
  if (segments.length === 0) return '';
  const points: FlowPoint[] = [{ x: segments[0]!.x1, y: segments[0]!.y1 }];
  for (const segment of segments) points.push({ x: segment.x2, y: segment.y2 });
  return `M ${points.map((point) => `${round(point.x)} ${round(point.y)}`).join(' L ')}`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function edgeSegments(points: FlowPoint[]): FlowSegment[] {
  const segments: FlowSegment[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    if (Math.abs(from.x - to.x) < 0.01 && Math.abs(from.y - to.y) < 0.01) continue;
    segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  }
  return segments;
}

function branchBox(text: string, centerX: number, top: number): FlowRect {
  const width = Math.max(26, flowTextUnits(text) * FLOW_LAYOUT.edgeFont + FLOW_LAYOUT.edgeLabelPadX * 2);
  return {
    left: centerX - width / 2,
    top,
    width,
    height: FLOW_LAYOUT.edgeLabelHeight,
    right: centerX + width / 2,
    bottom: top + FLOW_LAYOUT.edgeLabelHeight,
  };
}

function clampBox(box: FlowRect, width: number, height: number): FlowRect {
  const left = Math.max(3, Math.min(box.left, width - box.width - 3));
  const top = Math.max(3, Math.min(box.top, height - box.height - 3));
  return { ...box, left, top, right: left + box.width, bottom: top + box.height };
}

function placeEdgeLabel(
  text: string,
  segments: FlowSegment[],
  source: FlowNodeGeometry,
  target: FlowNodeGeometry,
  occupied: FlowRect[],
  nodeRects: FlowRect[],
  graphWidth: number,
  graphHeight: number,
): FlowEdgeLabelGeometry | null {
  if (!text) return null;
  const candidates: FlowRect[] = [];
  const horizontal = segments.filter((segment) => Math.abs(segment.y1 - segment.y2) < 0.01);
  const vertical = segments.filter((segment) => Math.abs(segment.x1 - segment.x2) < 0.01);

  // Preferred labels sit immediately above or below the first horizontal run
  // of the edge. The run is already inside a row gap, so the badge cannot
  // cover a node label.
  for (const segment of horizontal) {
    const left = Math.min(segment.x1, segment.x2);
    const right = Math.max(segment.x1, segment.x2);
    const y = segment.y1;
    const center = (left + right) / 2;
    candidates.push(branchBox(text, center, y - 7 - FLOW_LAYOUT.edgeLabelHeight));
    candidates.push(branchBox(text, center, y + 7));
    candidates.push(branchBox(text, left + 10 + (flowTextUnits(text) * FLOW_LAYOUT.edgeFont) / 2, y - 7 - FLOW_LAYOUT.edgeLabelHeight));
    candidates.push(branchBox(text, right - 10 - (flowTextUnits(text) * FLOW_LAYOUT.edgeFont) / 2, y + 7));
  }

  // A direct vertical edge has no horizontal run; place the badge beside it.
  for (const segment of vertical) {
    const top = Math.min(segment.y1, segment.y2);
    const bottom = Math.max(segment.y1, segment.y2);
    const y = (top + bottom) / 2 - FLOW_LAYOUT.edgeLabelHeight / 2;
    candidates.push(branchBox(text, segment.x1 + 12 + (flowTextUnits(text) * FLOW_LAYOUT.edgeFont) / 2, y));
    candidates.push(branchBox(text, segment.x1 - 12 - (flowTextUnits(text) * FLOW_LAYOUT.edgeFont) / 2, y));
  }

  // Same-row decisions put their branch label in the gap directly below the
  // row, never over the two node bodies.
  const rowGapTop = Math.max(source.y + source.height / 2, target.y + target.height / 2) + 7;
  candidates.push(branchBox(text, (source.x + target.x) / 2, rowGapTop));
  candidates.push(branchBox(text, source.x, source.y + source.height / 2 + 7));

  // Last-resort top rail. It is still inside the SVG and never clipped.
  const railY = 5 + (occupied.length % 2) * (FLOW_LAYOUT.edgeLabelHeight + 3);
  candidates.push(branchBox(text, graphWidth / 2, railY));
  candidates.push(branchBox(text, graphWidth - 8 - (flowTextUnits(text) * FLOW_LAYOUT.edgeFont) / 2, railY));

  for (const candidate of candidates) {
    const box = clampBox(candidate, graphWidth, graphHeight);
    if (occupied.some((item) => overlaps(inflate(box, 3), item))) continue;
    const nodeHit = nodeRects.find((rect) => overlaps(box, inflate(rect, 3)));
    if (nodeHit) continue;
    occupied.push(box);
    return { text, box };
  }
  return null;
}

function desiredCorridor(
  source: FlowNodeGeometry,
  target: FlowNodeGeometry,
  laneExtents: Map<number, { left: number; right: number }>,
  lanes: number[],
): { x: number; key: string } {
  const sourceLaneIndex = lanes.indexOf(source.node.lane);
  const targetLaneIndex = lanes.indexOf(target.node.lane);
  if (source.node.lane === target.node.lane) {
    const lane = laneExtents.get(source.node.lane)!;
    if (sourceLaneIndex > 0) {
      const previous = laneExtents.get(lanes[sourceLaneIndex - 1])!;
      return {
        x: (previous.right + lane.left) / 2,
        key: `between:${sourceLaneIndex - 1}:${sourceLaneIndex}`,
      };
    }
    const next = laneExtents.get(lanes[sourceLaneIndex + 1]);
    return {
      x: next ? (lane.right + next.left) / 2 : lane.right + FLOW_LAYOUT.nodeGap / 2,
      key: next ? `between:${sourceLaneIndex}:${sourceLaneIndex + 1}` : 'outer:right',
    };
  }
  if (sourceLaneIndex < targetLaneIndex) {
    const here = laneExtents.get(source.node.lane)!;
    const next = laneExtents.get(lanes[sourceLaneIndex + 1])!;
    return { x: (here.right + next.left) / 2, key: `between:${sourceLaneIndex}:${sourceLaneIndex + 1}` };
  }
  const here = laneExtents.get(source.node.lane)!;
  const previous = laneExtents.get(lanes[sourceLaneIndex - 1])!;
  return { x: (previous.right + here.left) / 2, key: `between:${sourceLaneIndex - 1}:${sourceLaneIndex}` };
}

export function layoutFlowSection(
  section: FlowSection,
  lang: FlowLanguage,
  t: (key: string) => string,
): FlowSectionLayout {
  const lanes = [...new Set(section.nodes.map((node) => node.lane))].sort((a, b) => a - b);
  const rows = [...new Set(section.nodes.map((node) => node.row))].sort((a, b) => a - b);
  const loopEdges: Array<{ edge: FlowEdge; index: number; side: 'left' | 'right' }> = section.edges
    .map((edge, index) => ({ edge, index }))
    .filter((item) => item.edge.back)
    .map((item) => ({
      ...item,
      side: section.nodes.find((node) => node.id === item.edge.from)?.lane === 1 ? 'right' : 'left',
    }));
  const leftLoops = loopEdges.filter((item) => item.side === 'left');
  const rightLoops = loopEdges.filter((item) => item.side === 'right');

  const gutterFor = (count: number) =>
    FLOW_LAYOUT.padX + (count > 0 ? 8 + (count - 1) * FLOW_LAYOUT.loopChannelGap : 0);
  const leftGutter = gutterFor(leftLoops.length);
  const rightGutter = gutterFor(rightLoops.length);
  const contentWidth =
    lanes.length * FLOW_LAYOUT.nodeWidth + Math.max(0, lanes.length - 1) * FLOW_LAYOUT.nodeGap;
  const graphWidth = leftGutter + contentWidth + rightGutter;

  const laneCenters = new Map<number, number>();
  for (const [index, lane] of lanes.entries()) {
    laneCenters.set(
      lane,
      leftGutter + FLOW_LAYOUT.nodeWidth / 2 + index * (FLOW_LAYOUT.nodeWidth + FLOW_LAYOUT.nodeGap),
    );
  }

  const rowNodes = new Map<number, FlowNode[]>();
  for (const node of section.nodes) {
    const bucket = rowNodes.get(node.row) ?? [];
    bucket.push(node);
    rowNodes.set(node.row, bucket);
  }

  const rowHeights = new Map<number, number>();
  for (const row of rows) {
    rowHeights.set(row, Math.max(48, ...(rowNodes.get(row) ?? []).map((node) => nodeHeight(node, lang))));
  }

  const rowIndex = new Map(rows.map((row, index) => [row, index]));
  const gapAfterIndex = (sourceIndex: number) =>
    sourceIndex === rows.length - 1 ? rows.length : sourceIndex;
  const edgeBranch = section.edges.map((edge) => rotateFlowEdgeLabel(edge, lang, t));
  const edgeLabeled = section.edges.map((edge, index) => Boolean(edgeBranch[index]) && !edge.back);

  const sameRowBlocked = (edge: FlowEdge): boolean => {
    const sourceNode = section.nodes.find((node) => node.id === edge.from);
    const targetNode = section.nodes.find((node) => node.id === edge.to);
    if (!sourceNode || !targetNode || sourceNode.row !== targetNode.row) return false;
    const sourceX = laneCenters.get(sourceNode.lane)!;
    const targetX = laneCenters.get(targetNode.lane)!;
    const sourceHalf = nodeWidth(sourceNode.kind) / 2;
    const targetHalf = nodeWidth(targetNode.kind) / 2;
    const sourceEdgeX = targetX > sourceX ? sourceX + sourceHalf : sourceX - sourceHalf;
    const targetEdgeX = targetX > sourceX ? targetX - targetHalf : targetX + targetHalf;
    return section.nodes.some((node) => {
      if (node.id === sourceNode.id || node.id === targetNode.id) return false;
      if (node.row !== sourceNode.row) return false;
      const x = laneCenters.get(node.lane)!;
      const half = nodeWidth(node.kind) / 2;
      return targetX > sourceX ? x + half > sourceEdgeX && x - half < targetEdgeX : x - half < sourceEdgeX && x + half > targetEdgeX;
    });
  };

  interface GapUsage {
    edgeIndex: number;
    role: 'after' | 'before';
    labeled: boolean;
  }
  const gapUsages = new Map<number, GapUsage[]>();
  const addGapUsage = (gapIndex: number, usage: GapUsage) => {
    const bucket = gapUsages.get(gapIndex) ?? [];
    bucket.push(usage);
    gapUsages.set(gapIndex, bucket);
  };

  section.edges.forEach((edge, edgeIndex) => {
    const sourceIndex = rowIndex.get(section.nodes.find((node) => node.id === edge.from)!.row)!;
    const targetIndex = rowIndex.get(section.nodes.find((node) => node.id === edge.to)!.row)!;
    const afterGapIndex = gapAfterIndex(sourceIndex);
    if (edge.back) {
      addGapUsage(afterGapIndex, { edgeIndex, role: 'after', labeled: false });
      addGapUsage(targetIndex - 1, { edgeIndex, role: 'before', labeled: false });
      return;
    }
    if (sourceIndex === targetIndex) {
      if (sameRowBlocked(edge)) {
        addGapUsage(afterGapIndex, { edgeIndex, role: 'after', labeled: edgeLabeled[edgeIndex]! });
      }
      return;
    }
    addGapUsage(afterGapIndex, { edgeIndex, role: 'after', labeled: edgeLabeled[edgeIndex]! });
    if (targetIndex > sourceIndex + 1) {
      addGapUsage(targetIndex - 1, { edgeIndex, role: 'before', labeled: false });
    }
  });

  const gapHeightFor = (usages: GapUsage[] | undefined, minimum: number = FLOW_LAYOUT.rowGap) => {
    if (!usages || usages.length === 0) return minimum;
    const slots = usages.reduce((total, usage) => total + (usage.labeled ? 34 : 8), 0);
    return Math.max(minimum, 32 + slots);
  };

  const topGapHeight = Math.max(FLOW_LAYOUT.padTop, gapHeightFor(gapUsages.get(-1), 0));
  const rowTops = new Map<number, number>();
  const rowBottoms = new Map<number, number>();
  const rowCenters = new Map<number, number>();
  let cursor = topGapHeight;
  rows.forEach((row, index) => {
    const height = rowHeights.get(row) ?? 48;
    rowTops.set(row, cursor);
    rowBottoms.set(row, cursor + height);
    rowCenters.set(row, cursor + height / 2);
    cursor += height;
    if (index < rows.length - 1) cursor += gapHeightFor(gapUsages.get(index));
  });

  const bottomGapHeight = gapUsages.has(rows.length)
    ? gapHeightFor(gapUsages.get(rows.length), 0)
    : FLOW_LAYOUT.padBottom;
  const lastBottom = rowBottoms.get(rows[rows.length - 1]!) ?? topGapHeight;
  const graphHeight = lastBottom + bottomGapHeight;

  const nodeMap = new Map<string, FlowNodeGeometry>();
  for (const node of section.nodes) {
    const width = nodeWidth(node.kind);
    const height = Math.max(
      node.kind === 'decision' || node.kind === 'start' || node.kind === 'end' ? 36 : 42,
      nodeHeight(node, lang),
    );
    const label = nodeBlocks(node, lang, false);
    const detail = node.detail ? nodeBlocks(node, lang, true) : undefined;
    const centerY = rowCenters.get(node.row) ?? topGapHeight + height / 2;
    nodeMap.set(node.id, {
      node,
      x: laneCenters.get(node.lane) ?? leftGutter + FLOW_LAYOUT.nodeWidth / 2,
      y: centerY,
      width,
      height,
      label,
      detail,
    });
  }

  const gapTracks = new Map<string, number>();
  for (const [gapIndex, usages] of gapUsages) {
    const sorted = [...usages].sort((a, b) => Number(b.labeled) - Number(a.labeled));
    let gapTop = 0;
    let gapBottom = graphHeight;
    if (gapIndex === -1) {
      gapBottom = rowTops.get(rows[0]!) ?? topGapHeight;
    } else if (gapIndex === rows.length) {
      gapTop = lastBottom;
    } else if (gapIndex >= 0 && gapIndex < rows.length - 1) {
      gapTop = rowBottoms.get(rows[gapIndex]!)!;
      gapBottom = rowTops.get(rows[gapIndex + 1]!)!;
    }
    let slotCursor = gapTop + 16;
    for (const usage of sorted) {
      const slot = usage.labeled ? 34 : 8;
      gapTracks.set(`${gapIndex}:${usage.edgeIndex}:${usage.role}`, slotCursor + slot / 2);
      slotCursor += slot;
    }
    if (slotCursor > gapBottom - 4) {
      // The gap was sized from the same slot model, so this only fires for a
      // malformed graph. Compressing keeps every track inside the canvas.
      const scale = (gapBottom - gapTop - 8) / Math.max(1, slotCursor - gapTop - 16);
      for (const usage of sorted) {
        const key = `${gapIndex}:${usage.edgeIndex}:${usage.role}`;
        gapTracks.set(key, gapTop + 16 + (gapTracks.get(key)! - gapTop - 16) * scale);
      }
    }
  }

  const laneExtents = new Map<number, { left: number; right: number }>();
  for (const lane of lanes) {
    const laneNodes = [...nodeMap.values()].filter((node) => node.node.lane === lane);
    laneExtents.set(lane, {
      left: Math.min(...laneNodes.map((node) => node.x - node.width / 2)),
      right: Math.max(...laneNodes.map((node) => node.x + node.width / 2)),
    });
  }

  const outgoing = new Map<string, number[]>();
  const incoming = new Map<string, number[]>();
  section.edges.forEach((edge, index) => {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), index]);
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), index]);
  });

  const portOffset = (index: number, count: number, span: number) => {
    if (count <= 1) return 0;
    const step = Math.min(10, span / Math.max(1, count - 1));
    return (index - (count - 1) / 2) * step;
  };

  const sourcePort = (node: FlowNodeGeometry, edgeIndex: number): number => {
    const siblings = outgoing.get(node.node.id) ?? [];
    return node.x + portOffset(siblings.indexOf(edgeIndex), siblings.length, node.width - 36);
  };
  const targetPort = (node: FlowNodeGeometry, edgeIndex: number): number => {
    const siblings = incoming.get(node.node.id) ?? [];
    return node.x + 4 + portOffset(siblings.indexOf(edgeIndex), siblings.length, node.width - 42);
  };

  const loopList = loopEdges.map((item, ordinal) => {
    const source = nodeMap.get(item.edge.from)!;
    const target = nodeMap.get(item.edge.to)!;
    const side = item.side as 'left' | 'right';
    const channelIndex =
      side === 'left'
        ? leftLoops.findIndex((candidate) => candidate.index === item.index)
        : rightLoops.findIndex((candidate) => candidate.index === item.index);
    const channelX =
      side === 'left'
        ? FLOW_LAYOUT.padX + channelIndex * FLOW_LAYOUT.loopChannelGap
        : graphWidth - FLOW_LAYOUT.padX - channelIndex * FLOW_LAYOUT.loopChannelGap;
    return {
      ...item,
      source,
      target,
      side,
      channelX,
      number: ordinal + 1,
      text: rotateFlowEdgeLabel(item.edge, lang, t),
    };
  });

  const loopByEdge = new Map(loopList.map((item) => [item.index, item]));
  const corridorUsage = new Map<string, number>();

  const corridorX = (source: FlowNodeGeometry, target: FlowNodeGeometry) => {
    const desired = desiredCorridor(source, target, laneExtents, lanes);
    const count = corridorUsage.get(desired.key) ?? 0;
    corridorUsage.set(desired.key, count + 1);
    return desired.x + ((count % 7) - 3) * 4.5;
  };

  const nodeRects = [...nodeMap.values()].map(flowNodeRect);

  const edges: FlowEdgeGeometry[] = [];
  const labels: FlowRect[] = [];

  section.edges.forEach((edge, edgeIndex) => {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);
    if (!source || !target) return;
    const branch = rotateFlowEdgeLabel(edge, lang, t);
    const sourceBottom = source.y + source.height / 2;
    const targetTop = target.y - target.height / 2;
    const sx = sourcePort(source, edgeIndex);
    const tx = targetPort(target, edgeIndex);
    let side: FlowEdgeGeometry['side'] = 'center';

    if (edge.back) {
      const loop = loopByEdge.get(edgeIndex)!;
      const sourceRowIndex = rowIndex.get(source.node.row)!;
      const gapAfter = gapTracks.get(`${gapAfterIndex(sourceRowIndex)}:${edgeIndex}:after`)!;
      const targetRowIndex = rowIndex.get(target.node.row)!;
      const approach = gapTracks.get(`${targetRowIndex - 1}:${edgeIndex}:before`)!;
      const points = [
        { x: sx, y: sourceBottom },
        { x: sx, y: gapAfter },
        { x: loop.channelX, y: gapAfter },
        { x: loop.channelX, y: approach },
        { x: tx, y: approach },
        { x: tx, y: targetTop },
      ];
      const segments = edgeSegments(points);
      edges.push({
        edge,
        path: segmentsToPath(segments),
        segments,
        label: null,
        branch,
        side: loop.side,
        marker: true,
      });
      return;
    }

    let points: FlowPoint[] = [];
    if (source.node.row === target.node.row) {
      const sourceRect = flowNodeRect(source);
      const targetRect = flowNodeRect(target);
      const sourceEdge = target.x > source.x ? sourceRect.right : sourceRect.left;
      const targetEdge = target.x > source.x ? targetRect.left : targetRect.right;
      const blocked = [...nodeMap.values()].some((node) => {
        if (node.node.id === source.node.id || node.node.id === target.node.id) return false;
        if (node.node.row !== source.node.row) return false;
        const rect = flowNodeRect(node);
        return target.x > source.x
          ? rect.right > sourceEdge && rect.left < targetEdge
          : rect.left < sourceEdge && rect.right > targetEdge;
      });
      if (!blocked) {
        points = [
          { x: sourceEdge, y: source.y },
          { x: targetEdge, y: target.y },
        ];
        side = target.x > source.x ? 'right' : 'left';
      } else {
        const gapY = gapTracks.get(`${gapAfterIndex(rowIndex.get(source.node.row)!)}:${edgeIndex}:after`)!;
        points = [
          { x: sx, y: sourceBottom },
          { x: sx, y: gapY },
          { x: tx, y: gapY },
          { x: tx, y: target.y + target.height / 2 },
        ];
        side = target.x > source.x ? 'right' : 'left';
      }
    } else {
      const sourceRowIndex = rowIndex.get(source.node.row)!;
      const targetRowIndex = rowIndex.get(target.node.row)!;
      if (targetRowIndex === sourceRowIndex + 1) {
        const gapY = gapTracks.get(`${gapAfterIndex(sourceRowIndex)}:${edgeIndex}:after`)!;
        points = [
          { x: sx, y: sourceBottom },
          { x: sx, y: gapY },
          { x: tx, y: gapY },
          { x: tx, y: targetTop },
        ];
        side = target.x > source.x ? 'right' : 'left';
      } else {
        const corridor = corridorX(source, target);
        const gapAfter = gapTracks.get(`${gapAfterIndex(sourceRowIndex)}:${edgeIndex}:after`)!;
        const gapBefore = gapTracks.get(`${targetRowIndex - 1}:${edgeIndex}:before`)!;
        points = [
          { x: sx, y: sourceBottom },
          { x: sx, y: gapAfter },
          { x: corridor, y: gapAfter },
          { x: corridor, y: gapBefore },
          { x: tx, y: gapBefore },
          { x: tx, y: targetTop },
        ];
        side = target.x > source.x ? 'right' : 'left';
      }
    }

    const segments = edgeSegments(points);
    const label = placeEdgeLabel(
      branch,
      segments,
      source,
      target,
      labels,
      nodeRects,
      graphWidth,
      graphHeight,
    );
    if (label) labels.push(label.box);
    edges.push({ edge, path: segmentsToPath(segments), segments, label, branch, side, marker: true });
  });

  // Loop badges are placed at the outside bend after each loop leaves its
  // source row. The full wording lives in a numbered legend under the graph.
  const loops: FlowLoopLegendItem[] = loopList.map((item) => {
    const geometry = edges.find((edge) => edge.edge === item.edge);
    const channelRun = geometry?.segments[2];
    const badgeY = channelRun
      ? (Math.min(channelRun.y1, channelRun.y2) + Math.max(channelRun.y1, channelRun.y2)) / 2
      : rowBottoms.get(item.source.node.row)! + FLOW_LAYOUT.rowGap / 2;
    return {
      number: item.number,
      text: item.text,
      side: item.side,
      badgeX: item.channelX,
      badgeY,
    };
  });

  return { nodes: nodeMap, edges, loops, width: graphWidth, height: graphHeight };
}
