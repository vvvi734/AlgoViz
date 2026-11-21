import type { Lang } from '../../i18n/types';
import type { ConceptDiagramKind } from '../../domain/concepts/types';

/**
 * TEXTBOOK-07 storage diagrams.
 *
 * All four views use the same tiny graph family: the matrix page highlights one
 * undirected edge in both symmetric cells; the adjacency-list page turns that
 * edge into two edge nodes; the orthogonal page follows one directed arc through
 * its out-chain and in-chain; the multilist page keeps one edge node for both
 * endpoint chains. Geometry and links are authored, not simulated.
 */
export function GraphStorageDiagram({
  kind,
  lang,
}: {
  kind: ConceptDiagramKind;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'graph-adjacency-matrix') {
    const positions = {
      A: { x: 95, y: 100 },
      B: { x: 235, y: 100 },
      C: { x: 235, y: 220 },
      D: { x: 95, y: 220 },
    } as const;
    const rows = [
      ['A', ['0', '1', '1', '0']],
      ['B', ['1', '0', '0', '1']],
      ['C', ['1', '0', '0', '1']],
      ['D', ['0', '1', '1', '0']],
    ] as const;
    const cell = 42;
    const matrixX = 492;
    const matrixY = 92;
    return (
      <svg className="concept-svg" viewBox="0 0 760 430" role="img" aria-label={L('无向图与邻接矩阵的对应关系', 'Undirected graph mapped to an adjacency matrix')}>
        <text className="diagram-label diagram-label-strong" x="40" y="34">
          {L('同一张无向图', 'One undirected graph')}
        </text>
        <line className="diagram-line" x1={positions.A.x} y1={positions.A.y} x2={positions.B.x} y2={positions.B.y} />
        <line className="diagram-line" x1={positions.A.x} y1={positions.A.y} x2={positions.C.x} y2={positions.C.y} />
        <line className="diagram-line diagram-cut" x1={positions.B.x} y1={positions.B.y} x2={positions.D.x} y2={positions.D.y} />
        <line className="diagram-line" x1={positions.C.x} y1={positions.C.y} x2={positions.D.x} y2={positions.D.y} />
        {Object.entries(positions).map(([label, point]) => (
          <g key={label}>
            <circle className="diagram-node-round" cx={point.x} cy={point.y} r="25" />
            <text className="diagram-node-text" x={point.x} y={point.y + 5} textAnchor="middle">{label}</text>
          </g>
        ))}
        <text className="diagram-cut-tag" x="160" y="171" textAnchor="middle">
          {L('边 B–D', 'edge B–D')}
        </text>
        <text className="diagram-note" x="165" y="318" textAnchor="middle">
          {L('无向边只算一条，但矩阵中对应两个对称单元', 'One undirected edge, two symmetric cells')}
        </text>

        <text className="diagram-label diagram-label-strong" x={matrixX + cell * 2} y="48" textAnchor="middle">
          {L('邻接矩阵 A', 'Adjacency matrix A')}
        </text>
        <text className="diagram-note" x={matrixX - 30} y={matrixY - 18} textAnchor="end">
          {L('行 = 起点 / 端点', 'row = origin / endpoint')}
        </text>
        <text className="diagram-note" x={matrixX + cell * 2} y={matrixY - 18} textAnchor="middle">
          {L('列 = 终点 / 端点', 'column = destination / endpoint')}
        </text>
        {['A', 'B', 'C', 'D'].map((label, index) => (
          <text
            key={`col-${label}`}
            className={`diagram-note${label === 'D' ? ' diagram-label-strong' : ''}`}
            x={matrixX + index * cell + cell / 2}
            y={matrixY + 4}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
        <rect className="diagram-row-band" x={matrixX} y={matrixY + cell + 8} width={cell * 4} height={cell} />
        <rect className="diagram-row-band" x={matrixX + cell * 3} y={matrixY + 8} width={cell} height={cell * 4} />
        {rows.map(([rowLabel, values], rowIndex) => (
          <g key={rowLabel}>
            <text
              className={`diagram-note${rowLabel === 'B' ? ' diagram-label-strong' : ''}`}
              x={matrixX - 12}
              y={matrixY + 8 + rowIndex * cell + cell / 2 + 5}
              textAnchor="end"
            >
              {rowLabel}
            </text>
            {values.map((value, cellIndex) => {
              const highlighted =
                (rowLabel === 'B' && cellIndex === 3) || (rowLabel === 'D' && cellIndex === 1);
              return (
                <g key={`${rowLabel}-${cellIndex}`}>
                  <rect
                    className={`diagram-cell${highlighted ? ' diagram-accent' : ''}`}
                    x={matrixX + cellIndex * cell}
                    y={matrixY + 8 + rowIndex * cell}
                    width={cell - 2}
                    height={cell - 2}
                    rx="3"
                  />
                  <text
                    className="diagram-label"
                    x={matrixX + cellIndex * cell + cell / 2 - 1}
                    y={matrixY + 8 + rowIndex * cell + cell / 2 + 5}
                    textAnchor="middle"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
        <text className="diagram-note" x={matrixX + cell * 2} y={matrixY + cell * 4 + 38} textAnchor="middle">
          {L('对称位置同时为 1：A[B][D] = A[D][B]', 'Both symmetric cells are 1: A[B][D] = A[D][B]')}
        </text>
        <text className="diagram-note" x={matrixX + cell * 2} y={matrixY + cell * 4 + 62} textAnchor="middle">
          {L('空间 n²；查边 O(1)；枚举邻居 O(n)', 'space n²; edge test O(1); neighbours O(n)')}
        </text>

        <rect className="diagram-band" x="40" y="370" width="680" height="36" rx="8" />
        <text className="diagram-label" x="380" y="393" textAnchor="middle">
          {L('行号与列号共同定位一条边；无向图沿主对角线对称', 'Row and column together locate an edge; an undirected matrix is symmetric')}
        </text>
      </svg>
    );
  }

  if (kind === 'graph-adjacency-list') {
    const graphNodes = {
      A: { x: 120, y: 85 },
      B: { x: 260, y: 55 },
      C: { x: 260, y: 135 },
      D: { x: 405, y: 95 },
    } as const;
    const vertices = ['A', 'B', 'C', 'D'] as const;
    const chains: Record<(typeof vertices)[number], readonly [string, string]> = {
      A: ['B', 'C'],
      B: ['A', 'D'],
      C: ['A', 'D'],
      D: ['B', 'C'],
    };
    const rowY = (index: number) => 245 + index * 66;
    return (
      <svg className="concept-svg" viewBox="0 0 760 540" role="img" aria-label={L('邻接表的顶点表与边链表', 'Adjacency list: vertex table and edge chains')}>
        <text className="diagram-label diagram-label-strong" x="40" y="28">
          {L('同一张无向图', 'The same undirected graph')}
        </text>
        <line className="diagram-line" x1={graphNodes.A.x} y1={graphNodes.A.y} x2={graphNodes.B.x} y2={graphNodes.B.y} />
        <line className="diagram-line" x1={graphNodes.A.x} y1={graphNodes.A.y} x2={graphNodes.C.x} y2={graphNodes.C.y} />
        <line className="diagram-line diagram-cut" x1={graphNodes.B.x} y1={graphNodes.B.y} x2={graphNodes.D.x} y2={graphNodes.D.y} />
        <line className="diagram-line" x1={graphNodes.C.x} y1={graphNodes.C.y} x2={graphNodes.D.x} y2={graphNodes.D.y} />
        {Object.entries(graphNodes).map(([label, point]) => (
          <g key={label}>
            <circle className="diagram-node-round" cx={point.x} cy={point.y} r="23" />
            <text className="diagram-node-text" x={point.x} y={point.y + 5} textAnchor="middle">{label}</text>
          </g>
        ))}
        <text className="diagram-cut-tag" x="334" y="82" textAnchor="middle">{L('B–D', 'B–D')}</text>

        <text className="diagram-label diagram-label-strong" x="52" y="222">{L('顶点表', 'vertex table')}</text>
        <text className="diagram-label diagram-label-strong" x="224" y="222">{L('边表（每格：adjvex | next）', 'edge chains (cell: adjvex | next)')}</text>
        <text className="diagram-note" x="730" y="222" textAnchor="end">
          {L('无向边 B–D → 两个边结点', 'B–D → two edge nodes')}
        </text>
        <defs>
          <marker id="gs-list-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="diagram-arrow" />
          </marker>
        </defs>
        {vertices.map((vertex, index) => {
          const y = rowY(index);
          return (
            <g key={vertex}>
              <rect className="diagram-chip" x="52" y={y} width="44" height="36" rx="5" />
              <text className="diagram-node-text" x="74" y={y + 24} textAnchor="middle">{vertex}</text>
              <circle className="diagram-pointer-dot" cx="100" cy={y + 18} r="3" />
              <line className="diagram-line" x1="103" y1={y + 18} x2="224" y2={y + 18} markerEnd="url(#gs-list-arrow)" />
              {chains[vertex].map((neighbor, edgeIndex) => {
                const x = 228 + edgeIndex * 132;
                const edgeId = `${vertex}${neighbor}`;
                return (
                  <g key={`${vertex}-${neighbor}`} data-edge-record={edgeId}>
                    <rect
                      className={`diagram-box${(vertex === 'B' && neighbor === 'D') || (vertex === 'D' && neighbor === 'B') ? ' diagram-accent' : ''}`}
                      x={x}
                      y={y}
                      width="112"
                      height="36"
                      rx="5"
                    />
                    <line className="diagram-divider" x1={x + 44} y1={y + 2} x2={x + 44} y2={y + 34} />
                    <text className="diagram-label" x={x + 22} y={y + 24} textAnchor="middle">{neighbor}</text>
                    <text className="diagram-note" x={x + 78} y={y + 24} textAnchor="middle">
                      {edgeIndex === 0 ? '●' : '∅'}
                    </text>
                    {edgeIndex === 0 && (
                      <line className="diagram-line" x1={x + 113} y1={y + 18} x2={x + 224} y2={y + 18} markerEnd="url(#gs-list-arrow)" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        <text className="diagram-note" x="52" y="474">
          {L('B 的边表：D 出现在 B 链中；D 的边表：B 又出现一次。同一条无向边被登记两次。', 'B’s chain contains D; D’s chain contains B again. The same undirected edge is recorded twice.')}
        </text>
        <text className="diagram-note" x="52" y="498">
          {L('n = 4，e = 4 → 4 个顶点表项 + 8 个边结点；空间 O(n + e)。', 'n = 4, e = 4 → 4 vertex entries + 8 edge nodes; space O(n + e).')}
        </text>
        <rect className="diagram-band" x="40" y="510" width="680" height="24" rx="6" />
        <text className="diagram-label" x="380" y="527" textAnchor="middle">
          {L('顶点表存“谁”，边表存“和谁相邻、下一条是谁”', 'vertex table says who; edge nodes say whom and what comes next')}
        </text>
      </svg>
    );
  }

  if (kind === 'graph-orthogonal-list') {
    const graphNodes = {
      A: { x: 105, y: 88 },
      B: { x: 265, y: 55 },
      C: { x: 265, y: 165 },
    } as const;
    const vertices = [
      ['A', 'e4', 'e1'],
      ['B', 'e1', 'e3'],
      ['C', 'e2', 'e4'],
    ] as const;
    const edges = [
      ['e1', 'A', 'B', 'e2', '—', 'A 出链 → B 入链'],
      ['e2', 'A', 'C', '—', 'e3', 'A 出链 → C 入链'],
      ['e3', 'B', 'C', '—', '—', 'B 出链 → C 入链'],
      ['e4', 'C', 'A', '—', '—', 'C 出链 → A 入链'],
    ] as const;
    return (
      <svg className="concept-svg" viewBox="0 0 760 545" role="img" aria-label={L('有向图的十字链表节点与入链出链', 'Orthogonal list nodes and in/out chains')}>
        <text className="diagram-label diagram-label-strong" x="40" y="30">{L('有向图', 'Directed graph')}</text>
        <line className="diagram-line diagram-directed" x1={graphNodes.A.x} y1={graphNodes.A.y} x2={graphNodes.B.x} y2={graphNodes.B.y} />
        <polygon className="diagram-arrow" points="237,69 226,71 230,80" />
        <text className="diagram-edge-tag" x="178" y="54">e1</text>
        <line className="diagram-line diagram-directed" x1={graphNodes.A.x} y1={graphNodes.A.y + 8} x2={graphNodes.C.x} y2={graphNodes.C.y} />
        <polygon className="diagram-arrow" points="247,157 234,158 238,147" />
        <text className="diagram-edge-tag" x="176" y="145">e2</text>
        <line className="diagram-line diagram-directed" x1={graphNodes.B.x} y1={graphNodes.B.y + 18} x2={graphNodes.C.x} y2={graphNodes.C.y - 14} />
        <polygon className="diagram-arrow" points="265,143 257,131 273,131" />
        <text className="diagram-edge-tag" x="236" y="111">e3</text>
        <line className="diagram-line diagram-directed" x1={graphNodes.C.x} y1={graphNodes.C.y - 12} x2={graphNodes.A.x} y2={graphNodes.A.y + 10} />
        <polygon className="diagram-arrow" points="130,105 144,104 140,114" />
        <text className="diagram-edge-tag" x="155" y="188">e4</text>
        {Object.entries(graphNodes).map(([label, point]) => (
          <g key={label}>
            <circle className="diagram-node-round" cx={point.x} cy={point.y} r="24" />
            <text className="diagram-node-text" x={point.x} y={point.y + 5} textAnchor="middle">{label}</text>
          </g>
        ))}

        <text className="diagram-label diagram-label-strong" x="430" y="30">{L('顶点节点', 'vertex nodes')}</text>
        <rect className="diagram-table-head" x="430" y="44" width="290" height="30" rx="4" />
        <text className="diagram-label" x="462" y="65" textAnchor="middle">data</text>
        <text className="diagram-label" x="545" y="65" textAnchor="middle">firstin</text>
        <text className="diagram-label" x="650" y="65" textAnchor="middle">firstout</text>
        {vertices.map(([name, firstin, firstout], index) => {
          const y = 76 + index * 42;
          return (
            <g key={name}>
              <rect className="diagram-box" x="430" y={y} width="290" height="38" rx="3" />
              <line className="diagram-divider" x1="502" y1={y} x2="502" y2={y + 38} />
              <line className="diagram-divider" x1="602" y1={y} x2="602" y2={y + 38} />
              <text className="diagram-node-text" x="466" y={y + 24} textAnchor="middle">{name}</text>
              <text className="diagram-label" x="552" y={y + 24} textAnchor="middle">{firstin}</text>
              <text className="diagram-label" x="650" y={y + 24} textAnchor="middle">{firstout}</text>
            </g>
          );
        })}
        <text className="diagram-note" x="575" y="224" textAnchor="middle">
          {L('firstin 进入入弧链；firstout 进入出弧链', 'firstin opens the in-chain; firstout opens the out-chain')}
        </text>

        <text className="diagram-label diagram-label-strong" x="40" y="255">{L('弧节点与链指针', 'arc nodes and link fields')}</text>
        <rect className="diagram-table-head" x="40" y="270" width="680" height="30" rx="4" />
        {[
          ['arc', 81, 42],
          ['tailvex', 160, 68],
          ['headvex', 270, 68],
          ['tlink', 360, 68],
          ['hlink', 452, 68],
          ['chain', 590, 130],
        ].map(([label, x]) => (
          <text key={label} className="diagram-label" x={Number(x)} y="291" textAnchor="middle">
            {label === 'chain' ? L('链关系', 'chains') : label}
          </text>
        ))}
        {edges.map(([arc, tail, head, tlink, hlink, chain], index) => {
          const y = 302 + index * 44;
          const highlighted = arc === 'e2';
          return (
            <g key={arc} data-arc={arc}>
              {highlighted && <rect className="diagram-band" x="40" y={y} width="680" height="42" rx="4" />}
              <rect className="diagram-box" x="40" y={y} width="680" height="42" rx="4" />
              {[124, 210, 320, 405, 498, 560].map((x) => (
                <line key={x} className="diagram-divider" x1={x} y1={y} x2={x} y2={y + 42} />
              ))}
              <text className="diagram-edge-tag" x="82" y={y + 26} textAnchor="middle">{arc}</text>
              <text className="diagram-label" x="167" y={y + 26} textAnchor="middle">{tail}</text>
              <text className="diagram-label" x="273" y={y + 26} textAnchor="middle">{head}</text>
              <text className="diagram-label" x="362" y={y + 26} textAnchor="middle">{tlink}</text>
              <text className="diagram-label" x="452" y={y + 26} textAnchor="middle">{hlink}</text>
              <text className="diagram-note" x="595" y={y + 26} textAnchor="middle">{L(chain, chain)}</text>
            </g>
          );
        })}
        <text className="diagram-note" x="40" y="488">
          {L('e2 同时被 A 的 firstout 链和 C 的 firstin 链引用：tlink 走同尾，hlink 走同头。', 'e2 is referenced by A’s firstout chain and C’s firstin chain: tlink follows equal tails, hlink equal heads.')}
        </text>
        <rect className="diagram-band" x="40" y="505" width="680" height="30" rx="6" />
        <text className="diagram-label" x="380" y="525" textAnchor="middle">
          {L('一条弧只存一次；入链与出链共享同一个弧节点', 'one arc stored once; in-chain and out-chain share the node')}
        </text>
      </svg>
    );
  }

  if (kind === 'graph-adjacency-multilist') {
    const graphNodes = {
      A: { x: 105, y: 90 },
      B: { x: 265, y: 52 },
      C: { x: 235, y: 175 },
      D: { x: 390, y: 112 },
    } as const;
    const vertices = [
      ['A', 'e1'],
      ['B', 'e1'],
      ['C', 'e2'],
      ['D', 'e4'],
    ] as const;
    const edges = [
      ['e1', 'A', 'B', 'e2', 'e3', 'A 链 → B 链'],
      ['e2', 'A', 'C', '—', 'e3', 'A 链 → C 链'],
      ['e3', 'B', 'C', '—', 'e4', 'B 链 → C 链'],
      ['e4', 'C', 'D', '—', '—', 'C 链 → D 链'],
    ] as const;
    return (
      <svg className="concept-svg" viewBox="0 0 760 550" role="img" aria-label={L('无向图的邻接多重表边节点与端点链', 'Adjacency multilist edge nodes and endpoint chains')}>
        <text className="diagram-label diagram-label-strong" x="40" y="30">{L('无向图', 'Undirected graph')}</text>
        <line className="diagram-line" x1={graphNodes.A.x} y1={graphNodes.A.y} x2={graphNodes.B.x} y2={graphNodes.B.y} />
        <text className="diagram-edge-tag" x="170" y="57">e1</text>
        <line className="diagram-line" x1={graphNodes.A.x} y1={graphNodes.A.y} x2={graphNodes.C.x} y2={graphNodes.C.y} />
        <text className="diagram-edge-tag" x="135" y="152">e2</text>
        <line className="diagram-line" x1={graphNodes.B.x} y1={graphNodes.B.y} x2={graphNodes.C.x} y2={graphNodes.C.y} />
        <text className="diagram-edge-tag" x="287" y="111">e3</text>
        <line className="diagram-line diagram-cut" x1={graphNodes.C.x} y1={graphNodes.C.y} x2={graphNodes.D.x} y2={graphNodes.D.y} />
        <text className="diagram-cut-tag" x="340" y="177">e4</text>
        {Object.entries(graphNodes).map(([label, point]) => (
          <g key={label}>
            <circle className="diagram-node-round" cx={point.x} cy={point.y} r="23" />
            <text className="diagram-node-text" x={point.x} y={point.y + 5} textAnchor="middle">{label}</text>
          </g>
        ))}

        <text className="diagram-label diagram-label-strong" x="440" y="30">{L('顶点节点', 'vertex nodes')}</text>
        <rect className="diagram-table-head" x="440" y="44" width="280" height="30" rx="4" />
        <text className="diagram-label" x="480" y="65" textAnchor="middle">data</text>
        <text className="diagram-label" x="620" y="65" textAnchor="middle">firstedge</text>
        {vertices.map(([name, firstedge], index) => {
          const y = 76 + index * 39;
          return (
            <g key={name}>
              <rect className="diagram-box" x="440" y={y} width="280" height="35" rx="3" />
              <line className="diagram-divider" x1="540" y1={y} x2="540" y2={y + 35} />
              <text className="diagram-node-text" x="487" y={y + 23} textAnchor="middle">{name}</text>
              <text className="diagram-label" x="620" y={y + 23} textAnchor="middle">{firstedge}</text>
            </g>
          );
        })}
        <text className="diagram-note" x="580" y="242" textAnchor="middle">
          {L('每条边只建一个节点，两个端点各有一个指针继续链', 'one edge node; each endpoint has a pointer to continue its chain')}
        </text>

        <text className="diagram-label diagram-label-strong" x="40" y="270">{L('边节点与端点链', 'edge nodes and endpoint chains')}</text>
        <rect className="diagram-table-head" x="40" y="284" width="680" height="30" rx="4" />
        {[
          ['edge', 88, 44],
          ['ivex', 170, 64],
          ['jvex', 246, 64],
          ['ilink', 334, 70],
          ['jlink', 424, 70],
          ['chain', 590, 150],
        ].map(([label, x]) => (
          <text key={label} className="diagram-label" x={Number(x)} y="305" textAnchor="middle">
            {label === 'chain' ? L('两个端点链', 'endpoint chains') : label}
          </text>
        ))}
        {edges.map(([edge, ivex, jvex, ilink, jlink, chain], index) => {
          const y = 316 + index * 44;
          const highlighted = edge === 'e3';
          return (
            <g key={edge} data-edge-node={edge}>
              {highlighted && <rect className="diagram-band" x="40" y={y} width="680" height="42" rx="4" />}
              <rect className="diagram-box" x="40" y={y} width="680" height="42" rx="4" />
              {[116, 210, 286, 387, 480, 520].map((x) => (
                <line key={x} className="diagram-divider" x1={x} y1={y} x2={x} y2={y + 42} />
              ))}
              <text className="diagram-edge-tag" x="78" y={y + 26} textAnchor="middle">{edge}</text>
              <text className="diagram-label" x="163" y={y + 26} textAnchor="middle">{ivex}</text>
              <text className="diagram-label" x="248" y={y + 26} textAnchor="middle">{jvex}</text>
              <text className="diagram-label" x="337" y={y + 26} textAnchor="middle">{ilink}</text>
              <text className="diagram-label" x="432" y={y + 26} textAnchor="middle">{jlink}</text>
              <text className="diagram-note" x="590" y={y + 26} textAnchor="middle">{L(chain, chain)}</text>
            </g>
          );
        })}
        <text className="diagram-note" x="40" y="510">
          {L('e3 同时挂在 B 的链（ivex=B）与 C 的链（jvex=C）上；两条链共用同一个边节点，而不是两份记录。', 'e3 belongs to B’s chain (ivex=B) and C’s chain (jvex=C); both chains share one edge node, not two records.')}
        </text>
        <rect className="diagram-band" x="40" y="520" width="680" height="24" rx="6" />
        <text className="diagram-label" x="380" y="537" textAnchor="middle">
          {L('无向图：e 条边 → e 个边节点；空间 O(n + e)', 'undirected: e edges → e edge nodes; space O(n + e)')}
        </text>
      </svg>
    );
  }

  if (kind === 'graph-storage-comparison') {
    const branches = [
      {
        x: 36,
        title: ['稠密图', 'dense graph'],
        detail: ['e 接近 n²', 'e close to n²'],
        target: ['邻接矩阵', 'Adjacency matrix'],
        reason: ['O(1) 查边，空单元少', 'O(1) edge test, few empty cells'],
      },
      {
        x: 206,
        title: ['稀疏有向图', 'sparse directed'],
        detail: ['同时要出边与入边', 'needs out and in arcs'],
        target: ['十字链表', 'Orthogonal list'],
        reason: ['两链共享一个弧节点', 'two chains share one arc node'],
      },
      {
        x: 396,
        title: ['稀疏无向图', 'sparse undirected'],
        detail: ['频繁按边处理', 'edge-centric operations'],
        target: ['邻接多重表', 'Adjacency multilist'],
        reason: ['一条边一个节点', 'one node per edge'],
      },
      {
        x: 566,
        title: ['一般稀疏图', 'general sparse graph'],
        detail: ['主要枚举邻居', 'mostly enumerate neighbours'],
        target: ['邻接表', 'Adjacency list'],
        reason: ['结构简单，O(n+e)', 'simple, O(n+e)'],
      },
    ] as const;
    return (
      <svg className="concept-svg" viewBox="0 0 760 430" role="img" aria-label={L('按图的稠密程度和主要操作选择存储结构', 'Choose a graph layout by density and dominant operations')}>
        <defs>
          <marker id="gs-choice-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="diagram-arrow" />
          </marker>
        </defs>
        <rect className="diagram-box" x="270" y="20" width="220" height="64" rx="10" />
        <text className="diagram-label diagram-label-strong" x="380" y="46" textAnchor="middle">
          {L('先问：图有多稠密？', 'First: how dense is the graph?')}
        </text>
        <text className="diagram-note" x="380" y="68" textAnchor="middle">
          {L('再问：主要操作是什么？', 'Then: what dominates the workload?')}
        </text>
        {branches.map((branch) => {
          const centerX = branch.x + 78;
          const lineStartY = 84;
          return (
            <g key={branch.target[0]}>
              <line
                className="diagram-guide"
                x1="380"
                y1={lineStartY}
                x2={centerX}
                y2="162"
                markerEnd="url(#gs-choice-arrow)"
              />
              <rect className="diagram-box" x={branch.x} y="164" width="156" height="66" rx="8" />
              <text className="diagram-label diagram-label-strong" x={centerX} y="188" textAnchor="middle">{L(branch.title[0], branch.title[1])}</text>
              <text className="diagram-note" x={centerX} y="210" textAnchor="middle">{L(branch.detail[0], branch.detail[1])}</text>
              <line
                className="diagram-line"
                x1={centerX}
                y1="230"
                x2={centerX}
                y2="276"
                markerEnd="url(#gs-choice-arrow)"
              />
              <rect className="diagram-chip" x={branch.x} y="278" width="156" height="52" rx="8" />
              <text className="diagram-label diagram-label-strong" x={centerX} y="301" textAnchor="middle">{L(branch.target[0], branch.target[1])}</text>
              <text className="diagram-note" x={centerX} y="321" textAnchor="middle">{L(branch.reason[0], branch.reason[1])}</text>
            </g>
          );
        })}
        <rect className="diagram-band" x="40" y="364" width="680" height="46" rx="8" />
        <text className="diagram-label" x="380" y="385" textAnchor="middle">
          {L('没有绝对最优：结构应服务真实的查询、插入和删除模式。', 'No absolute winner: the layout must serve the real query, insert and delete pattern.')}
        </text>
        <text className="diagram-note" x="380" y="403" textAnchor="middle">
          {L('矩阵看两点；链表找邻居；十字看出入；多重表共享边。', 'matrix tests a pair; list finds neighbours; orthogonal links in/out; multilist shares edges.')}
        </text>
      </svg>
    );
  }

  if (kind === 'articulation-basics') {
    const nodes = {
      A: { x: 105, y: 92 },
      B: { x: 105, y: 222 },
      C: { x: 242, y: 157 },
      D: { x: 390, y: 157 },
      E: { x: 527, y: 92 },
      F: { x: 527, y: 222 },
    } as const;
    return (
      <svg className="concept-svg" viewBox="0 0 760 400" role="img" aria-label={L('两个三角形通过桥 C–D 相连，C 与 D 是关节点', 'Two triangles joined by bridge C–D; C and D are articulation points')}>
        <rect className="diagram-box" x="45" y="48" width="300" height="230" rx="12" />
        <rect className="diagram-box" x="455" y="48" width="270" height="230" rx="12" />
        <text className="diagram-label" x="195" y="72" textAnchor="middle">{L('点双块 1', 'vertex block 1')}</text>
        <text className="diagram-label" x="590" y="72" textAnchor="middle">{L('点双块 2', 'vertex block 2')}</text>
        <line className="diagram-line" x1={nodes.A.x} y1={nodes.A.y} x2={nodes.B.x} y2={nodes.B.y} />
        <line className="diagram-line" x1={nodes.A.x} y1={nodes.A.y} x2={nodes.C.x} y2={nodes.C.y} />
        <line className="diagram-line" x1={nodes.B.x} y1={nodes.B.y} x2={nodes.C.x} y2={nodes.C.y} />
        <line className="diagram-line diagram-cut" x1={nodes.C.x} y1={nodes.C.y} x2={nodes.D.x} y2={nodes.D.y} />
        <line className="diagram-line" x1={nodes.D.x} y1={nodes.D.y} x2={nodes.E.x} y2={nodes.E.y} />
        <line className="diagram-line" x1={nodes.E.x} y1={nodes.E.y} x2={nodes.F.x} y2={nodes.F.y} />
        <line className="diagram-line" x1={nodes.F.x} y1={nodes.F.y} x2={nodes.D.x} y2={nodes.D.y} />
        {Object.entries(nodes).map(([label, point]) => {
          const cut = label === 'C' || label === 'D';
          return (
            <g key={label}>
              {cut && <circle className="diagram-cut-ring" cx={point.x} cy={point.y} r="31" />}
              <circle className="diagram-node-round" cx={point.x} cy={point.y} r="24" />
              <text className="diagram-node-text" x={point.x} y={point.y + 5} textAnchor="middle">{label}</text>
            </g>
          );
        })}
        <text className="diagram-cut-tag" x="316" y="136" textAnchor="middle">{L('桥 C–D', 'bridge C–D')}</text>
        <text className="diagram-note" x="316" y="118" textAnchor="middle">{L('本身是含 2 个顶点的点双块', 'a two-vertex vertex block itself')}</text>
        <text className="diagram-cut-tag" x="242" y="205" textAnchor="middle">{L('关节点 C', 'cut vertex C')}</text>
        <text className="diagram-cut-tag" x="390" y="205" textAnchor="middle">{L('关节点 D', 'cut vertex D')}</text>
        <text className="diagram-note" x="105" y="280" textAnchor="middle">{L('删除 C 或 D，图分裂', 'remove C or D → split')}</text>
        <text className="diagram-note" x="527" y="280" textAnchor="middle">{L('删除 C–D，图分裂', 'remove C–D → split')}</text>
        <text className="diagram-note" x="380" y="316" textAnchor="middle">
          {L('A、B、E、F 不在各自三角形内造成分裂，因此都不是关节点。', 'A, B, E and F do not split their triangles, so none is an articulation point.')}
        </text>
        <rect className="diagram-band" x="60" y="338" width="640" height="44" rx="8" />
        <text className="diagram-label" x="380" y="357" textAnchor="middle">
          {L('关节点看“删点”，桥看“删边”；桥连接两个点双块，块可以共享关节点。', 'Cut vertices use vertex deletion; bridges use edge deletion; a bridge joins two vertex blocks, which may share a cut vertex.')}
        </text>
        <text className="diagram-note" x="380" y="375" textAnchor="middle">
          {L('两个三角形各是一个点双块；桥 C–D 本身也单独成块，C、D 由相邻块共享。', 'Each triangle is a vertex block; bridge C–D is also a block, and C and D are shared by adjacent blocks.')}
        </text>
      </svg>
    );
  }

  return null;
}
