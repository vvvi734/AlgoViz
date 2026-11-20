import type { Lang } from '../../i18n/types';

export type TreeConceptDiagramKind = 'tree-storage' | 'forest-conversion';

function TreeBox({
  x,
  y,
  label,
  root = false,
}: {
  x: number;
  y: number;
  label: string;
  root?: boolean;
}) {
  return (
    <g>
      <rect
        className={`diagram-node diagram-tree-node${root ? ' is-root' : ''}`}
        x={x - 22}
        y={y - 16}
        width="44"
        height="32"
        rx="7"
      />
      <text className="diagram-node-text" x={x} y={y + 6} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function TreeEdge({
  x1,
  y1,
  x2,
  y2,
  sibling = false,
  cut = false,
}: {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  sibling?: boolean;
  cut?: boolean;
}) {
  return (
    <line
      className={`diagram-line ${sibling ? 'diagram-sibling' : 'diagram-directed'}${cut ? ' diagram-cut' : ''}`}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
    />
  );
}

/**
 * TREE-01 diagrams. Both pages are static SVG references: the storage page
 * reuses one A-G example tree three times, while the conversion page walks
 * tree -> binary tree, forest -> binary tree and the reverse.
 */
export function TreeConceptDiagram({
  kind,
  lang,
}: {
  kind: TreeConceptDiagramKind;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'tree-storage') {
    const nodes = {
      A: [200, 120],
      B: [110, 185],
      C: [200, 185],
      D: [290, 185],
      E: [70, 250],
      F: [140, 250],
      G: [290, 250],
    } as const;

    return (
      <div className="diagram-stack">
        <svg
          className="concept-svg concept-svg-wide"
          viewBox="0 0 900 360"
          role="img"
          aria-label={L(
            '双亲表示法：A 到 G 的示例树与 parent 数组一一对应',
            'Parent representation: the A-G example tree mapped to a parent array',
          )}
        >
          <text className="diagram-label diagram-label-strong" x="28" y="28">
            {L('① 双亲表示法：每个节点只记 parent 下标', '1. Parent representation: one parent index per node')}
          </text>
          <text className="diagram-note" x="872" y="28" textAnchor="end">
            {L('parent = -1 表示根', 'parent = -1 marks the root')}
          </text>
          <text className="diagram-note" x="28" y="50">
            {L('示例树 A(B(E,F), C, D(G))；三种表示共用 A–G 这 7 个节点。', 'Example tree A(B(E,F), C, D(G)); all three layouts reuse nodes A-G.')}
          </text>

          <rect className="diagram-box" x="28" y="64" width="400" height="266" rx="9" />
          <rect className="diagram-box" x="472" y="64" width="400" height="266" rx="9" />
          <text className="diagram-label diagram-label-strong" x="44" y="88">
            {L('示例树', 'Example tree')}
          </text>
          <text className="diagram-label diagram-label-strong" x="488" y="88">
            {L('双亲数组 parent[0..6]', 'Parent array parent[0..6]')}
          </text>

          <TreeEdge x1="200" y1="136" x2="110" y2="169" />
          <TreeEdge x1="200" y1="136" x2="200" y2="169" />
          <TreeEdge x1="200" y1="136" x2="290" y2="169" />
          <TreeEdge x1="110" y1="201" x2="70" y2="234" />
          <TreeEdge x1="110" y1="201" x2="140" y2="234" />
          <TreeEdge x1="290" y1="201" x2="290" y2="234" />
          <TreeBox x={nodes.A[0]} y={nodes.A[1]} label="A" root />
          <TreeBox x={nodes.B[0]} y={nodes.B[1]} label="B" />
          <TreeBox x={nodes.C[0]} y={nodes.C[1]} label="C" />
          <TreeBox x={nodes.D[0]} y={nodes.D[1]} label="D" />
          <TreeBox x={nodes.E[0]} y={nodes.E[1]} label="E" />
          <TreeBox x={nodes.F[0]} y={nodes.F[1]} label="F" />
          <TreeBox x={nodes.G[0]} y={nodes.G[1]} label="G" />

          <rect className="diagram-table-head" x="488" y="104" width="52" height="24" />
          <rect className="diagram-table-head" x="540" y="104" width="52" height="24" />
          <rect className="diagram-table-head" x="592" y="104" width="68" height="24" />
          {[
            { index: 0, data: 'A', parent: -1 },
            { index: 1, data: 'B', parent: 0 },
            { index: 2, data: 'C', parent: 0 },
            { index: 3, data: 'D', parent: 0 },
            { index: 4, data: 'E', parent: 1 },
            { index: 5, data: 'F', parent: 1 },
            { index: 6, data: 'G', parent: 3 },
          ].map((row) => {
            const y = 128 + row.index * 24;
            const cellClass = `diagram-cell${row.index === 0 ? ' diagram-accent' : ''}`;
            return (
              <g key={`parent-row-${row.index}`}>
                <rect className={cellClass} x="488" y={y} width="52" height="24" />
                <rect className={cellClass} x="540" y={y} width="52" height="24" />
                <rect className={cellClass} x="592" y={y} width="68" height="24" />
                <text className="diagram-note" x="514" y={y + 16} textAnchor="middle">{row.index}</text>
                <text className="diagram-label" x="566" y={y + 16} textAnchor="middle">{row.data}</text>
                <text className="diagram-note" x="626" y={y + 16} textAnchor="middle">{row.parent}</text>
              </g>
            );
          })}
          <text className="diagram-note" x="514" y="120" textAnchor="middle">{L('下标', 'i')}</text>
          <text className="diagram-note" x="566" y="120" textAnchor="middle">data</text>
          <text className="diagram-note" x="626" y="120" textAnchor="middle">parent</text>

          <text className="diagram-note" x="684" y="120">parent[1] = 0 → A</text>
          <text className="diagram-note" x="684" y="146">
            {L('只存一个 parent 整数', 'one parent integer')}
          </text>
          <text className="diagram-note" x="684" y="170">
            {L('找双亲 O(1)', 'find parent O(1)')}
          </text>
          <text className="diagram-note" x="684" y="194">
            {L('找孩子：扫描 O(n)', 'find children: scan O(n)')}
          </text>
          <text className="diagram-note" x="684" y="218">
            {L('适合常找双亲的场景', 'best for parent queries')}
          </text>
        </svg>

        <svg
          className="concept-svg concept-svg-wide"
          viewBox="0 0 900 505"
          role="img"
          aria-label={L(
            '孩子表示法：A 到 G 的示例树与每个节点的孩子链表',
            'Child representation: the A-G example tree and a child linked list per node',
          )}
        >
          <text className="diagram-label diagram-label-strong" x="28" y="28">
            {L('② 孩子表示法：数组存节点，孩子挂成单链表', '2. Child representation: node array plus one child list per node')}
          </text>
          <text className="diagram-note" x="872" y="28" textAnchor="end">
            {L('NULL = 没有孩子', 'NULL = no children')}
          </text>
          <text className="diagram-note" x="28" y="50">
            {L('数组每一项保存 data 和 firstChild；同一个节点的孩子按从左到右的顺序串起来。', 'Each array slot stores data and firstChild; the children of one node are linked left to right.')}
          </text>

          <rect className="diagram-box" x="28" y="64" width="844" height="184" rx="9" />
          <text className="diagram-label diagram-label-strong" x="44" y="86">
            {L('示例树（A–G）', 'Example tree (A-G)')}
          </text>
          <TreeEdge x1="200" y1="121" x2="110" y2="149" />
          <TreeEdge x1="200" y1="121" x2="200" y2="149" />
          <TreeEdge x1="200" y1="121" x2="290" y2="149" />
          <TreeEdge x1="110" y1="181" x2="70" y2="209" />
          <TreeEdge x1="110" y1="181" x2="140" y2="209" />
          <TreeEdge x1="290" y1="181" x2="290" y2="209" />
          <TreeBox x={200} y={105} label="A" root />
          <TreeBox x={110} y={165} label="B" />
          <TreeBox x={200} y={165} label="C" />
          <TreeBox x={290} y={165} label="D" />
          <TreeBox x={70} y={225} label="E" />
          <TreeBox x={140} y={225} label="F" />
          <TreeBox x={290} y={225} label="G" />

          <rect className="diagram-box" x="28" y="260" width="844" height="218" rx="9" />
          <text className="diagram-label diagram-label-strong" x="44" y="280">
            {L('孩子链表：数组 + firstChild 指针', 'Child lists: array plus firstChild pointers')}
          </text>
          <rect className="diagram-table-head" x="44" y="286" width="44" height="20" />
          <rect className="diagram-table-head" x="88" y="286" width="52" height="20" />
          <rect className="diagram-table-head" x="140" y="286" width="360" height="20" />
          <text className="diagram-note" x="66" y="300" textAnchor="middle">{L('下标', 'i')}</text>
          <text className="diagram-note" x="114" y="300" textAnchor="middle">data</text>
          <text className="diagram-note" x="180" y="300">{L('firstChild 链表', 'firstChild list')}</text>

          {[
            { index: 0, data: 'A', children: ['B', 'C', 'D'] },
            { index: 1, data: 'B', children: ['E', 'F'] },
            { index: 2, data: 'C', children: [] },
            { index: 3, data: 'D', children: ['G'] },
            { index: 4, data: 'E', children: [] },
            { index: 5, data: 'F', children: [] },
            { index: 6, data: 'G', children: [] },
          ].map((row) => {
            const y = 310 + row.index * 22;
            return (
              <g key={`child-row-${row.index}`}>
                <rect className="diagram-cell" x="44" y={y} width="44" height="20" />
                <rect className="diagram-cell" x="88" y={y} width="52" height="20" />
                <text className="diagram-note" x="66" y={y + 14} textAnchor="middle">{row.index}</text>
                <text className="diagram-label" x="114" y={y + 14} textAnchor="middle">{row.data}</text>
                {row.children.length > 0 ? (
                  <>
                    <line className="diagram-line diagram-directed" x1="142" y1={y + 10} x2="171" y2={y + 10} />
                    {row.children.map((child, childIndex) => {
                      const x = 180 + childIndex * 44;
                      return (
                        <g key={`child-${row.index}-${child}`}>
                          <rect className="diagram-cell" x={x} y={y} width="36" height="20" rx="4" />
                          <text className="diagram-label" x={x + 18} y={y + 14} textAnchor="middle">{child}</text>
                          {childIndex < row.children.length - 1 ? (
                            <line className="diagram-line diagram-directed" x1={x + 36} y1={y + 10} x2={x + 44} y2={y + 10} />
                          ) : null}
                        </g>
                      );
                    })}
                    <text className="diagram-note" x={184 + row.children.length * 44} y={y + 14}>NULL</text>
                  </>
                ) : (
                  <text className="diagram-note" x="180" y={y + 14}>NULL</text>
                )}
              </g>
            );
          })}

          <text className="diagram-note" x="28" y="492">
            {L('查找孩子 O(1 + 孩子数)；查找双亲需要额外 parent 字段，或扫描所有链表 O(n)。', 'Find children in O(1 + degree); find a parent needs an extra parent field or an O(n) scan of all lists.')}
          </text>
        </svg>

        <svg
          className="concept-svg concept-svg-wide"
          viewBox="0 0 900 390"
          role="img"
          aria-label={L(
            '孩子兄弟表示法：firstChild 实线、nextSibling 虚线与节点字段表',
            'Child-sibling representation: firstChild solid links, nextSibling dashed links and the field table',
          )}
        >
          <text className="diagram-label diagram-label-strong" x="28" y="28">
            {L('③ 孩子兄弟表示法：firstChild + nextSibling', '3. Child-sibling representation: firstChild + nextSibling')}
          </text>
          <text className="diagram-note" x="872" y="28" textAnchor="end">
            {L('每个节点两个指针', 'two pointers per node')}
          </text>
          <text className="diagram-note" x="28" y="50">
            {L('左指针 firstChild 指向第一个孩子；右指针 nextSibling 指向下一个兄弟。', 'The left pointer firstChild reaches the first child; the right pointer nextSibling reaches the next sibling.')}
          </text>

          <rect className="diagram-box" x="28" y="64" width="520" height="310" rx="9" />
          <rect className="diagram-box" x="560" y="64" width="312" height="310" rx="9" />
          <text className="diagram-label diagram-label-strong" x="44" y="88">
            {L('树的孩子兄弟链', 'Child-sibling links')}
          </text>
          <text className="diagram-note" x="44" y="110">
            {L('实线 = firstChild · 虚线 = nextSibling', 'solid = firstChild · dashed = nextSibling')}
          </text>

          <TreeEdge x1="270" y1="156" x2="160" y2="189" />
          <TreeEdge x1="270" y1="156" x2="270" y2="189" sibling />
          <TreeEdge x1="270" y1="189" x2="380" y2="189" sibling />
          <TreeEdge x1="160" y1="221" x2="110" y2="254" />
          <TreeEdge x1="160" y1="221" x2="190" y2="254" sibling />
          <TreeEdge x1="380" y1="221" x2="380" y2="254" />
          <TreeBox x={270} y={140} label="A" root />
          <TreeBox x={160} y={205} label="B" />
          <TreeBox x={270} y={205} label="C" />
          <TreeBox x={380} y={205} label="D" />
          <TreeBox x={110} y={270} label="E" />
          <TreeBox x={190} y={270} label="F" />
          <TreeBox x={380} y={270} label="G" />

          <text className="diagram-note" x="44" y="320">
            {L('每个节点两个指针，结构正好是二叉链表节点。', 'Two pointers per node make the same shape as a binary linked node.')}
          </text>
          <text className="diagram-note" x="44" y="344">
            {L('firstChild 当左孩子，nextSibling 当右孩子。', 'Treat firstChild as the left child and nextSibling as the right child.')}
          </text>

          <text className="diagram-label diagram-label-strong" x="576" y="88">
            {L('节点字段', 'Node fields')}
          </text>
          <rect className="diagram-table-head" x="576" y="104" width="56" height="22" />
          <rect className="diagram-table-head" x="632" y="104" width="84" height="22" />
          <rect className="diagram-table-head" x="716" y="104" width="84" height="22" />
          <text className="diagram-note" x="604" y="120" textAnchor="middle">{L('节点', 'node')}</text>
          <text className="diagram-note" x="674" y="120" textAnchor="middle">firstChild</text>
          <text className="diagram-note" x="758" y="120" textAnchor="middle">nextSibling</text>

          {[
            { node: 'A', child: 'B', sibling: '—' },
            { node: 'B', child: 'E', sibling: 'C' },
            { node: 'C', child: '—', sibling: 'D' },
            { node: 'D', child: 'G', sibling: '—' },
            { node: 'E', child: '—', sibling: 'F' },
            { node: 'F', child: '—', sibling: '—' },
            { node: 'G', child: '—', sibling: '—' },
          ].map((row, index) => {
            const y = 128 + index * 24;
            return (
              <g key={`sibling-row-${row.node}`}>
                <rect className="diagram-cell" x="576" y={y} width="56" height="24" />
                <rect className="diagram-cell" x="632" y={y} width="84" height="24" />
                <rect className="diagram-cell" x="716" y={y} width="84" height="24" />
                <text className="diagram-label" x="604" y={y + 16} textAnchor="middle">{row.node}</text>
                <text className="diagram-note" x="674" y={y + 16} textAnchor="middle">{row.child}</text>
                <text className="diagram-note" x="758" y={y + 16} textAnchor="middle">{row.sibling}</text>
              </g>
            );
          })}
          <text className="diagram-note" x="576" y="322">
            {L('firstChild → 左孩子', 'firstChild → left child')}
          </text>
          <text className="diagram-note" x="576" y="346">
            {L('nextSibling → 右孩子', 'nextSibling → right child')}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="diagram-stack">
      <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 420"
        role="img"
        aria-label={L(
          '普通树转换为二叉树：左孩子为第一个孩子，右孩子为下一个兄弟',
          'Converting a tree to a binary tree: left child is the first child, right child is the next sibling',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="28" y="28">
          {L('① 普通树 → 二叉树：左孩子、右兄弟', '1. Tree → binary tree: left child, right sibling')}
        </text>
        <text className="diagram-note" x="872" y="28" textAnchor="end">
          {L('实线 = 左孩子 · 虚线 = 右孩子', 'solid = left child · dashed = right child')}
        </text>
        <text className="diagram-note" x="28" y="50">
          {L('使用孩子兄弟表示法：第一个孩子放左边，下一个兄弟放右边，节点数仍为 7。', 'Using child-sibling links: first child on the left, next sibling on the right; node count stays 7.')}
        </text>

        <rect className="diagram-box" x="28" y="64" width="400" height="310" rx="9" />
        <rect className="diagram-box" x="472" y="64" width="400" height="310" rx="9" />
        <text className="diagram-label diagram-label-strong" x="44" y="86">
          {L('转换前：普通树 A–G', 'Before: ordinary tree A-G')}
        </text>
        <text className="diagram-label diagram-label-strong" x="488" y="86">
          {L('转换后：二叉链表', 'After: binary linked structure')}
        </text>

        <TreeEdge x1="220" y1="141" x2="130" y2="179" />
        <TreeEdge x1="220" y1="141" x2="220" y2="179" />
        <TreeEdge x1="220" y1="141" x2="310" y2="179" />
        <TreeEdge x1="130" y1="211" x2="80" y2="249" />
        <TreeEdge x1="130" y1="211" x2="160" y2="249" />
        <TreeEdge x1="310" y1="211" x2="310" y2="249" />
        <TreeBox x={220} y={125} label="A" root />
        <TreeBox x={130} y={195} label="B" />
        <TreeBox x={220} y={195} label="C" />
        <TreeBox x={310} y={195} label="D" />
        <TreeBox x={80} y={265} label="E" />
        <TreeBox x={160} y={265} label="F" />
        <TreeBox x={310} y={265} label="G" />

        <TreeEdge x1="670" y1="141" x2="560" y2="179" />
        <TreeEdge x1="560" y1="211" x2="680" y2="211" sibling />
        <TreeEdge x1="560" y1="211" x2="510" y2="249" />
        <TreeEdge x1="510" y1="281" x2="560" y2="304" sibling />
        <TreeEdge x1="680" y1="211" x2="750" y2="249" sibling />
        <TreeEdge x1="750" y1="281" x2="710" y2="304" />
        <TreeBox x={670} y={125} label="A" root />
        <TreeBox x={560} y={195} label="B" />
        <TreeBox x={680} y={195} label="C" />
        <TreeBox x={750} y={265} label="D" />
        <TreeBox x={510} y={265} label="E" />
        <TreeBox x={560} y={320} label="F" />
        <TreeBox x={710} y={320} label="G" />
        <text className="diagram-edge-tag" x="610" y="186" textAnchor="middle">
          {L('兄弟', 'sibling')}
        </text>

        <text className="diagram-note" x="28" y="402">
          {L('注意：B 的右孩子是 C，但 C 是 B 的下一个兄弟，不是 B 的孩子。', 'Note: C is B’s right child in the binary tree, but C is B’s next sibling, not B’s child.')}
        </text>
        <text className="diagram-note" x="872" y="402" textAnchor="end">
          {L('节点数 7 → 7', 'nodes 7 → 7')}
        </text>
      </svg>

      <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 590"
        role="img"
        aria-label={L(
          '森林转换为二叉树：三棵树根通过 nextSibling 串成右链',
          'Converting a forest to a binary tree: three tree roots linked by nextSibling along the right chain',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="28" y="28">
          {L('② 森林 → 二叉树：树根也互为兄弟', '2. Forest → binary tree: roots are siblings too')}
        </text>
        <text className="diagram-note" x="872" y="28" textAnchor="end">
          {L('共 10 个节点', '10 nodes total')}
        </text>
        <text className="diagram-note" x="28" y="50">
          {L('同样使用孩子兄弟表示法：先处理每棵树，再把下一棵树的根接到上一棵树根的右边。', 'Use child-sibling links per tree, then attach the next tree root to the previous root’s right pointer.')}
        </text>

        <text className="diagram-note" x="28" y="78">
          {L('森林：三棵独立树（A–G、H–I、J）', 'Forest: three independent trees (A-G, H-I, J)')}
        </text>
        <rect className="diagram-box" x="28" y="88" width="844" height="166" rx="9" />

        <TreeEdge x1="160" y1="121" x2="90" y2="149" />
        <TreeEdge x1="160" y1="121" x2="160" y2="149" />
        <TreeEdge x1="160" y1="121" x2="230" y2="149" />
        <TreeEdge x1="90" y1="181" x2="50" y2="209" />
        <TreeEdge x1="90" y1="181" x2="120" y2="209" />
        <TreeEdge x1="230" y1="181" x2="230" y2="209" />
        <TreeEdge x1="430" y1="121" x2="430" y2="149" />
        <TreeBox x={160} y={105} label="A" root />
        <TreeBox x={90} y={165} label="B" />
        <TreeBox x={160} y={165} label="C" />
        <TreeBox x={230} y={165} label="D" />
        <TreeBox x={50} y={225} label="E" />
        <TreeBox x={120} y={225} label="F" />
        <TreeBox x={230} y={225} label="G" />
        <TreeBox x={430} y={105} label="H" root />
        <TreeBox x={430} y={165} label="I" />
        <TreeBox x={620} y={105} label="J" root />

        <TreeEdge x1="182" y1="105" x2="408" y2="105" sibling />
        <TreeEdge x1="452" y1="105" x2="598" y2="105" sibling />
        <text className="diagram-edge-tag" x="295" y="98" textAnchor="middle">nextSibling</text>
        <text className="diagram-edge-tag" x="525" y="98" textAnchor="middle">nextSibling</text>

        <text className="diagram-note" x="28" y="280">
          {L('转换后：一棵二叉树，根层右链为 A → H → J', 'After: one binary tree; the root-level right chain is A → H → J')}
        </text>
        <rect className="diagram-box" x="28" y="292" width="844" height="270" rx="9" />

        <TreeEdge x1="160" y1="336" x2="90" y2="369" />
        <TreeEdge x1="90" y1="401" x2="160" y2="401" sibling />
        <TreeEdge x1="90" y1="401" x2="50" y2="429" />
        <TreeEdge x1="50" y1="461" x2="120" y2="484" sibling />
        <TreeEdge x1="160" y1="401" x2="230" y2="401" sibling />
        <TreeEdge x1="230" y1="401" x2="200" y2="429" />
        <TreeEdge x1="160" y1="336" x2="390" y2="369" sibling />
        <TreeEdge x1="390" y1="401" x2="350" y2="429" />
        <TreeEdge x1="390" y1="401" x2="500" y2="401" sibling />
        <TreeBox x={160} y={320} label="A" root />
        <TreeBox x={90} y={385} label="B" />
        <TreeBox x={160} y={385} label="C" />
        <TreeBox x={230} y={385} label="D" />
        <TreeBox x={50} y={445} label="E" />
        <TreeBox x={120} y={500} label="F" />
        <TreeBox x={200} y={445} label="G" />
        <TreeBox x={390} y={385} label="H" />
        <TreeBox x={350} y={445} label="I" />
        <TreeBox x={500} y={385} label="J" />
        <text className="diagram-edge-tag" x="280" y="346" textAnchor="middle">
          {L('根层右孩子', 'root right child')}
        </text>
        <text className="diagram-edge-tag" x="445" y="378" textAnchor="middle">nextSibling</text>

        <text className="diagram-note" x="28" y="582">
          {L('右孩子 A→H→J 只表示三个根互为兄弟；H 的左孩子 I 才是 H 的孩子。节点数仍为 10。', 'The right chain A→H→J only means the three roots are siblings; H’s left child I is H’s child. Node count stays 10.')}
        </text>
      </svg>

      <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 540"
        role="img"
        aria-label={L(
          '二叉树还原为森林：拆开根层右链并恢复各节点的孩子关系',
          'Restoring a forest from a binary tree: cut the root-level right chain and restore each node’s children',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="28" y="28">
          {L('③ 二叉树 → 森林：沿根层右链拆树', '3. Binary tree → forest: split the root-level right chain')}
        </text>
        <text className="diagram-note" x="872" y="28" textAnchor="end">
          {L('逆向转换', 'reverse conversion')}
        </text>
        <text className="diagram-note" x="28" y="50">
          {L('识别规则：左孩子 = 第一个孩子；右孩子 = 下一个兄弟；根层的右链 = 下一棵树的根。', 'Rules: left child = first child; right child = next sibling; a root-level right chain = the next tree root.')}
        </text>

        <text className="diagram-note" x="28" y="78">
          {L('二叉树：先保留所有左孩子，再找出根层的右链 A → H → J', 'Binary tree: keep every left child, then locate the root-level right chain A → H → J')}
        </text>
        <rect className="diagram-box" x="28" y="88" width="844" height="174" rx="9" />
        <TreeEdge x1="170" y1="120" x2="100" y2="139" />
        <TreeEdge x1="100" y1="171" x2="170" y2="171" sibling />
        <TreeEdge x1="100" y1="171" x2="60" y2="194" />
        <TreeEdge x1="60" y1="226" x2="120" y2="226" sibling />
        <TreeEdge x1="170" y1="171" x2="240" y2="171" sibling />
        <TreeEdge x1="240" y1="171" x2="210" y2="194" />
        <TreeEdge x1="170" y1="120" x2="390" y2="139" sibling cut />
        <TreeEdge x1="390" y1="171" x2="350" y2="194" />
        <TreeEdge x1="390" y1="171" x2="480" y2="171" sibling cut />
        <TreeBox x={170} y={104} label="A" root />
        <TreeBox x={100} y={155} label="B" />
        <TreeBox x={170} y={155} label="C" />
        <TreeBox x={240} y={155} label="D" />
        <TreeBox x={60} y={210} label="E" />
        <TreeBox x={120} y={210} label="F" />
        <TreeBox x={210} y={210} label="G" />
        <TreeBox x={390} y={155} label="H" />
        <TreeBox x={350} y={210} label="I" />
        <TreeBox x={480} y={155} label="J" />
        <text className="diagram-edge-tag diagram-cut-tag" x="280" y="122" textAnchor="middle">
          {L('断开 ①', 'cut 1')}
        </text>
        <text className="diagram-edge-tag diagram-cut-tag" x="435" y="166" textAnchor="middle">
          {L('断开 ②', 'cut 2')}
        </text>

        <text className="diagram-note" x="28" y="294">
          {L('还原后的森林：A–G、H–I、J 重新成为三棵独立树', 'Restored forest: A-G, H-I and J become three independent trees again')}
        </text>
        <rect className="diagram-box" x="28" y="306" width="844" height="200" rx="9" />

        <TreeEdge x1="160" y1="346" x2="90" y2="389" />
        <TreeEdge x1="160" y1="346" x2="160" y2="389" />
        <TreeEdge x1="160" y1="346" x2="230" y2="389" />
        <TreeEdge x1="90" y1="421" x2="50" y2="449" />
        <TreeEdge x1="90" y1="421" x2="120" y2="449" />
        <TreeEdge x1="230" y1="421" x2="230" y2="449" />
        <TreeEdge x1="430" y1="346" x2="430" y2="389" />
        <TreeBox x={160} y={330} label="A" root />
        <TreeBox x={90} y={405} label="B" />
        <TreeBox x={160} y={405} label="C" />
        <TreeBox x={230} y={405} label="D" />
        <TreeBox x={50} y={465} label="E" />
        <TreeBox x={120} y={465} label="F" />
        <TreeBox x={230} y={465} label="G" />
        <TreeBox x={430} y={330} label="H" root />
        <TreeBox x={430} y={405} label="I" />
        <TreeBox x={620} y={330} label="J" root />

        <text className="diagram-note" x="28" y="522">
          {L('C、D 回到 B 的兄弟位置；A、H、J 被拆成三棵树的根。节点数仍为 10。', 'C and D return to B’s sibling positions; A, H and J become the roots of three trees. Node count stays 10.')}
        </text>
      </svg>
    </div>
  );
}
