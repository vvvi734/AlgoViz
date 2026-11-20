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
