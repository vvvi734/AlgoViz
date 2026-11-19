import type { Lang } from '../../i18n/types';
import type { ConceptDiagramKind } from '../../domain/concepts/types';

/**
 * Large, static SVG diagrams for concept lessons. They never animate and never
 * depend on trace data; every label stays at 13px or above.
 */
export function ConceptDiagram({ kind, lang }: { kind: ConceptDiagramKind; lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'classification') {
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('数据结构的分类示意', 'Data structure classification')}>
        <rect className="diagram-box diagram-accent" x="280" y="18" width="200" height="44" rx="10" />
        <text className="diagram-label diagram-label-strong" x="380" y="46" textAnchor="middle">{L('数据结构', 'Data structure')}</text>
        <line className="diagram-line" x1="340" y1="62" x2="230" y2="102" />
        <line className="diagram-line" x1="420" y1="62" x2="530" y2="102" />
        <rect className="diagram-box" x="110" y="102" width="240" height="42" rx="9" />
        <text className="diagram-label" x="230" y="128" textAnchor="middle">{L('逻辑结构', 'Logical structure')}</text>
        <rect className="diagram-box" x="410" y="102" width="240" height="42" rx="9" />
        <text className="diagram-label" x="530" y="128" textAnchor="middle">{L('存储结构', 'Storage structure')}</text>
        {[
          [85, L('集合', 'Set')],
          [160, L('线性', 'Linear')],
          [235, L('树', 'Tree')],
          [310, L('图', 'Graph')],
          [405, L('顺序', 'Sequential')],
          [480, L('链式', 'Linked')],
          [555, L('索引', 'Indexed')],
          [630, L('散列', 'Hashed')],
        ].map(([x, label]) => (
          <g key={String(label)}>
            <rect className="diagram-chip" x={Number(x)} y="178" width="65" height="38" rx="8" />
            <text className="diagram-label" x={Number(x) + 32.5} y="202" textAnchor="middle">{label}</text>
          </g>
        ))}
        <line className="diagram-line" x1="230" y1="144" x2="230" y2="170" />
        <line className="diagram-line" x1="530" y1="144" x2="530" y2="170" />
        <text className="diagram-note" x="230" y="268" textAnchor="middle">{L('描述元素之间的关系', 'Relationships between elements')}</text>
        <text className="diagram-note" x="530" y="268" textAnchor="middle">{L('关系在内存中的实现', 'How relationships are stored')}</text>
        <rect className="diagram-band" x="110" y="292" width="540" height="42" rx="9" />
        <text className="diagram-label" x="380" y="318" textAnchor="middle">
          {L('数据结构 = 逻辑结构 + 存储结构 + 运算', 'Data structure = logical + storage + operations')}
        </text>
      </svg>
    );
  }

  if (kind === 'complexity') {
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('常见复杂度增长曲线', 'Common complexity growth curves')}>
        <line className="diagram-axis" x1="88" y1="300" x2="700" y2="300" />
        <line className="diagram-axis" x1="88" y1="300" x2="88" y2="40" />
        <text className="diagram-note" x="730" y="304" textAnchor="end">{L('输入规模 n', 'Input size n')}</text>
        <text className="diagram-note" x="78" y="44" textAnchor="end" transform="rotate(-90 78 44)">{L('操作次数', 'Operations')}</text>
        <line className="diagram-curve curve-flat" x1="100" y1="226" x2="660" y2="226" />
        <text className="diagram-label" x="692" y="222" textAnchor="end">O(1)</text>
        <path className="diagram-curve curve-log" d="M100 226 C260 226 420 200 660 146" />
        <text className="diagram-label" x="692" y="142" textAnchor="end">O(log n)</text>
        <line className="diagram-curve curve-linear" x1="100" y1="294" x2="660" y2="118" />
        <text className="diagram-label" x="692" y="114" textAnchor="end">O(n)</text>
        <path className="diagram-curve curve-nlog" d="M100 294 C300 286 470 220 660 78" />
        <text className="diagram-label" x="692" y="74" textAnchor="end">O(n log n)</text>
        <path className="diagram-curve curve-quad" d="M100 294 C260 292 420 250 520 170 C600 105 650 58 680 42" />
        <text className="diagram-label" x="692" y="40" textAnchor="end">O(n²)</text>
        <text className="diagram-note" x="380" y="344" textAnchor="middle">{L('n 增大后，高阶项决定增长趋势', 'As n grows, the dominant term decides the trend')}</text>
      </svg>
    );
  }

  if (kind === 'storage') {
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('顺序存储与链式存储示意', 'Sequential and linked storage')}>
        <text className="diagram-label diagram-label-strong" x="60" y="40">{L('顺序存储', 'Sequential storage')}</text>
        <text className="diagram-note" x="60" y="64">{L('一段连续空间，按下标直接定位', 'One contiguous block; index directly')}</text>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <g key={index}>
            <rect className="diagram-cell" x={60 + index * 54} y="92" width="54" height="58" />
            <text className="diagram-label" x={87 + index * 54} y="128" textAnchor="middle">{index}</text>
            <text className="diagram-note" x={87 + index * 54} y="168" textAnchor="middle">a[{index}]</text>
          </g>
        ))}
        <text className="diagram-note" x="222" y="224" textAnchor="middle">{L('地址连续：a[i] 可直接计算', 'Contiguous: a[i] is computed directly')}</text>
        <text className="diagram-note" x="222" y="248" textAnchor="middle">{L('插入/删除中间元素需要搬移', 'Middle insert/delete shifts elements')}</text>
        <line className="diagram-divider" x1="408" y1="34" x2="408" y2="330" />
        <text className="diagram-label diagram-label-strong" x="446" y="40">{L('链式存储', 'Linked storage')}</text>
        <text className="diagram-note" x="446" y="64">{L('节点分散存放，指针表达顺序', 'Nodes are scattered; pointers express order')}</text>
        {[0, 1, 2].map((index) => {
          const x = 446 + index * 100;
          return (
            <g key={index}>
              <rect className="diagram-node" x={x} y="92" width="86" height="58" rx="8" />
              <line className="diagram-node-split" x1={x + 54} y1="92" x2={x + 54} y2="150" />
              <text className="diagram-label" x={x + 27} y="126" textAnchor="middle">{L('数据', 'data')}</text>
              <text className="diagram-label" x={x + 70} y="126" textAnchor="middle">next</text>
              {index < 2 && (
                <>
                  <line className="diagram-line" x1={x + 86} y1="121" x2={x + 100} y2="121" />
                  <polygon className="diagram-arrow" points={`${x + 100},121 ${x + 92},116 ${x + 92},126`} />
                </>
              )}
            </g>
          );
        })}
        <text className="diagram-note" x="446" y="194">{L('HEAD → 节点 1 → 节点 2 → NULL', 'HEAD → node 1 → node 2 → NULL')}</text>
        <text className="diagram-note" x="446" y="224">{L('已知位置插入/删除：改指针 O(1)', 'Insert/delete at a known position: O(1)')}</text>
        <text className="diagram-note" x="446" y="248">{L('按下标访问：从头走 O(n)', 'Indexed access: walk from head, O(n)')}</text>
        <rect className="diagram-band" x="60" y="292" width="640" height="42" rx="9" />
        <text className="diagram-label" x="380" y="318" textAnchor="middle">{L('随机访问选顺序；频繁插删选链式', 'Random access → sequential; frequent insert/delete → linked')}</text>
      </svg>
    );
  }

  if (kind === 'tree') {
    const levels = [95, 175, 255, 335];
    const nodes: Array<[string, number, number]> = [
      ['A', 380, 68], ['B', 260, 148], ['C', 500, 148],
      ['D', 190, 228], ['E', 330, 228], ['F', 570, 228],
    ];
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('树与二叉树术语示意', 'Tree and binary tree terminology')}>
        {levels.map((y, index) => (
          <g key={y}>
            <line className="diagram-guide" x1="54" y1={y} x2="710" y2={y} />
            <text className="diagram-note" x="48" y={y + 18} textAnchor="end">{L(`第 ${index + 1} 层`, `Level ${index + 1}`)}</text>
          </g>
        ))}
        <line className="diagram-line" x1="380" y1="68" x2="260" y2="148" />
        <line className="diagram-line" x1="380" y1="68" x2="500" y2="148" />
        <line className="diagram-line" x1="260" y1="148" x2="190" y2="228" />
        <line className="diagram-line" x1="260" y1="148" x2="330" y2="228" />
        <line className="diagram-line" x1="500" y1="148" x2="570" y2="228" />
        {nodes.map(([label, x, y]) => (
          <g key={label}>
            <circle className="diagram-node-round" cx={x} cy={y} r="28" />
            <text className="diagram-node-text" x={x} y={y + 5} textAnchor="middle">{label}</text>
          </g>
        ))}
        <text className="diagram-label" x="380" y="28" textAnchor="middle">{L('根节点 A', 'Root A')}</text>
        <text className="diagram-label" x="300" y="112" textAnchor="end">{L('父节点', 'Parent')}</text>
        <text className="diagram-label" x="458" y="112">{L('子节点', 'Child')}</text>
        <text className="diagram-note" x="380" y="164" textAnchor="middle">{L('B 与 C 是兄弟', 'B and C are siblings')}</text>
        <text className="diagram-label" x="190" y="278" textAnchor="middle">{L('叶子 D', 'Leaf D')}</text>
        <text className="diagram-label" x="330" y="278" textAnchor="middle">{L('叶子 E', 'Leaf E')}</text>
        <text className="diagram-label" x="570" y="278" textAnchor="middle">{L('叶子 F', 'Leaf F')}</text>
        <text className="diagram-note" x="650" y="66" textAnchor="end">{L('A 的度 = 2', 'degree(A) = 2')}</text>
        <text className="diagram-note" x="650" y="90" textAnchor="end">{L('树的高度 = 3', 'height = 3')}</text>
      </svg>
    );
  }

  const graphNodes: Array<[string, number, number]> = [
    ['A', 170, 120], ['B', 330, 90], ['C', 500, 140],
    ['D', 240, 240], ['E', 430, 250], ['F', 620, 220],
  ];
  return (
    <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('图的基本概念示意', 'Graph fundamentals')}>
      <line className="diagram-line" x1="170" y1="120" x2="330" y2="90" />
      <line className="diagram-line" x1="170" y1="120" x2="240" y2="240" />
      <line className="diagram-line" x1="330" y1="90" x2="500" y2="140" />
      <line className="diagram-line" x1="330" y1="90" x2="430" y2="250" />
      <line className="diagram-line" x1="240" y1="240" x2="430" y2="250" />
      <line className="diagram-line" x1="500" y1="140" x2="620" y2="220" />
      <line className="diagram-line" x1="430" y1="250" x2="620" y2="220" />
      <line className="diagram-line diagram-directed" x1="240" y1="240" x2="500" y2="140" />
      <polygon className="diagram-arrow" points="500,140 488,136 490,147" />
      {graphNodes.map(([label, x, y]) => (
        <g key={label}>
          <circle className="diagram-node-round" cx={x} cy={y} r="28" />
          <text className="diagram-node-text" x={x} y={y + 5} textAnchor="middle">{label}</text>
        </g>
      ))}
      <text className="diagram-label" x="170" y="62" textAnchor="middle">{L('顶点', 'Vertex')}</text>
      <text className="diagram-note" x="250" y="106" textAnchor="middle">{L('边', 'Edge')}</text>
      <text className="diagram-label" x="380" y="196" textAnchor="middle">{L('有向边', 'Directed edge')}</text>
      <text className="diagram-note" x="620" y="292" textAnchor="middle">{L('F 的度 = 2', 'degree(F) = 2')}</text>
      <text className="diagram-note" x="240" y="306" textAnchor="middle">{L('路径 A → D → E', 'Path A → D → E')}</text>
      <text className="diagram-note" x="700" y="50" textAnchor="end">{L('无向边 (A, B)', 'undirected (A, B)')}</text>
      <rect className="diagram-band" x="60" y="320" width="640" height="34" rx="8" />
      <text className="diagram-label" x="380" y="342" textAnchor="middle">{L('图 = 顶点集合 V + 边集合 E', 'Graph = vertex set V + edge set E')}</text>
    </svg>
  );
}
