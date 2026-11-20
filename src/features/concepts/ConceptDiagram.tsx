import type { Lang } from '../../i18n/types';
import type { ConceptDiagramKind } from '../../domain/concepts/types';

/**
 * Large, static SVG diagrams for concept lessons. They never animate and never
 * depend on trace data; every label stays at 14px or above.
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

  if (kind === 'adt') {
    const operations: Array<[string, number]> = [
      [L('数据对象', 'Data object'), 135],
      [L('数据关系', 'Relationships'), 320],
      [L('操作集合', 'Operations'), 505],
    ];
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('抽象数据类型的分层示意', 'Layers of an abstract data type')}>
        <rect className="diagram-box diagram-accent" x="130" y="18" width="500" height="58" rx="12" />
        <text className="diagram-label diagram-label-strong" x="380" y="45" textAnchor="middle">{L('抽象数据类型 ADT', 'Abstract data type')}</text>
        <text className="diagram-note" x="380" y="66" textAnchor="middle">{L('先约定“是什么、能做什么”', 'Specify what it is and what it can do first')}</text>
        {operations.map(([label, x]) => (
          <g key={label}>
            <line className="diagram-line" x1="380" y1="76" x2={x + 55} y2="104" />
            <rect className="diagram-chip" x={x} y="104" width="110" height="40" rx="9" />
            <text className="diagram-label" x={x + 55} y="129" textAnchor="middle">{label}</text>
          </g>
        ))}
        <text className="diagram-note" x="380" y="176" textAnchor="middle">{L('抽象层只描述语义，不暴露数组下标或指针', 'The abstract layer describes semantics, not indices or pointers')}</text>
        <line className="diagram-line" x1="380" y1="188" x2="250" y2="220" />
        <line className="diagram-line" x1="380" y1="188" x2="510" y2="220" />
        <rect className="diagram-box" x="110" y="220" width="280" height="74" rx="10" />
        <text className="diagram-label diagram-label-strong" x="250" y="248" textAnchor="middle">{L('顺序实现', 'Sequential implementation')}</text>
        <text className="diagram-note" x="250" y="274" textAnchor="middle">{L('数组 + 下标 / 连续空间', 'Array + index / contiguous space')}</text>
        <rect className="diagram-box" x="370" y="220" width="280" height="74" rx="10" />
        <text className="diagram-label diagram-label-strong" x="510" y="248" textAnchor="middle">{L('链式实现', 'Linked implementation')}</text>
        <text className="diagram-note" x="510" y="274" textAnchor="middle">{L('结点 + 指针 / 分散空间', 'Nodes + pointers / scattered space')}</text>
        <rect className="diagram-band" x="80" y="316" width="600" height="34" rx="8" />
        <text className="diagram-label" x="380" y="338" textAnchor="middle">{L('同一 ADT 可有多种实现，操作契约保持不变', 'One ADT, several implementations; the contract stays the same')}</text>
      </svg>
    );
  }

  if (kind === 'cases') {
    const panels: Array<[string, string, string, number]> = [
      [L('最好情况', 'Best case'), L('目标在首位', 'Target first'), L('1 次比较', '1 comparison'), 0],
      [L('平均情况', 'Average case'), L('等概率分布', 'Uniform distribution'), L('(n+1)/2 次', '(n+1)/2'), 2],
      [L('最坏情况', 'Worst case'), L('目标不存在', 'Target absent'), L('n 次比较', 'n comparisons'), -1],
    ];
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('顺序查找的三种情况', 'Three cases of linear search')}>
        {panels.map(([title, condition, cost, target], panelIndex) => {
          const x = 40 + panelIndex * 240;
          return (
            <g key={title}>
              <rect className="diagram-box" x={x} y="38" width="220" height="220" rx="12" />
              <text className="diagram-label diagram-label-strong" x={x + 110} y="70" textAnchor="middle">{title}</text>
              <text className="diagram-note" x={x + 110} y="94" textAnchor="middle">{condition}</text>
              {[0, 1, 2, 3, 4].map((cell) => (
                <rect
                  key={cell}
                  className={cell === target ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                  x={x + 20 + cell * 37}
                  y="118"
                  width="34"
                  height="42"
                />
              ))}
              <text className="diagram-note" x={x + 110} y="186" textAnchor="middle">{L('输入规模都是 n', 'Input size is n')}</text>
              <text className="diagram-label" x={x + 110} y="218" textAnchor="middle">{cost}</text>
            </g>
          );
        })}
        <rect className="diagram-band" x="70" y="292" width="620" height="44" rx="9" />
        <text className="diagram-label" x="380" y="319" textAnchor="middle">{L('平均情况依赖输入分布，不等于 (最好 + 最坏) / 2', 'Average depends on the distribution, not (best + worst)/2')}</text>
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
        <text className="diagram-note" x="446" y="194">{L('HEAD → 节点 1 → 节点 2 → 节点 3 → NULL', 'HEAD → node 1 → node 2 → node 3 → NULL')}</text>
        <text className="diagram-note" x="446" y="224">{L('已知前驱插入/删除：改指针 O(1)', 'Insert/delete with predecessor known: relink O(1)')}</text>
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

  if (kind === 'graph-storage') {
    const matrixRows = [
      ['A', ['0', '1', '0', '1']],
      ['B', ['1', '0', '1', '0']],
      ['C', ['0', '1', '0', '1']],
      ['D', ['1', '0', '1', '0']],
    ] as const;
    return (
      <svg className="concept-svg" viewBox="0 0 760 400" role="img" aria-label={L('邻接矩阵与邻接表示意', 'Adjacency matrix and adjacency list')}>
        <text className="diagram-label diagram-label-strong" x="40" y="34">{L('无向图', 'Undirected graph')}</text>
        <circle className="diagram-node-round" cx="80" cy="95" r="24" />
        <circle className="diagram-node-round" cx="180" cy="95" r="24" />
        <circle className="diagram-node-round" cx="180" cy="185" r="24" />
        <circle className="diagram-node-round" cx="80" cy="185" r="24" />
        <line className="diagram-line" x1="104" y1="95" x2="156" y2="95" />
        <line className="diagram-line" x1="80" y1="119" x2="80" y2="161" />
        <line className="diagram-line" x1="180" y1="119" x2="180" y2="161" />
        <text className="diagram-node-text" x="80" y="100" textAnchor="middle">A</text>
        <text className="diagram-node-text" x="180" y="100" textAnchor="middle">B</text>
        <text className="diagram-node-text" x="180" y="190" textAnchor="middle">C</text>
        <text className="diagram-node-text" x="80" y="190" textAnchor="middle">D</text>
        <text className="diagram-note" x="110" y="238" textAnchor="middle">{L('4 个顶点，4 条边', '4 vertices, 4 edges')}</text>

        <text className="diagram-label diagram-label-strong" x="300" y="34">{L('邻接矩阵', 'Adjacency matrix')}</text>
        {['A', 'B', 'C', 'D'].map((label, index) => (
          <text className="diagram-note" key={`col-${label}`} x={344 + index * 32 + 15} y="72" textAnchor="middle">{label}</text>
        ))}
        {matrixRows.map(([rowLabel, values], rowIndex) => (
          <g key={rowLabel}>
            <text className="diagram-note" x="320" y={105 + rowIndex * 32 + 20} textAnchor="end">{rowLabel}</text>
            {values.map((value, cellIndex) => (
              <g key={`${rowLabel}-${cellIndex}`}>
                <rect
                  className={value === '1' ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                  x={344 + cellIndex * 32}
                  y={88 + rowIndex * 32}
                  width="30"
                  height="30"
                />
                <text className="diagram-label" x={359 + cellIndex * 32} y={108 + rowIndex * 32} textAnchor="middle">{value}</text>
              </g>
            ))}
          </g>
        ))}
        <text className="diagram-note" x="408" y="250" textAnchor="middle">{L('对称；查边 O(1)；空间 O(n²)', 'Symmetric; edge test O(1); space O(n²)')}</text>

        <text className="diagram-label diagram-label-strong" x="540" y="34">{L('邻接表', 'Adjacency list')}</text>
        {[
          ['A', '→ B → D'],
          ['B', '→ A → C'],
          ['C', '→ B → D'],
          ['D', '→ A → C'],
        ].map(([vertex, edges], index) => (
          <g key={vertex}>
            <rect className="diagram-chip" x="540" y={64 + index * 38} width="34" height="28" rx="6" />
            <text className="diagram-label" x="557" y={84 + index * 38} textAnchor="middle">{vertex}</text>
            <text className="diagram-note" x="586" y={84 + index * 38}>{edges}</text>
          </g>
        ))}
        <text className="diagram-note" x="620" y="238" textAnchor="middle">{L('稀疏图省空间；遍历邻居 O(deg)', 'Sparse-friendly; neighbours O(deg)')}</text>

        <rect className="diagram-band" x="60" y="348" width="640" height="34" rx="8" />
        <text className="diagram-label" x="380" y="370" textAnchor="middle">{L('稠密图选矩阵，稀疏图选邻接表', 'Dense → matrix, sparse → adjacency list')}</text>
      </svg>
    );
  }

  if (kind === 'string') {
    const textCells = 'ABABABC'.split('');
    const patternCells = 'ABABC'.split('');
    const lpsCells = [0, 0, 1, 2, 0];
    const cell = 38;
    const step = 44;
    const x0 = 58;
    const yText = 58;
    const yPattern = 104;
    const yTextKmp = 198;
    const yPatternKmp = 248;
    return (
      <svg className="concept-svg" viewBox="0 0 760 430" role="img" aria-label={L('朴素匹配与 KMP 的静态对齐示意', 'Static alignment comparison of naive matching and KMP')}>
        <text className="diagram-label diagram-label-strong" x={x0} y="32">
          {L('同一段主串，两种失配后的处理', 'One text, two ways to handle a mismatch')}
        </text>

        <text className="diagram-label" x={x0} y="52">{L('朴素匹配：首次对齐从 s = 0 开始', 'Naive: the first alignment starts at s = 0')}</text>
        <text className="diagram-note" x="20" y={yText + 25}>T</text>
        <text className="diagram-note" x="20" y={yPattern + 25}>P</text>
        {textCells.map((char, index) => {
          const tone = index < 4 ? 'diagram-cell diagram-accent' : index === 4 ? 'diagram-cell diagram-cell-mismatch' : 'diagram-cell';
          return (
            <g key={`naive-text-${index}`}>
              <rect className={tone} x={x0 + index * step} y={yText} width={cell} height="30" rx="5" />
              <text className="diagram-label" x={x0 + index * step + cell / 2} y={yText + 21} textAnchor="middle">{char}</text>
              <text className="diagram-note" x={x0 + index * step + cell / 2} y={yText + 44} textAnchor="middle">{index}</text>
            </g>
          );
        })}
        {patternCells.map((char, index) => {
          const tone = index < 4 ? 'diagram-cell diagram-accent' : 'diagram-cell diagram-cell-mismatch';
          return (
            <g key={`naive-pattern-${index}`}>
              <rect className={tone} x={x0 + index * step} y={yPattern} width={cell} height="30" rx="5" />
              <text className="diagram-label" x={x0 + index * step + cell / 2} y={yPattern + 21} textAnchor="middle">{char}</text>
            </g>
          );
        })}
        <text className="diagram-note" x={x0 + 5 * step + 10} y={yPattern + 20}>
          {L('j = 4 失配：A ≠ C', 'Mismatch at j = 4: A ≠ C')}
        </text>
        <line className="diagram-divider" x1="24" y1="168" x2="736" y2="168" />

        <text className="diagram-label" x={x0} y="190">
          {L('KMP：i 停在 4，j 回退到 lps[3] = 2', 'KMP: i stays at 4, j falls back to lps[3] = 2')}
        </text>
        <text className="diagram-note" x="20" y={yTextKmp + 20}>T</text>
        {textCells.map((char, index) => {
          const tone = index >= 2 && index < 4
            ? 'diagram-cell diagram-accent'
            : index === 4
              ? 'diagram-cell diagram-cell-current'
              : 'diagram-cell';
          return (
            <g key={`kmp-text-${index}`}>
              <rect className={tone} x={x0 + index * step} y={yTextKmp} width={cell} height="30" rx="5" />
              <text className="diagram-label" x={x0 + index * step + cell / 2} y={yTextKmp + 21} textAnchor="middle">{char}</text>
            </g>
          );
        })}
        <line className="diagram-guide" x1={x0 + 4 * step + cell / 2} y1={yTextKmp - 6} x2={x0 + 4 * step + cell / 2} y2={yTextKmp + 34} />
        <text className="diagram-label" x={x0 + 4 * step + cell / 2} y={yTextKmp - 10} textAnchor="middle">i</text>

        <text className="diagram-note" x="20" y={yPatternKmp + 20}>P</text>
        {patternCells.map((char, index) => {
          const x = x0 + (index + 2) * step;
          const tone = index < 2
            ? 'diagram-cell diagram-accent'
            : index === 2
              ? 'diagram-cell diagram-cell-current'
              : 'diagram-cell';
          return (
            <g key={`kmp-pattern-${index}`}>
              <rect className={tone} x={x} y={yPatternKmp} width={cell} height="30" rx="5" />
              <text className="diagram-label" x={x + cell / 2} y={yPatternKmp + 21} textAnchor="middle">{char}</text>
            </g>
          );
        })}
        <line className="diagram-guide" x1={x0 + 4 * step + cell / 2} y1={yPatternKmp - 6} x2={x0 + 4 * step + cell / 2} y2={yPatternKmp + 40} />
        <text className="diagram-label" x={x0 + 4 * step + cell / 2} y={yPatternKmp + 54} textAnchor="middle">j</text>

        <text className="diagram-note" x={x0 + 7 * step + 14} y={yTextKmp + 20}>
          {L('i 不回退', 'i never rewinds')}
        </text>
        <text className="diagram-note" x={x0 + 7 * step + 14} y={yTextKmp + 42}>
          {L('前缀 AB 复用', 'prefix AB is reused')}
        </text>
        <text className="diagram-note" x={x0 + 7 * step + 14} y={yTextKmp + 64}>
          {L('下一次对齐从 s = 2 继续', 'next alignment continues at s = 2')}
        </text>

        <line className="diagram-divider" x1="24" y1="326" x2="736" y2="326" />
        <text className="diagram-label" x={x0} y="350">{L('lps 表（0 基）', 'lps table (0-based)')}</text>
        <text className="diagram-note" x={x0} y="370">{L('P', 'P')}</text>
        {patternCells.map((char, index) => {
          const x = x0 + 36 + index * 56;
          return (
            <g key={`lps-${index}`}>
              <rect className="diagram-cell" x={x} y="338" width="44" height="28" rx="5" />
              <text className="diagram-label" x={x + 22} y="358" textAnchor="middle">{char}</text>
              <rect className={index === 3 ? 'diagram-cell diagram-accent' : 'diagram-cell'} x={x} y="374" width="44" height="28" rx="5" />
              <text className="diagram-label" x={x + 22} y="394" textAnchor="middle">{lpsCells[index]}</text>
              <text className="diagram-note" x={x + 22} y="414" textAnchor="middle">{index}</text>
            </g>
          );
        })}
        <text className="diagram-note" x={x0 + 36 + 5 * 56 + 12} y="392">
          {L('lps[3] = 2 → 回退后对齐到 s = 2', 'lps[3] = 2 → realign at s = 2')}
        </text>
      </svg>
    );
  }

  if (kind === 'array') {
    const values = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const rowMajor = values.flat();
    const columnMajor = [1, 4, 2, 5, 3, 6];
    const cell = 52;
    const gap = 5;
    return (
      <svg className="concept-svg" viewBox="0 0 760 390" role="img" aria-label={L('二维数组的行优先与列优先映射', 'Row-major and column-major mapping of a 2D array')}>
        <text className="diagram-label diagram-label-strong" x="36" y="30">
          {L('二维数组 A[2][3]（下标从 0 开始）', '2D array A[2][3] (0-based)')}
        </text>
        {[0, 1, 2].map((col) => (
          <text className="diagram-note" key={`col-${col}`} x={78 + col * (cell + gap) + cell / 2} y="58" textAnchor="middle">
            {col}
          </text>
        ))}
        {values.map((rowValues, row) => (
          <g key={`row-${row}`}>
            <text className="diagram-note" x="62" y={82 + row * (cell + gap) + cell / 2 + 5} textAnchor="middle">
              {row}
            </text>
            {rowValues.map((value, col) => (
              <g key={`cell-${row}-${col}`}>
                <rect
                  className="diagram-cell diagram-accent"
                  x={78 + col * (cell + gap)}
                  y={82 + row * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx="7"
                />
                <text
                  className="diagram-label diagram-label-strong"
                  x={78 + col * (cell + gap) + cell / 2}
                  y={82 + row * (cell + gap) + cell / 2 + 6}
                  textAnchor="middle"
                >
                  {value}
                </text>
              </g>
            ))}
          </g>
        ))}
        <text className="diagram-note" x="78" y="222">
          {L('逻辑上是 2 行 3 列', 'Logically 2 rows × 3 columns')}
        </text>
        <text className="diagram-note" x="78" y="246">
          {L('物理上仍是一条连续序列', 'Physically one contiguous sequence')}
        </text>

        <line className="diagram-line" x1="244" y1="180" x2="292" y2="180" />
        <polygon className="diagram-arrow" points="292,180 284,175 284,185" />

        <text className="diagram-label diagram-label-strong" x="300" y="122">
          {L('行优先：先走完一整行', 'Row-major: finish one row first')}
        </text>
        {rowMajor.map((value, index) => (
          <g key={`row-major-${index}`}>
            <rect className="diagram-cell" x={300 + index * 60} y="138" width="54" height="44" rx="6" />
            <text className="diagram-label" x={327 + index * 60} y="166" textAnchor="middle">{value}</text>
            <text className="diagram-note" x={327 + index * 60} y="198" textAnchor="middle">{index}</text>
          </g>
        ))}
        <text className="diagram-note" x="300" y="220">
          {L('a[0][0], a[0][1], a[0][2], a[1][0], …', 'a[0][0], a[0][1], a[0][2], a[1][0], …')}
        </text>

        <text className="diagram-label diagram-label-strong" x="300" y="254">
          {L('列优先：先走完一整列', 'Column-major: finish one column first')}
        </text>
        {columnMajor.map((value, index) => (
          <g key={`col-major-${index}`}>
            <rect className="diagram-cell" x={300 + index * 60} y="270" width="54" height="40" rx="6" />
            <text className="diagram-label" x={327 + index * 60} y="296" textAnchor="middle">{value}</text>
            <text className="diagram-note" x={327 + index * 60} y="326" textAnchor="middle">{index}</text>
          </g>
        ))}

        <rect className="diagram-band" x="30" y="344" width="700" height="34" rx="8" />
        <text className="diagram-label" x="380" y="358" textAnchor="middle">
          {L('行优先 Loc(i,j)=base+(i*C+j)*w；列优先 Loc(i,j)=base+(j*R+i)*w（0 基）', 'Row-major Loc(i,j)=base+(i*C+j)*w; column-major Loc(i,j)=base+(j*R+i)*w (0-based)')}
        </text>
        <text className="diagram-label" x="380" y="374" textAnchor="middle">
          {L('若下标从 1 开始，先把 i、j 各减 1，再代入公式', 'If indices start at 1, subtract 1 from i and j before substituting')}
        </text>
      </svg>
    );
  }

  if (kind === 'matrix-compression') {
    const matrix = [
      [9, 1, 2, 3],
      [1, 8, 4, 5],
      [2, 4, 7, 6],
      [3, 5, 6, 10],
    ];
    const lower: Array<[number, number, number, number]> = [
      [0, 0, 0, 9],
      [1, 0, 1, 1],
      [1, 1, 2, 8],
      [2, 0, 3, 2],
      [2, 1, 4, 4],
      [2, 2, 5, 7],
      [3, 0, 6, 3],
      [3, 1, 7, 5],
      [3, 2, 8, 6],
      [3, 3, 9, 10],
    ];
    const cell = 46;
    const gap = 5;
    return (
      <svg className="concept-svg" viewBox="0 0 760 480" role="img" aria-label={L('对称矩阵下三角压缩存储', 'Lower-triangle compression of a symmetric matrix')}>
        <text className="diagram-label diagram-label-strong" x="30" y="30">
          {L('对称矩阵 A[4][4]：只存下三角的 10 个元素', 'Symmetric A[4][4]: store only the 10 lower-triangle entries')}
        </text>
        {[0, 1, 2, 3].map((col) => (
          <text className="diagram-note" key={`mcol-${col}`} x={78 + col * (cell + gap) + cell / 2} y="58" textAnchor="middle">
            {col}
          </text>
        ))}
        {matrix.map((rowValues, row) => (
          <g key={`mrow-${row}`}>
            <text className="diagram-note" x="62" y={76 + row * (cell + gap) + cell / 2 + 5} textAnchor="middle">
              {row}
            </text>
            {rowValues.map((value, col) => {
              const isLower = row >= col;
              const k = lower.find(([i, j]) => i === row && j === col)?.[2];
              return (
                <g key={`mcell-${row}-${col}`}>
                  <rect
                    className={isLower ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                    x={78 + col * (cell + gap)}
                    y={76 + row * (cell + gap)}
                    width={cell}
                    height={cell}
                    rx="6"
                  />
                  <text
                    className={isLower ? 'diagram-label diagram-label-strong' : 'diagram-label'}
                    x={78 + col * (cell + gap) + cell / 2}
                    y={76 + row * (cell + gap) + 27}
                    textAnchor="middle"
                  >
                    {value}
                  </text>
                  {k !== undefined && (
                    <text
                      className="diagram-note"
                      x={78 + col * (cell + gap) + cell / 2}
                      y={76 + row * (cell + gap) + 42}
                      textAnchor="middle"
                    >
                      k={k}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
        <line className="diagram-line" x1="281" y1="170" x2="298" y2="170" />
        <polygon className="diagram-arrow" points="302,170 294,165 294,175" />

        <text className="diagram-label diagram-label-strong" x="304" y="58">
          {L('一维压缩数组 sa[10]', 'Compressed 1D array sa[10]')}
        </text>
        <text className="diagram-note" x="304" y="78">
          {L('按行优先依次存：sa[k] = A[i][j]', 'Stored in row-major order: sa[k] = A[i][j]')}
        </text>
        {lower.map(([row, col, k, value]) => (
          <g key={`slot-${k}`}>
            <rect
              className="diagram-cell diagram-accent"
              x={304 + k * 42}
              y="94"
              width="38"
              height="42"
              rx="5"
            />
            <text className="diagram-label" x={323 + k * 42} y="121" textAnchor="middle">{value}</text>
            <text className="diagram-note" x={323 + k * 42} y="152" textAnchor="middle">{k}</text>
            <text className="diagram-note" x={323 + k * 42} y="172" textAnchor="middle">{`(${row},${col})`}</text>
          </g>
        ))}

        <text className="diagram-label" x="304" y="212">
          {L('0 基行优先：k = i(i+1)/2 + j（i ≥ j）', '0-based row-major: k = i(i+1)/2 + j (i ≥ j)')}
        </text>
        <text className="diagram-note" x="304" y="234">
          {L('若 i < j，先用对称性交换 i、j；1 基教材对应 k = i(i−1)/2 + j。', 'If i < j, swap i and j by symmetry; a 1-based text uses k = i(i−1)/2 + j.')}
        </text>

        <text className="diagram-label diagram-label-strong" x="30" y="302">
          {L('三类常见特殊矩阵', 'Three common special matrices')}
        </text>
        <g>
          <text className="diagram-note" x="30" y="324">{L('对称矩阵', 'Symmetric')}</text>
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`sym-${row}-${col}`}
                className={row >= col ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                x={30 + col * 20}
                y={332 + row * 20}
                width="18"
                height="18"
              />
            )),
          )}
          <text className="diagram-note" x="30" y="432">{L('A[i][j] = A[j][i]', 'A[i][j] = A[j][i]')}</text>
        </g>
        <g>
          <text className="diagram-note" x="170" y="324">{L('上/下三角矩阵', 'Triangular')}</text>
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`tri-${row}-${col}`}
                className={row >= col ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                x={170 + col * 20}
                y={332 + row * 20}
                width="18"
                height="18"
              />
            )),
          )}
          <text className="diagram-note" x="170" y="432">{L('另一半是常量 0 或 c', 'The other half is constant 0 or c')}</text>
        </g>
        <g>
          <text className="diagram-note" x="310" y="324">{L('三对角带状矩阵', 'Tridiagonal band')}</text>
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1, 2, 3, 4].map((col) => (
              <rect
                key={`band-${row}-${col}`}
                className={Math.abs(row - col) <= 1 ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                x={310 + col * 20}
                y={332 + row * 20}
                width="18"
                height="18"
              />
            )),
          )}
          <text className="diagram-note" x="310" y="442">{L('只存 |i−j| ≤ 1', 'Store only |i−j| ≤ 1')}</text>
          <text className="diagram-note" x="310" y="460">{L('k = 2i + j（0 基）', 'k = 2i + j (0-based)')}</text>
        </g>
        <rect className="diagram-band" x="470" y="330" width="260" height="128" rx="9" />
        <text className="diagram-label" x="600" y="356" textAnchor="middle">{L('压缩的前提', 'When compression pays off')}</text>
        <text className="diagram-note" x="600" y="382" textAnchor="middle">{L('结构已知，才能把二维下标', 'The structure must be known so a 2D index')}</text>
        <text className="diagram-note" x="600" y="402" textAnchor="middle">{L('唯一映射到一维下标', 'maps uniquely to a 1D index')}</text>
        <text className="diagram-note" x="600" y="422" textAnchor="middle">{L('否则仍应存完整二维表', 'otherwise keep the full 2D table')}</text>
      </svg>
    );
  }

  if (kind === 'sparse-matrix') {
    const matrix = [
      [3, 0, 7, 0, 0],
      [0, 0, 5, 0, 0],
      [0, 4, 0, 0, 0],
      [6, 0, 8, 0, 0],
    ];
    const triples: Array<[number, number, number]> = [
      [0, 0, 3],
      [0, 2, 7],
      [1, 2, 5],
      [2, 1, 4],
      [3, 0, 6],
      [3, 2, 8],
    ];
    const cell = 40;
    const gap = 4;
    const x0 = 62;
    return (
      <svg className="concept-svg" viewBox="0 0 760 430" role="img" aria-label={L('稀疏矩阵的三元组表示', 'Triplet representation of a sparse matrix')}>
        <text className="diagram-label diagram-label-strong" x="30" y="30">
          {L('稀疏矩阵 A[4][5]：20 个位置只有 6 个非零元素', 'Sparse A[4][5]: only 6 non-zeros in 20 positions')}
        </text>
        {[0, 1, 2, 3, 4].map((col) => (
          <text className="diagram-note" key={`scol-${col}`} x={x0 + col * (cell + gap) + cell / 2} y="58" textAnchor="middle">
            {col}
          </text>
        ))}
        {matrix.map((rowValues, row) => (
          <g key={`srow-${row}`}>
            <text className="diagram-note" x="44" y={78 + row * (cell + gap) + cell / 2 + 5} textAnchor="middle">
              {row}
            </text>
            {rowValues.map((value, col) => (
              <g key={`scell-${row}-${col}`}>
                <rect
                  className={value === 0 ? 'diagram-cell' : 'diagram-cell diagram-accent'}
                  x={x0 + col * (cell + gap)}
                  y={78 + row * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx="6"
                />
                <text
                  className={value === 0 ? 'diagram-note' : 'diagram-label diagram-label-strong'}
                  x={x0 + col * (cell + gap) + cell / 2}
                  y={78 + row * (cell + gap) + cell / 2 + 5}
                  textAnchor="middle"
                >
                  {value}
                </text>
              </g>
            ))}
          </g>
        ))}
        <text className="diagram-note" x="30" y="280">
          {L('14 个零仍然占位置；稀疏时二维表浪费严重', 'The 14 zeros still occupy slots; a dense table wastes space')}
        </text>

        <line className="diagram-line" x1="286" y1="168" x2="302" y2="168" />
        <polygon className="diagram-arrow" points="306,168 298,163 298,173" />
        <text className="diagram-label diagram-label-strong" x="312" y="48">
          {L('三元组表', 'Triplet list')}
        </text>
        <text className="diagram-note" x="312" y="68">
          {L('每行 (row, col, value)，t = 6', '(row, col, value) per row, t = 6')}
        </text>
        <rect className="diagram-box" x="312" y="82" width="220" height="206" rx="9" />
        {(['#', 'row', 'col', 'value'] as const).map((label, index) => (
          <text
            className="diagram-note"
            key={label}
            x={336 + index * 55}
            y="106"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
        {triples.map(([row, col, value], index) => (
          <g key={`triple-${index}`}>
            <line className="diagram-guide" x1="322" y1={118 + index * 27} x2="522" y2={118 + index * 27} />
            <text className="diagram-note" x="336" y={138 + index * 27} textAnchor="middle">{index}</text>
            <text className="diagram-label" x="391" y={138 + index * 27} textAnchor="middle">{row}</text>
            <text className="diagram-label" x="446" y={138 + index * 27} textAnchor="middle">{col}</text>
            <text className="diagram-label diagram-label-strong" x="501" y={138 + index * 27} textAnchor="middle">{value}</text>
          </g>
        ))}

        <text className="diagram-label diagram-label-strong" x="552" y="48">
          {L('怎样比较存储量', 'Compare the storage cost')}
        </text>
        {[
          [L('普通二维数组', 'Dense 2D array'), L('20 个槽', '20 slots'), 20],
          [L('三元组表', 'Triplet list'), L('18 个数', '18 numbers'), 18],
          [L('CSR', 'CSR'), L('17 个数', '17 numbers'), 17],
        ].map(([name, detail, ratio], index) => {
          const width = 160 * (Number(ratio) / 20);
          return (
            <g key={String(name)}>
              <text className="diagram-note" x="552" y={78 + index * 52}>{name}</text>
              <text className="diagram-note" x="744" y={78 + index * 52} textAnchor="end">{detail}</text>
              <rect
                className={index === 0 ? 'diagram-cell' : 'diagram-cell diagram-accent'}
                x="552"
                y={86 + index * 52}
                width={width}
                height="16"
                rx="4"
              />
            </g>
          );
        })}
        <text className="diagram-note" x="552" y="242">
          {L('条越短，数值总量越少', 'Shorter bar, fewer stored numbers')}
        </text>

        <text className="diagram-note" x="30" y="306">
          {L('恢复：逐条读 (r,c,v) 写回 B[r][c]；CSR 用 row_ptr 记录每一行的起点。', 'Restore: read (r,c,v) and write B[r][c]; CSR marks each row start in row_ptr.')}
        </text>

        <rect className="diagram-band" x="30" y="330" width="700" height="52" rx="8" />
        <text className="diagram-label" x="380" y="352" textAnchor="middle">
          {L('稀疏因子 δ = t / (m·n)；只有 t 远小于 m·n 时，三元组表才真正省空间', 'Sparsity δ = t / (m·n); a triplet list pays off only when t is far below m·n')}
        </text>
        <text className="diagram-label" x="380" y="374" textAnchor="middle">
          {L('三元组表本身是 O(t)，但每个元素占 3 个字段；CSR 把行号压进 row_ptr', 'A triplet list is O(t) but uses three fields per entry; CSR folds row numbers into row_ptr')}
        </text>
        <text className="diagram-note" x="380" y="400" textAnchor="middle">
          {L('稀疏矩阵适合按行/列扫描；随机访问 A[i][j] 仍要额外查找，通常不如二维数组直接。', 'Sparse layouts favour row/column scans; random A[i][j] needs a lookup and is usually slower than a dense array.')}
        </text>
      </svg>
    );
  }

  if (kind === 'sorting') {
    const stableRows: Array<[string, string]> = [
      [L('小林', 'Lin'), '90'],
      [L('小周', 'Zhou'), '90'],
    ];
    return (
      <svg className="concept-svg" viewBox="0 0 760 360" role="img" aria-label={L('稳定与不稳定排序示意', 'Stable and unstable sorting')}>
        {[0, 1].map((panel) => {
          const x = 40 + panel * 360;
          const order = panel === 0 ? stableRows : [...stableRows].reverse();
          const title = panel === 0 ? L('稳定排序', 'Stable sort') : L('不稳定排序', 'Unstable sort');
          const note = panel === 0
            ? L('相等键保持原次序', 'Equal keys keep their order')
            : L('相等键的次序可能改变', 'Equal keys may reorder');
          return (
            <g key={title}>
              <rect className="diagram-box" x={x} y="34" width="320" height="232" rx="12" />
              <text className="diagram-label diagram-label-strong" x={x + 160} y="66" textAnchor="middle">{title}</text>
              <text className="diagram-note" x={x + 30} y="98">{L('排序前', 'Before')}</text>
              {stableRows.map(([name, score], index) => (
                <g key={`before-${panel}-${name}`}>
                  <rect className="diagram-cell" x={x + 96 + index * 96} y="110" width="82" height="40" />
                  <text className="diagram-label" x={x + 137 + index * 96} y="136" textAnchor="middle">{`${name} ${score}`}</text>
                </g>
              ))}
              <text className="diagram-note" x={x + 30} y="180">{L('排序后', 'After')}</text>
              {order.map(([name, score], index) => (
                <g key={`after-${panel}-${name}`}>
                  <rect className={index === 0 ? 'diagram-cell diagram-accent' : 'diagram-cell'} x={x + 96 + index * 96} y="192" width="82" height="40" />
                  <text className="diagram-label" x={x + 137 + index * 96} y="218" textAnchor="middle">{`${name} ${score}`}</text>
                </g>
              ))}
              <text className="diagram-note" x={x + 160} y="254" textAnchor="middle">{note}</text>
            </g>
          );
        })}
        <rect className="diagram-band" x="60" y="300" width="640" height="42" rx="8" />
        <text className="diagram-label" x="380" y="326" textAnchor="middle">{L('稳定性看相等键；原地性看额外空间（递归栈另计）', 'Stability is about equal keys; in-place is about extra space')}</text>
      </svg>
    );
  }

  if (kind === 'b-tree') {
    const drawNode = (x: number, y: number, keys: readonly number[], width: number) => (
      <g key={`${x}-${y}`}>
        <rect className="diagram-box" x={x} y={y} width={width} height="44" rx="7" />
        {keys.map((key, index) => (
          <g key={key}>
            <rect className="diagram-cell" x={x + 8 + index * 44} y={y + 8} width="44" height="28" rx="3" />
            <text className="diagram-node-text" x={x + 30 + index * 44} y={y + 29} textAnchor="middle">{key}</text>
          </g>
        ))}
      </g>
    );
    return (
      <svg className="concept-svg" viewBox="0 0 760 380" role="img" aria-label={L('4 阶 B 树结构示意', 'A 4-order B-tree')}>
        <text className="diagram-label diagram-label-strong" x="60" y="30">{L('4 阶 B 树：一个节点存放多个关键字', '4-order B-tree: several keys per node')}</text>
        <text className="diagram-note" x="700" y="30" textAnchor="end">{L('m = 4', 'm = 4')}</text>

        <line className="diagram-line" x1="336" y1="116" x2="108" y2="202" />
        <line className="diagram-line" x1="380" y1="116" x2="340" y2="202" />
        <line className="diagram-line" x1="424" y1="116" x2="572" y2="202" />
        <circle className="diagram-node-round" cx="336" cy="116" r="3" />
        <circle className="diagram-node-round" cx="380" cy="116" r="3" />
        <circle className="diagram-node-round" cx="424" cy="116" r="3" />

        {drawNode(328, 72, [20, 40], 104)}
        {drawNode(78, 202, [10], 60)}
        {drawNode(310, 202, [30], 60)}
        {drawNode(498, 202, [50, 60, 70], 148)}

        <text className="diagram-label" x="380" y="58" textAnchor="middle">{L('根：2 个关键字、3 个孩子', 'Root: 2 keys, 3 children')}</text>
        <text className="diagram-note" x="108" y="272" textAnchor="middle">{L('区间 < 20', 'interval < 20')}</text>
        <text className="diagram-note" x="340" y="272" textAnchor="middle">{L('20 < k < 40', '20 < k < 40')}</text>
        <text className="diagram-note" x="572" y="272" textAnchor="middle">{L('区间 > 40', 'interval > 40')}</text>
        <text className="diagram-note" x="78" y="298" textAnchor="start">{L('叶子 · 1 键', 'leaf · 1 key')}</text>
        <text className="diagram-note" x="310" y="298" textAnchor="start">{L('叶子 · 1 键', 'leaf · 1 key')}</text>
        <text className="diagram-note" x="498" y="298" textAnchor="start">{L('叶子 · 3 键', 'leaf · 3 keys')}</text>

        <rect className="diagram-band" x="60" y="318" width="640" height="46" rx="9" />
        <text className="diagram-label" x="380" y="346" textAnchor="middle">
          {L('最多 4 个孩子、3 个关键字；非根至少 1 个关键字，所有叶子同层', 'At most 4 children and 3 keys; non-root nodes keep at least 1 key; all leaves share one depth')}
        </text>
      </svg>
    );
  }

  if (kind === 'b-plus-tree') {
    const keyWidth = 36;
    const drawNode = (
      x: number,
      y: number,
      keys: readonly number[],
      tone: 'index' | 'record',
    ) => {
      const width = keys.length * keyWidth + 16;
      return (
        <g key={`${tone}-${x}-${y}`}>
          <rect className={tone === 'index' ? 'diagram-box' : 'diagram-chip'} x={x} y={y} width={width} height="44" rx="7" />
          {keys.map((key, index) => (
            <g key={key}>
              <rect className="diagram-cell" x={x + 8 + index * keyWidth} y={y + 8} width={keyWidth} height="28" rx="3" />
              <text className="diagram-node-text" x={x + 26 + index * keyWidth} y={y + 29} textAnchor="middle">{key}</text>
            </g>
          ))}
        </g>
      );
    };
    return (
      <svg className="concept-svg" viewBox="0 0 760 450" role="img" aria-label={L('B 树与 B+ 树并排结构对比', 'B-tree and B+ tree side by side')}>
        <text className="diagram-label diagram-label-strong" x="60" y="28">{L('同一组关键字，两种组织方式', 'The same keys, two organisations')}</text>

        <rect className="diagram-box" x="30" y="44" width="330" height="330" rx="10" />
        <rect className="diagram-box" x="400" y="44" width="330" height="330" rx="10" />
        <text className="diagram-label diagram-label-strong" x="195" y="74" textAnchor="middle">{L('B 树', 'B-tree')}</text>
        <text className="diagram-label diagram-label-strong" x="578" y="74" textAnchor="middle">{L('B+ 树', 'B+ tree')}</text>
        <text className="diagram-note" x="195" y="94" textAnchor="middle">{L('记录可出现在任意节点', 'records may sit in any node')}</text>
        <text className="diagram-note" x="578" y="94" textAnchor="middle">{L('内部节点只做索引', 'internal nodes only route')}</text>

        <line className="diagram-line" x1="151" y1="152" x2="80" y2="212" />
        <line className="diagram-line" x1="195" y1="152" x2="180" y2="212" />
        <line className="diagram-line" x1="239" y1="152" x2="280" y2="212" />
        {drawNode(143, 108, [20, 40], 'index')}
        {drawNode(50, 212, [10], 'record')}
        {drawNode(150, 212, [30], 'record')}
        {drawNode(228, 212, [60, 70], 'record')}
        <text className="diagram-note" x="195" y="286" textAnchor="middle">{L('命中内部关键字即可结束', 'a hit at an internal node can stop')}</text>

        <line className="diagram-line" x1="542" y1="152" x2="478" y2="212" />
        <line className="diagram-line" x1="578" y1="152" x2="578" y2="212" />
        <line className="diagram-line" x1="614" y1="152" x2="678" y2="212" />
        {drawNode(534, 108, [20, 40], 'index')}
        {drawNode(434, 212, [5, 10], 'record')}
        {drawNode(534, 212, [25, 30], 'record')}
        {drawNode(634, 212, [45, 60], 'record')}
        <line className="diagram-guide" x1="522" y1="284" x2="534" y2="284" />
        <line className="diagram-guide" x1="622" y1="284" x2="634" y2="284" />
        <polygon className="diagram-arrow" points="534,284 526,279 526,289" />
        <polygon className="diagram-arrow" points="634,284 626,279 626,289" />
        <text className="diagram-note" x="578" y="306" textAnchor="middle">{L('叶子 next 链：顺序扫描', 'leaf next chain: ordered scan')}</text>
        <text className="diagram-note" x="578" y="330" textAnchor="middle">{L('查找必须走到叶子取记录', 'search must reach a leaf for the record')}</text>

        <rect className="diagram-band" x="60" y="394" width="640" height="42" rx="9" />
        <text className="diagram-label" x="380" y="420" textAnchor="middle">
          {L('B 树：记录分散、可提前命中 · B+ 树：记录集中、叶子链服务范围查询', 'B-tree: records everywhere, early hits · B+ tree: records in leaves, chain serves ranges')}
        </text>
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
