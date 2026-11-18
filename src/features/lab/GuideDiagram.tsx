import type { GuideDiagramKind } from '../../domain/guides/types';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * A small, static intuition sketch for the three curated guides. It is
 * deliberately not interactive: the real animation lives in the single
 * VisualStage below, and the guide must not create a second player.
 */
export function GuideDiagram({ kind }: { kind?: GuideDiagramKind }) {
  const { t } = useI18n();
  if (!kind) return null;

  const captions: Record<GuideDiagramKind, string> = {
    dijkstra: t('guideDijkstraDiagram'),
    kahn: t('guideKahnDiagram'),
    kosaraju: t('guideKosarajuDiagram'),
  };

  return (
    <figure className="guide-figure" data-testid={`guide-diagram-${kind}`}>
      {kind === 'dijkstra' ? <DijkstraDiagram /> : null}
      {kind === 'kahn' ? <KahnDiagram /> : null}
      {kind === 'kosaraju' ? <KosarajuDiagram /> : null}
      <figcaption>{captions[kind]}</figcaption>
    </figure>
  );
}

function DijkstraDiagram() {
  const nodes = [
    { id: 'S', x: 36, y: 76, label: '0', className: 'is-source' },
    { id: 'A', x: 126, y: 38, label: '2' },
    { id: 'B', x: 126, y: 116, label: '3' },
    { id: 'C', x: 222, y: 38, label: '4' },
    { id: 'D', x: 222, y: 116, label: '10' },
    { id: 'T', x: 316, y: 76, label: '7', className: 'is-target' },
  ];
  return (
    <svg className="guide-svg" viewBox="0 0 352 170" aria-hidden="true">
      <defs>
        <marker id="guide-arrow-d" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="guide-svg-arrow" />
        </marker>
      </defs>
      {[
        ['S', 'A', 2, true], ['S', 'B', 5, false], ['A', 'B', 1, true],
        ['A', 'C', 4, true], ['B', 'C', 1, true], ['B', 'D', 7, false],
        ['C', 'T', 3, true], ['D', 'T', 1, false],
      ].map(([from, to, weight, active]) => {
        const a = nodes.find((node) => node.id === from)!;
        const b = nodes.find((node) => node.id === to)!;
        return (
          <g key={`${from}-${to}`} className={active ? 'guide-svg-edge is-active' : 'guide-svg-edge'}>
            <line
              x1={a.x + 18}
              y1={a.y}
              x2={b.x - 23}
              y2={b.y}
              markerEnd="url(#guide-arrow-d)"
            />
            <text x={(a.x + b.x) / 2 + 8} y={(a.y + b.y) / 2 - 7}>{weight}</text>
          </g>
        );
      })}
      {nodes.map((node) => (
        <g key={node.id} className={`guide-svg-node ${node.className ?? ''}`}>
          <circle cx={node.x} cy={node.y} r="18" />
          <text x={node.x} y={node.y + 1} className="guide-svg-node-name">{node.id}</text>
          <text x={node.x} y={node.y + 31} className="guide-svg-dist">{node.label}</text>
        </g>
      ))}
      <text x="12" y="158" className="guide-svg-note">距离表 · 最小堆 · 松弛</text>
    </svg>
  );
}

function KahnDiagram() {
  const nodes = [
    { id: 'A', x: 48, y: 42, indegree: '0', active: true },
    { id: 'B', x: 48, y: 108, indegree: '0', active: true },
    { id: 'C', x: 158, y: 75, indegree: '2', active: false },
    { id: 'D', x: 260, y: 75, indegree: '1', active: false },
  ];
  return (
    <svg className="guide-svg" viewBox="0 0 352 170" aria-hidden="true">
      <defs>
        <marker id="guide-arrow-k" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="guide-svg-arrow" />
        </marker>
      </defs>
      {[
        ['A', 'C'], ['B', 'C'], ['C', 'D'],
      ].map(([from, to]) => {
        const a = nodes.find((node) => node.id === from)!;
        const b = nodes.find((node) => node.id === to)!;
        return (
          <line
            key={`${from}-${to}`}
            className="guide-svg-edge is-active"
            x1={a.x + 20}
            y1={a.y}
            x2={b.x - 25}
            y2={b.y}
            markerEnd="url(#guide-arrow-k)"
          />
        );
      })}
      {nodes.map((node) => (
        <g key={node.id} className={`guide-svg-node${node.active ? ' is-source' : ''}`}>
          <circle cx={node.x} cy={node.y} r="19" />
          <text x={node.x} y={node.y + 1} className="guide-svg-node-name">{node.id}</text>
          <text x={node.x} y={node.y + 32} className="guide-svg-dist">入度 {node.indegree}</text>
        </g>
      ))}
      <g className="guide-svg-queue">
        <rect x="18" y="132" width="172" height="24" rx="12" />
        <text x="30" y="148">零入度队列 [A, B]</text>
      </g>
      <text x="222" y="148" className="guide-svg-note">出队 → 删边 → 减入度</text>
    </svg>
  );
}

function KosarajuDiagram() {
  return (
    <svg className="guide-svg" viewBox="0 0 352 170" aria-hidden="true">
      <defs>
        <marker id="guide-arrow-s" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="guide-svg-arrow" />
        </marker>
      </defs>
      <text x="16" y="20" className="guide-svg-label">原图 · 第一遍 DFS</text>
      <g className="guide-svg-cycle">
        <circle cx="58" cy="58" r="17" />
        <circle cx="124" cy="58" r="17" />
        <circle cx="91" cy="112" r="17" />
        <text x="58" y="59" className="guide-svg-node-name">A</text>
        <text x="124" y="59" className="guide-svg-node-name">B</text>
        <text x="91" y="113" className="guide-svg-node-name">C</text>
        <line x1="72" y1="50" x2="108" y2="50" className="guide-svg-edge is-active" markerEnd="url(#guide-arrow-s)" />
        <line x1="118" y1="72" x2="101" y2="96" className="guide-svg-edge is-active" markerEnd="url(#guide-arrow-s)" />
        <line x1="80" y1="98" x2="63" y2="75" className="guide-svg-edge is-active" markerEnd="url(#guide-arrow-s)" />
      </g>
      <circle cx="164" cy="112" r="15" className="guide-svg-single" />
      <text x="164" y="113" className="guide-svg-node-name">D</text>
      <line x1="106" y1="104" x2="145" y2="109" className="guide-svg-edge" markerEnd="url(#guide-arrow-s)" />
      <text x="16" y="147" className="guide-svg-note">完成顺序 D, C, B, A</text>

      <line x1="196" y1="12" x2="196" y2="152" className="guide-svg-divider" />
      <text x="210" y="20" className="guide-svg-label">转置图 · 按逆序收集</text>
      <g className="guide-svg-cycle is-transpose">
        <circle cx="234" cy="58" r="17" />
        <circle cx="300" cy="58" r="17" />
        <circle cx="267" cy="112" r="17" />
        <text x="234" y="59" className="guide-svg-node-name">A</text>
        <text x="300" y="59" className="guide-svg-node-name">B</text>
        <text x="267" y="113" className="guide-svg-node-name">C</text>
        <line x1="286" y1="49" x2="250" y2="49" className="guide-svg-edge is-active" markerEnd="url(#guide-arrow-s)" />
        <line x1="283" y1="98" x2="296" y2="73" className="guide-svg-edge is-active" markerEnd="url(#guide-arrow-s)" />
        <line x1="238" y1="75" x2="257" y2="96" className="guide-svg-edge is-active" markerEnd="url(#guide-arrow-s)" />
      </g>
      <text x="210" y="147" className="guide-svg-note">从 A 出发收齐一个 SCC</text>
    </svg>
  );
}
