import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { AlgorithmFlow, FlowEdge, FlowNode, FlowSection } from '../../domain/guides/flowTypes';
import { plainFlowSummary } from '../../domain/guides/flowPlainLanguage';
import {
  FLOW_LAYOUT,
  flowNodeLabel,
  layoutFlowSection,
  rotateFlowEdgeLabel,
  type FlowEdgeGeometry,
  type FlowLoopLegendItem,
  type FlowNodeGeometry,
} from './flowLayout';
import '../../styles/algorithm-flow.css';

function edgeTone(edge: FlowEdge): string {
  if (edge.back) return 'loop';
  if (edge.kind === 'yes') return 'yes';
  if (edge.kind === 'no') return 'no';
  if (edge.kind === 'call') return 'call';
  if (edge.kind === 'return') return 'return';
  return 'next';
}

function shapeFor(node: FlowNodeGeometry): string {
  if (node.node.kind === 'decision') {
    const inset = 18;
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;
    return `M ${left + inset} ${top} L ${right - inset} ${top} L ${right} ${node.y} L ${right - inset} ${bottom} L ${left + inset} ${bottom} L ${left} ${node.y} Z`;
  }
  const left = node.x - node.width / 2;
  const right = node.x + node.width / 2;
  const top = node.y - node.height / 2;
  const bottom = node.y + node.height / 2;
  return `M ${left + 12} ${top} H ${right - 12} Q ${right} ${top} ${right} ${top + 12} V ${bottom - 12} Q ${right} ${bottom} ${right - 12} ${bottom} H ${left + 12} Q ${left} ${bottom} ${left} ${bottom - 12} V ${top + 12} Q ${left} ${top} ${left + 12} ${top} Z`;
}

function labelY(node: FlowNodeGeometry): number {
  const detailHeight = node.detail?.height ?? 0;
  const total = node.label.height + (node.detail ? 6 + detailHeight : 0);
  return node.y - total / 2 + FLOW_LAYOUT.nodeLine / 2 + 4;
}

function NodeGlyph({ geometry, lang }: { geometry: FlowNodeGeometry; lang: 'zh' | 'en' }) {
  const { node } = geometry;
  const y0 = labelY(geometry);
  const kindClass = `flow-node flow-node--${node.kind}${node.tone ? ` is-${node.tone}` : ''}`;
  return (
    <g
      className={kindClass}
      data-node-id={node.id}
      data-node-kind={node.kind}
      aria-label={flowNodeLabel(node, lang)}
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
      {geometry.label.lines.map((line, index) => (
        <text
          key={`${node.id}-label-${index}`}
          className="flow-node-label"
          x={geometry.x}
          y={y0 + index * FLOW_LAYOUT.nodeLine}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
      {(geometry.detail?.lines ?? []).map((line, index) => (
        <text
          key={`${node.id}-detail-${index}`}
          className="flow-node-detail"
          x={geometry.x}
          y={y0 + geometry.label.lines.length * FLOW_LAYOUT.nodeLine + 6 + index * FLOW_LAYOUT.detailLine}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function EdgeGlyph({ geometry, markerId }: { geometry: FlowEdgeGeometry; markerId: string }) {
  return (
    <g
      className={`flow-edge flow-edge--${edgeTone(geometry.edge)}`}
      data-edge-from={geometry.edge.from}
      data-edge-to={geometry.edge.to}
    >
      <path className="flow-edge-path" d={geometry.path} markerEnd={`url(#${markerId})`} />
      {geometry.label ? (
        <g className="flow-edge-label-group">
          <rect
            className="flow-edge-label-box"
            x={geometry.label.box.left}
            y={geometry.label.box.top}
            width={geometry.label.box.width}
            height={geometry.label.box.height}
            rx={4}
          />
          <text
            className="flow-edge-label"
            x={geometry.label.box.left + geometry.label.box.width / 2}
            y={geometry.label.box.top + FLOW_LAYOUT.edgeLabelHeight / 2 + 4.2}
            textAnchor="middle"
          >
            {geometry.label.text}
          </text>
        </g>
      ) : null}
    </g>
  );
}

function LoopBadge({ item }: { item: FlowLoopLegendItem }) {
  return (
    <g className="flow-loop-badge" aria-label={item.text}>
      <title>{item.text}</title>
      <circle cx={item.badgeX} cy={item.badgeY} r={9} />
      <text x={item.badgeX} y={item.badgeY + 3.8} textAnchor="middle">
        {item.number}
      </text>
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
                  <strong>{flowNodeLabel(node, lang)}</strong>
                </div>
                {node.detail ? <p className="flow-mobile-detail">{node.detail[lang]}</p> : null}
                {outgoing.length > 0 ? (
                  <ul className="flow-mobile-branches">
                    {outgoing.map((edge) => {
                      const target = nodeMap.get(edge.to);
                      const branch = rotateFlowEdgeLabel(edge, lang, t);
                      return (
                        <li
                          key={`${edge.from}-${edge.to}-${edge.kind}`}
                          className={`flow-mobile-branch flow-mobile-branch--${edgeTone(edge)}`}
                        >
                          {branch ? <span className="flow-mobile-branch-label">{branch}</span> : null}
                          <span>
                            {edge.back ? '↩ ' : '→ '}
                            {target ? flowNodeLabel(target, lang) : edge.to}
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
    () => sections.map((section) => layoutFlowSection(section, lang, t)),
    [sections, lang, t],
  );

  return (
    <div className="algorithm-flow" data-testid="algorithm-flow" data-algorithm-id={flow.algorithmId}>
      <p className="algorithm-flow-legend">{t('flowLegend')}</p>
      {sections.map((section, index) => {
        const markerId = `flow-arrow-${flow.algorithmId}-${section.id}`;
        const layout = layouts[index];
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
              <div className="algorithm-flow-frame">
                <svg
                  className="algorithm-flow-svg"
                  data-svg-text-floor="off"
                  width={layout.width}
                  height={layout.height}
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
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
                  {layout.edges.map((edge, edgeIndex) => (
                    <EdgeGlyph
                      key={`${edge.edge.from}-${edge.edge.to}-${edge.edge.kind}-${edgeIndex}`}
                      geometry={edge}
                      markerId={markerId}
                    />
                  ))}
                  {layout.loops.map((item) => (
                    <LoopBadge key={`loop-${item.number}`} item={item} />
                  ))}
                  {[...layout.nodes.values()].map((node) => (
                    <NodeGlyph key={node.node.id} geometry={node} lang={lang} />
                  ))}
                </svg>
                {layout.loops.length > 0 ? (
                  <ol className="flow-loop-legend" data-testid="flow-loop-legend">
                    {layout.loops.map((item) => (
                      <li key={`loop-legend-${item.number}`}>
                        <span className="flow-loop-legend-index">{item.number}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </div>
            <MobileFlow section={section} lang={lang} t={t} />
          </section>
        );
      })}
    </div>
  );
}
