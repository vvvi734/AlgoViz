import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type {
  AlgorithmFlow,
  FlowEdge,
  FlowNode,
  FlowNodeKind,
  FlowSection,
} from '../../domain/guides/flowTypes';
import { plainFlowLabel, plainFlowSummary } from '../../domain/guides/flowPlainLanguage';
import '../../styles/algorithm-flow.css';

const NODE_WIDTH = 168;
const NODE_GAP = 16;
const ROW_GAP = 24;
const GRAPH_PAD_TOP = 9;
const GRAPH_PAD_X = 11;
const LOOP_CHANNEL_GAP = 10;
const NODE_LINE = 17;
const DETAIL_LINE = 16;
const NODE_FONT = 13;

interface TextBlock {
  lines: string[];
  height: number;
}

interface NodeGeometry {
  node: FlowNode;
  x: number;
  y: number;
  width: number;
  height: number;
  label: TextBlock;
  detail?: TextBlock;
}

interface EdgeGeometry {
  edge: FlowEdge;
  path: string;
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' } | null;
  branch: string;
  side: 'left' | 'right' | 'center';
  marker: boolean;
}

interface SectionLayout {
  nodes: Map<string, NodeGeometry>;
  edges: EdgeGeometry[];
  width: number;
  height: number;
}

function characterUnits(value: string): number {
  let units = 0;
  for (const char of value) {
    if (char === ' ') units += 0.34;
    else if (/[\u2e80-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(char)) units += 1;
    else if (/[\u0000-\u007f]/.test(char)) units += 0.56;
    else units += 0.9;
  }
  return units;
}

function wrapText(value: string, maxUnits: number, lineHeight = NODE_LINE): TextBlock {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return { lines: [''], height: lineHeight };
  const lines: string[] = [];
  let line = '';
  let used = 0;

  const flush = () => {
    if (line.trim()) lines.push(line.trim());
    line = '';
    used = 0;
  };

  // Split at natural punctuation before falling back to per-character wrapping.
  // This keeps a long mixed token such as `ValueError：Dijkstra` from being cut
  // through the middle of either word.
  const rawTokens = normalized.includes(' ') ? (normalized.match(/\S+\s*/g) ?? [normalized]) : [normalized];
  const tokens = rawTokens.flatMap((token) => {
    const source = String(token);
    return source.match(/[^，。！？；：、]+[，。！？；：、]?/g) ?? [source];
  });
  const closingPunctuation = '，。！？；：、）】》”’';
  const openingPunctuation = '（【《“‘';

  for (const token of tokens) {
    const tokenText = String(token);
    const tokenUnits = characterUnits(tokenText);
    if (used + tokenUnits <= maxUnits) {
      line += tokenText;
      used += tokenUnits;
      continue;
    }
    if (line.trim()) flush();
    if (tokenUnits <= maxUnits) {
      line = tokenText.trimStart();
      used = characterUnits(line);
      continue;
    }
    // A long unbroken token is split by character rather than shrunk: text may
    // never disappear under a clip path. Closing punctuation stays on the
    // previous line, and opening punctuation moves to the next line, so a
    // question mark never ends up alone on a line of its own.
    for (const char of tokenText) {
      const unit = characterUnits(char);
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
          used -= characterUnits(last);
        }
        flush();
        line = carry;
        used = characterUnits(carry);
      }
      line += char;
      used += unit;
    }
  }
  flush();
  return { lines: lines.length > 0 ? lines : [''], height: Math.max(1, lines.length) * lineHeight };
}

function nodeWidth(kind: FlowNodeKind): number {
  if (kind === 'decision') return 164;
  if (kind === 'start' || kind === 'end') return 164;
  return NODE_WIDTH;
}

function nodeMaxUnits(node: FlowNode, width: number): number {
  const usable = width - 24;
  if (node.kind === 'decision') return Math.max(7, Math.floor((usable * 0.9) / NODE_FONT));
  return Math.max(8, Math.floor(usable / NODE_FONT));
}

function nodeLabel(node: FlowNode, lang: 'zh' | 'en'): string {
  return plainFlowLabel(node.label.zh, node.label.en, lang);
}

function nodeBlocks(node: FlowNode, lang: 'zh' | 'en', detail: boolean): TextBlock {
  const width = nodeWidth(node.kind);
  const maxUnits = nodeMaxUnits(node, width);
  const value = detail ? node.detail?.[lang] ?? '' : nodeLabel(node, lang);
  return wrapText(value, maxUnits, detail ? DETAIL_LINE : NODE_LINE);
}

function nodeHeight(node: FlowNode, lang: 'zh' | 'en'): number {
  const label = nodeBlocks(node, lang, false);
  const detail = node.detail ? nodeBlocks(node, lang, true) : null;
  if (node.kind === 'decision') {
    return Math.max(60, label.height + 20 + (detail?.height ?? 0));
  }
  if (node.kind === 'start' || node.kind === 'end') {
    return Math.max(32, label.height + 10 + (detail?.height ?? 0));
  }
  return Math.max(38, label.height + 10 + (detail ? 3 + detail.height : 0));
}

function rotateLabel(edge: FlowEdge, lang: 'zh' | 'en', t: (key: string) => string): string {
  if (edge.label) return plainFlowLabel(edge.label.zh, edge.label.en, lang);
  if (edge.kind === 'yes') return t('flowYes');
  if (edge.kind === 'no') return t('flowNo');
  if (edge.back) return t('flowLoopBack');
  if (edge.kind === 'return') return t('flowReturn');
  if (edge.kind === 'call') return t('flowCall');
  return '';
}

function edgeTone(edge: FlowEdge): string {
  if (edge.back) return 'loop';
  if (edge.kind === 'yes') return 'yes';
  if (edge.kind === 'no') return 'no';
  if (edge.kind === 'call') return 'call';
  if (edge.kind === 'return') return 'return';
  return 'next';
}

function layoutSection(
  section: FlowSection,
  lang: 'zh' | 'en',
  t: (key: string) => string,
): SectionLayout {
  const lanes = [...new Set(section.nodes.map((node) => node.lane))].sort((a, b) => a - b);
  const rows = [...new Set(section.nodes.map((node) => node.row))].sort((a, b) => a - b);
  const loops = section.edges.filter((edge) => edge.back);
  const leftLoops = loops.filter((edge) => {
    const node = section.nodes.find((item) => item.id === edge.from);
    return node?.lane !== 1;
  });
  const rightLoops = loops.filter((edge) => !leftLoops.includes(edge));

  // Loop labels sit in a dedicated gutter so they cannot be covered by the
  // node column. The gutter follows the current language and label length.
  const labelWidth = (edge: FlowEdge) => characterUnits(rotateLabel(edge, lang, t)) * NODE_FONT;
  const leftGutter = Math.max(
    GRAPH_PAD_X,
    ...leftLoops.map((edge) => GRAPH_PAD_X + 6 + labelWidth(edge) + 10),
  );
  const rightGutter = Math.max(
    GRAPH_PAD_X,
    ...rightLoops.map((edge) => GRAPH_PAD_X + 6 + labelWidth(edge) + 10),
  );
  const laneCenters = new Map<number, number>();
  const contentWidth =
    lanes.length * NODE_WIDTH + Math.max(0, lanes.length - 1) * NODE_GAP;
  const graphWidth = leftGutter + contentWidth + rightGutter;

  for (const [index, lane] of lanes.entries()) {
    laneCenters.set(
      lane,
      leftGutter + NODE_WIDTH / 2 + index * (NODE_WIDTH + NODE_GAP),
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
    rowHeights.set(
      row,
      Math.max(48, ...(rowNodes.get(row) ?? []).map((node) => nodeHeight(node, lang))),
    );
  }

  const rowTops = new Map<number, number>();
  const rowCenters = new Map<number, number>();
  let cursor = GRAPH_PAD_TOP;
  for (const row of rows) {
    const height = rowHeights.get(row) ?? 48;
    rowTops.set(row, cursor);
    rowCenters.set(row, cursor + height / 2);
    cursor += height + ROW_GAP;
  }

  const nodeMap = new Map<string, NodeGeometry>();
  for (const node of section.nodes) {
    const width = nodeWidth(node.kind);
    const height = Math.max(
      node.kind === 'decision' || node.kind === 'start' || node.kind === 'end' ? 32 : 38,
      nodeHeight(node, lang),
    );
    const label = nodeBlocks(node, lang, false);
    const detail = node.detail ? nodeBlocks(node, lang, true) : undefined;
    const centerY = rowCenters.get(node.row) ?? GRAPH_PAD_TOP + height / 2;
    nodeMap.set(node.id, {
      node,
      x: laneCenters.get(node.lane) ?? leftGutter + NODE_WIDTH / 2,
      y: centerY,
      width,
      height,
      label,
      detail,
    });
  }

  let leftChannel = 0;
  let rightChannel = 0;
  const loopIndexes = new Map<string, number>();
  for (const edge of loops) {
    const source = nodeMap.get(edge.from);
    const side = source && source.node.lane === 1 ? 'right' : 'left';
    const index = side === 'right' ? rightChannel++ : leftChannel++;
    loopIndexes.set(`${edge.from}->${edge.to}`, index);
  }

  // Labels for several loops that end at the same node are staggered in the
  // free row gap; they remain outside the node itself and are never clipped.
  const loopLabelOrder = new Map<string, number>();
  const edges: EdgeGeometry[] = [];

  for (const edge of section.edges) {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);
    if (!source || !target) continue;
    const branch = rotateLabel(edge, lang, t);
    let path = '';
    let label: EdgeGeometry['label'] = null;
    let side: EdgeGeometry['side'] = 'center';

    if (edge.back) {
      side = source.node.lane === 1 ? 'right' : 'left';
      const index = loopIndexes.get(`${edge.from}->${edge.to}`) ?? 0;
      const channelX =
        side === 'right'
          ? graphWidth - GRAPH_PAD_X - index * (LOOP_CHANNEL_GAP - 2)
          : GRAPH_PAD_X + index * (LOOP_CHANNEL_GAP - 2);
      const targetTop = target.y - target.height / 2;
      const approachY = targetTop - 14;
      const sx = side === 'right' ? source.x + source.width / 2 : source.x - source.width / 2;
      path = `M ${sx} ${source.y} L ${channelX} ${source.y} L ${channelX} ${approachY} L ${target.x} ${approachY} L ${target.x} ${targetTop}`;
      const key = `${edge.to}:${side}`;
      const order = loopLabelOrder.get(key) ?? 0;
      loopLabelOrder.set(key, order + 1);
      label = {
        x: side === 'right' ? graphWidth - GRAPH_PAD_X - 6 : GRAPH_PAD_X + 6,
        y: approachY - 8 - order * 14,
        anchor: side === 'right' ? 'end' : 'start',
      };
    } else if (edge.from === edge.to) {
      path = '';
    } else if (target.node.row === source.node.row) {
      side = target.x > source.x ? 'right' : 'left';
      const sx = target.x > source.x ? source.x + source.width / 2 : source.x - source.width / 2;
      const tx = target.x > source.x ? target.x - target.width / 2 : target.x + target.width / 2;
      path = `M ${sx} ${source.y} L ${tx} ${target.y}`;
      if (branch) {
        label = {
          x: (sx + tx) / 2,
          y: source.y - 12,
          anchor: 'middle',
        };
      }
    } else {
      const sourceBottom = source.y + source.height / 2;
      const targetTop = target.y - target.height / 2;
      if (Math.abs(source.x - target.x) < 1) {
        path = `M ${source.x} ${sourceBottom} L ${target.x} ${targetTop}`;
        if (branch) {
          label = { x: source.x + 9, y: (sourceBottom + targetTop) / 2 + 6, anchor: 'start' };
        }
      } else {
        const midY = (sourceBottom + targetTop) / 2;
        path = `M ${source.x} ${sourceBottom} L ${source.x} ${midY} L ${target.x} ${midY} L ${target.x} ${targetTop}`;
        side = target.x > source.x ? 'right' : 'left';
        if (branch) {
          label = { x: (source.x + target.x) / 2, y: midY - 8, anchor: 'middle' };
        }
      }
    }

    if (!path) continue;
    edges.push({
      edge,
      path,
      label,
      branch,
      side,
      marker: true,
    });
  }

  // A single compact row at the bottom keeps the lowest loop channel from
  // touching the paragraph below the SVG.
  const height = cursor - ROW_GAP + 10;

  return { nodes: nodeMap, edges, width: graphWidth, height };
}

function shapeFor(node: NodeGeometry): string {
  if (node.node.kind === 'decision') {
    const { x, y, width, height } = node;
    return `M ${x} ${y - height / 2} L ${x + width / 2} ${y} L ${x} ${y + height / 2} L ${x - width / 2} ${y} Z`;
  }
  return `M ${node.x - node.width / 2 + 12} ${node.y - node.height / 2} H ${node.x + node.width / 2 - 12} Q ${node.x + node.width / 2} ${node.y - node.height / 2} ${node.x + node.width / 2} ${node.y - node.height / 2 + 12} V ${node.y + node.height / 2 - 12} Q ${node.x + node.width / 2} ${node.y + node.height / 2} ${node.x + node.width / 2 - 12} ${node.y + node.height / 2} H ${node.x - node.width / 2 + 12} Q ${node.x - node.width / 2} ${node.y + node.height / 2} ${node.x - node.width / 2} ${node.y + node.height / 2 - 12} V ${node.y - node.height / 2 + 12} Q ${node.x - node.width / 2} ${node.y - node.height / 2} ${node.x - node.width / 2 + 12} ${node.y - node.height / 2} Z`;
}

function textX(node: NodeGeometry): number {
  return node.x;
}

function labelY(node: NodeGeometry): number {
  const detailHeight = node.detail?.height ?? 0;
  const total = node.label.height + (node.detail ? 6 + detailHeight : 0);
  const top = node.y - total / 2 + NODE_LINE / 2;
  // SVG text boxes include the font ascent above the baseline. Nodes with a
  // detail line need a small optical shift so the first line does not touch the
  // top border when the label + detail block is vertically centered.
  return top + (node.detail ? 4 : 0);
}

function nodeTextLines(node: NodeGeometry) {
  const lines = node.label.lines;
  const detail = node.detail?.lines ?? [];
  const y0 = labelY(node);
  return { lines, detail, y0 };
}

function NodeGlyph({
  geometry,
  lang,
}: {
  geometry: NodeGeometry;
  lang: 'zh' | 'en';
}) {
  const { node } = geometry;
  const { lines, detail, y0 } = nodeTextLines(geometry);
  const kindClass = `flow-node flow-node--${node.kind}${node.tone ? ` is-${node.tone}` : ''}`;
  return (
    <g
      className={kindClass}
      data-node-id={node.id}
      data-node-kind={node.kind}
      aria-label={nodeLabel(node, lang)}
      role="img"
    >
      <path className="flow-node-shape" d={shapeFor(geometry)} />
      {node.kind === 'subflow' ? (
        <path
          className="flow-subflow-inner"
          d={`M ${geometry.x - geometry.width / 2 + 10} ${geometry.y - geometry.height / 2 + 8} H ${geometry.x + geometry.width / 2 - 10}`}
        />
      ) : null}
      {node.kind === 'call' ? (
        <path
          className="flow-call-mark"
          d={`M ${geometry.x - geometry.width / 2 + 14} ${geometry.y - geometry.height / 2 + 12} V ${geometry.y + geometry.height / 2 - 12}`}
        />
      ) : null}
      {node.kind === 'subreturn' ? (
        <path
          className="flow-return-mark"
          d={`M ${geometry.x - geometry.width / 2 + 14} ${geometry.y + geometry.height / 2 - 12} V ${geometry.y - geometry.height / 2 + 12} M ${geometry.x - geometry.width / 2 + 14} ${geometry.y - geometry.height / 2 + 12} H ${geometry.x - geometry.width / 2 + 24}`}
        />
      ) : null}
      {lines.map((line, index) => (
        <text
          key={`${node.id}-label-${index}`}
          className="flow-node-label"
          x={textX(geometry)}
          y={y0 + index * NODE_LINE}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
      {detail.map((line, index) => (
        <text
          key={`${node.id}-detail-${index}`}
          className="flow-node-detail"
          x={textX(geometry)}
          y={y0 + lines.length * NODE_LINE + 6 + index * DETAIL_LINE}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function EdgeGlyph({
  geometry,
  markerId,
}: {
  geometry: EdgeGeometry;
  markerId: string;
}) {
  return (
    <g className={`flow-edge flow-edge--${edgeTone(geometry.edge)}`} data-edge-from={geometry.edge.from} data-edge-to={geometry.edge.to}>
      <path className="flow-edge-path" d={geometry.path} markerEnd={`url(#${markerId})`} />
      {geometry.label ? (
        <text
          className="flow-edge-label"
          x={geometry.label.x}
          y={geometry.label.y}
          textAnchor={geometry.label.anchor}
        >
          {geometry.branch}
        </text>
      ) : null}
    </g>
  );
}

function mobileOrder(section: FlowSection): FlowNode[] {
  const toneRank: Record<string, number> = { success: 0, neutral: 1, failure: 2 };
  return [...section.nodes].sort((a, b) => {
    if (a.kind === 'end' && b.kind !== 'end') return 1;
    if (b.kind === 'end' && a.kind !== 'end') return -1;
    if (a.kind === 'end' && b.kind === 'end') {
      const tone = (toneRank[a.tone ?? 'neutral'] ?? 1) - (toneRank[b.tone ?? 'neutral'] ?? 1);
      if (tone !== 0) return tone;
      return b.row - a.row || a.lane - b.lane;
    }
    return a.row - b.row || a.lane - b.lane;
  });
}

function MobileFlow({
  section,
  lang,
  t,
}: {
  section: FlowSection;
  lang: 'zh' | 'en';
  t: (key: string) => string;
}) {
  const mobileNodes = mobileOrder(section);
  const nodeMap = new Map(section.nodes.map((node) => [node.id, node]));
  const edgesByNode = new Map<string, FlowEdge[]>();
  for (const edge of section.edges) {
    const bucket = edgesByNode.get(edge.from) ?? [];
    bucket.push(edge);
    edgesByNode.set(edge.from, bucket);
  }

  return (
    <div className="algorithm-flow-mobile">
      <ol className="algorithm-flow-mobile-list" aria-label={section.title[lang]}>
        {mobileNodes.map((node, index) => {
          const outgoing = (edgesByNode.get(node.id) ?? []).filter(
            (edge) => edge.kind !== 'next' || edge.back,
          );
          const kindLabel = t(`flowKind${node.kind[0].toUpperCase()}${node.kind.slice(1)}`);
          return (
            <li
              key={node.id}
              className={`flow-mobile-node flow-mobile-node--${node.kind}`}
              data-node-id={node.id}
              data-node-kind={node.kind}
            >
              <span className="flow-mobile-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="flow-mobile-body">
                <div className="flow-mobile-title">
                  <span className="flow-mobile-kind">{kindLabel}</span>
                  <strong>{nodeLabel(node, lang)}</strong>
                </div>
                {node.detail ? <p className="flow-mobile-detail">{node.detail[lang]}</p> : null}
                {outgoing.length > 0 ? (
                  <ul className="flow-mobile-branches">
                    {outgoing.map((edge) => {
                      const target = nodeMap.get(edge.to);
                      const branch = rotateLabel(edge, lang, t);
                      return (
                        <li key={`${edge.from}-${edge.to}-${edge.kind}`} className={`flow-mobile-branch flow-mobile-branch--${edgeTone(edge)}`}>
                          {branch ? <span className="flow-mobile-branch-label">{branch}</span> : null}
                          <span>
                            {edge.back ? '↩ ' : '→ '}
                            {target ? nodeLabel(target, lang) : edge.to}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AlgorithmFlowView({
  flow,
  sectionId,
}: {
  flow: AlgorithmFlow;
  sectionId?: string;
}) {
  const { lang, t } = useI18n();
  const sections = useMemo(
    () => (sectionId ? flow.sections.filter((section) => section.id === sectionId) : flow.sections),
    [flow, sectionId],
  );

  const layouts = useMemo(
    () => sections.map((section) => layoutSection(section, lang, t)),
    [sections, lang, t],
  );

  return (
    <div className="algorithm-flow" data-testid="algorithm-flow" data-algorithm-id={flow.algorithmId}>
      <p className="algorithm-flow-legend">{t('flowLegend')}</p>
      {sections.map((section, index) => {
        const markerId = `flow-arrow-${flow.algorithmId}-${section.id}`;
        return (
          <section
            key={section.id}
            className="algorithm-flow-section"
            data-testid={`algorithm-flow-section-${section.id}`}
            aria-labelledby={`flow-section-title-${flow.algorithmId}-${section.id}`}
          >
            <header className="algorithm-flow-section-head">
              <h4 id={`flow-section-title-${flow.algorithmId}-${section.id}`}>{section.title[lang]}</h4>
              {section.summary ? (
                <p>{plainFlowSummary(section.summary.zh, section.summary.en, lang)}</p>
              ) : null}
            </header>
            <div className="algorithm-flow-desktop">
              <svg
                className="algorithm-flow-svg"
                data-svg-text-floor="off"
                width={layouts[index].width}
                height={layouts[index].height}
                viewBox={`0 0 ${layouts[index].width} ${layouts[index].height}`}
                role="img"
                aria-label={section.title[lang]}
              >
                <defs>
                  <marker
                    id={markerId}
                    markerWidth="7"
                    markerHeight="7"
                    refX="6"
                    refY="3.5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path className="flow-arrow-head" d="M0,0 L7,3.5 L0,7 Z" />
                  </marker>
                </defs>
                <title>{section.title[lang]}</title>
                {layouts[index].edges.map((edge) => (
                  <EdgeGlyph
                    key={`${edge.edge.from}-${edge.edge.to}-${edge.edge.kind}`}
                    geometry={edge}
                    markerId={markerId}
                  />
                ))}
                {[...layouts[index].nodes.values()].map((node) => (
                  <NodeGlyph key={node.node.id} geometry={node} lang={lang} />
                ))}
              </svg>
            </div>
            <MobileFlow section={section} lang={lang} t={t} />
          </section>
        );
      })}
    </div>
  );
}