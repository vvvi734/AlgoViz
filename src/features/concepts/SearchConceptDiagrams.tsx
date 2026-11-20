import type { Lang } from '../../i18n/types';

export type SearchConceptDiagramKind = 'asl-decision-tree' | 'block-search';

/**
 * SEARCH-05 diagrams live in their own file so the long-standing visual polish
 * work in ConceptDiagram.tsx is not mixed with this lesson batch. Both diagrams
 * are static SVG: no trace, player or animation state.
 */
export function SearchConceptDiagram({
  kind,
  lang,
}: {
  kind: SearchConceptDiagramKind;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'asl-decision-tree') {
    const levels = [
      { y: 110, c: 1 },
      { y: 200, c: 2 },
      { y: 290, c: 3 },
    ];
    const nodes: Array<[string, string, number, number]> = [
      ['40', 'a[3]', 450, 110],
      ['20', 'a[1]', 300, 200],
      ['60', 'a[5]', 600, 200],
      ['10', 'a[0]', 180, 290],
      ['30', 'a[2]', 380, 290],
      ['50', 'a[4]', 520, 290],
      ['70', 'a[6]', 720, 290],
    ];
    const edges: Array<[number, number, number, number]> = [
      [450, 137, 300, 173],
      [450, 137, 600, 173],
      [300, 227, 180, 263],
      [300, 227, 380, 263],
      [600, 227, 520, 263],
      [600, 227, 720, 263],
    ];
    const gaps: Array<[number, string, boolean]> = [
      [42, L('(-∞,10)', '(-∞,10)'), false],
      [147, L('(10,20)', '(10,20)'), false],
      [252, L('(20,30)', '(20,30)'), false],
      [357, L('(30,40)', '(30,40)'), true],
      [462, L('(40,50)', '(40,50)'), false],
      [567, L('(50,60)', '(50,60)'), false],
      [672, L('(60,70)', '(60,70)'), false],
      [777, L('(70,∞)', '(70,∞)'), false],
    ];

    return (
      <svg
        className="concept-svg"
        viewBox="0 0 900 620"
        role="img"
        aria-label={L('7 个关键字的二分查找判定树与成功、失败区间', 'Binary-search decision tree for seven keys, with success nodes and failure gaps')}
      >
        <text className="diagram-label diagram-label-strong" x="34" y="30">
          {L('二分查找判定树：7 个关键字，成功与失败均等概率', 'Binary-search decision tree: 7 keys, equal probabilities')}
        </text>
        <text className="diagram-note" x="866" y="30" textAnchor="end">
          {L('○ 内部节点 = 成功   ▭ 外部节点 = 失败', '○ success node   ▭ failure gap')}
        </text>
        <text className="diagram-note" x="34" y="56">
          {L('有序数组 a[0..6]；mid = floor((low + high) / 2)，下标从 0 开始', 'Sorted a[0..6]; mid = floor((low + high) / 2), 0-based')}
        </text>

        {levels.map(({ y, c }, index) => (
          <g key={y}>
            <line className="diagram-guide" x1="160" y1={y} x2="860" y2={y} />
            <text className="diagram-note" x="150" y={y + 5} textAnchor="end">
              {L(`第 ${index + 1} 层 · c = ${c}`, `Level ${index + 1} · c = ${c}`)}
            </text>
          </g>
        ))}

        {edges.map(([x1, y1, x2, y2]) => (
          <line className="diagram-line" key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}

        {nodes.map(([key, indexLabel, x, y]) => (
          <g key={key}>
            <text className="diagram-note" x={x} y={y - 35} textAnchor="middle">{indexLabel}</text>
            <circle className="diagram-node-round" cx={x} cy={y} r="27" />
            <text className="diagram-node-text" x={x} y={y + 5} textAnchor="middle">{key}</text>
          </g>
        ))}

        <text className="diagram-note" x="34" y="356">
          {L('查找 35：40 → 20 → 30 → 空，经过 3 次比较后失败', 'Search 35: 40 → 20 → 30 → null, failing after three comparisons')}
        </text>
        <text className="diagram-label" x="450" y="386" textAnchor="middle">
          {L('外部节点：每个空指针对应一个失败区间', 'External nodes: every null pointer is one failure gap')}
        </text>

        {gaps.map(([x, label, active]) => (
          <g key={label}>
            <rect
              className={active ? 'diagram-chip diagram-accent' : 'diagram-chip'}
              x={x}
              y="400"
              width="94"
              height="44"
              rx="7"
            />
            <text className="diagram-label" x={x + 47} y="422" textAnchor="middle">{label}</text>
            <text className="diagram-note" x={x + 47} y="440" textAnchor="middle">{L('失败 3 次', '3 comparisons')}</text>
          </g>
        ))}

        <rect className="diagram-band" x="34" y="478" width="832" height="94" rx="9" />
        <text className="diagram-label diagram-label-strong" x="450" y="504" textAnchor="middle">
          {L('用这棵判定树计算（等概率）', 'Compute from this tree (equal probabilities)')}
        </text>
        <text className="diagram-label" x="450" y="530" textAnchor="middle">
          {L('ASL_succ = (1×1 + 2×2 + 4×3) / 7 = 17/7 ≈ 2.43', 'ASL_succ = (1×1 + 2×2 + 4×3) / 7 = 17/7 ≈ 2.43')}
        </text>
        <text className="diagram-label" x="450" y="554" textAnchor="middle">
          {L('ASL_fail = (8×3) / 8 = 3', 'ASL_fail = (8×3) / 8 = 3')}
        </text>
        <text className="diagram-note" x="450" y="602" textAnchor="middle">
          {L('约定：根为第 1 层，比较次数 c = 层号；若根的 0 基深度为 d，则 c = d + 1。', 'Convention: the root is level 1 and c = level; if its 0-based depth is d, then c = d + 1.')}
        </text>
      </svg>
    );
  }

  const blocks = [
    {
      title: L('块 1', 'Block 1'),
      max: 22,
      start: 0,
      values: [22, 12, 9, 18, 14],
      x: 38,
      cardX: 34,
      active: false,
    },
    {
      title: L('块 2', 'Block 2'),
      max: 48,
      start: 5,
      values: [48, 31, 27, 45, 39],
      x: 329,
      cardX: 325,
      active: true,
    },
    {
      title: L('块 3', 'Block 3'),
      max: 78,
      start: 10,
      values: [78, 66, 59, 72, 70],
      x: 620,
      cardX: 616,
      active: false,
    },
  ];
  const cell = 46;
  const gap = 4;

  return (
    <svg
      className="concept-svg"
      viewBox="0 0 900 540"
      role="img"
      aria-label={L('三块数据与索引表，以及查找 45 的过程', 'Three data blocks with an index table and the search for 45')}
    >
      <text className="diagram-label diagram-label-strong" x="34" y="30">
        {L('索引表按块最大关键字升序；块内元素不要求有序', 'Index ordered by block max; contents unordered')}
      </text>
      <text className="diagram-note" x="866" y="30" textAnchor="end">
        {L('示例：n = 15，b = 3，s = 5', 'n = 15, b = 3, s = 5')}
      </text>

      {blocks.map((block) => (
        <g key={block.title}>
          <rect
            className={block.active ? 'diagram-box diagram-accent' : 'diagram-box'}
            x={block.cardX}
            y="54"
            width="254"
            height="80"
            rx="9"
          />
          <text className="diagram-label diagram-label-strong" x={block.cardX + 14} y="79">
            {block.title}
          </text>
          <text className="diagram-label" x={block.cardX + 136} y="79">
            max = {block.max}
          </text>
          <text className="diagram-note" x={block.cardX + 14} y="104">
            start = {block.start} · length = 5
          </text>
          <text className="diagram-note" x={block.cardX + 14} y="123">
            {block.active
              ? L('45 ≤ 48，目标块', '45 ≤ 48, target block')
              : L('索引项：边界 + 位置', 'Index entry: bound + location')}
          </text>
        </g>
      ))}

      <line className="diagram-line diagram-directed" x1="560" y1="138" x2="560" y2="188" />
      <polygon className="diagram-arrow" points="560,192 555,181 565,181" />

      <text className="diagram-label" x="161" y="174" textAnchor="middle">
        {L('块 1：关键字 ≤ 22', 'Block 1: keys ≤ 22')}
      </text>
      <text className="diagram-label" x="452" y="174" textAnchor="middle">
        {L('块 2：22 < 关键字 ≤ 48', 'Block 2: 22 < keys ≤ 48')}
      </text>
      <text className="diagram-label" x="743" y="174" textAnchor="middle">
        {L('块 3：48 < 关键字 ≤ 78', 'Block 3: 48 < keys ≤ 78')}
      </text>

      {blocks.map((block) => (
        <g key={`${block.title}-band`}>
          {block.active && (
            <rect className="diagram-band" x={block.cardX} y="196" width="262" height="94" rx="9" />
          )}
          {block.values.map((value, index) => {
            const target = block.active && value === 45;
            return (
              <g key={`${block.title}-${index}`}>
                <rect
                  className={target ? 'diagram-cell diagram-accent' : 'diagram-cell'}
                  x={block.x + index * (cell + gap)}
                  y="232"
                  width={cell}
                  height="42"
                  rx="5"
                />
                <text className="diagram-label" x={block.x + index * (cell + gap) + 23} y="258" textAnchor="middle">
                  {value}
                </text>
                <text className="diagram-note" x={block.x + index * (cell + gap) + 23} y="300" textAnchor="middle">
                  {block.start + index}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      <text className="diagram-note" x="450" y="322" textAnchor="middle">
        {L('下标：块内仍用全局位置；索引项保存起始位置，便于直接进入对应块', 'Indices remain global; the index stores each block’s start so a block is entered directly')}
      </text>

      <rect className="diagram-band" x="34" y="350" width="832" height="160" rx="9" />
      <text className="diagram-label diagram-label-strong" x="52" y="378">
        {L('查找 45 的过程', 'Searching for 45')}
      </text>
      <text className="diagram-note" x="52" y="406">
        {L('① 索引顺序比较：45 > 22，跳过块 1；45 ≤ 48，锁定块 2（2 次）', '1. Index: 45 > 22 → skip block 1; 45 ≤ 48 → block 2 (2)')}
      </text>
      <text className="diagram-note" x="52" y="432">
        {L('② 块内顺序比较：48、31、27、45 → 命中（4 次）', '2. Block scan: 48, 31, 27, 45 → hit (4)')}
      </text>
      <text className="diagram-note" x="52" y="458">
        {L('③ 合计 2 + 4 = 6 次；若查 46，则扫完 5 个仍失败，共 7 次', '3. Total 2 + 4 = 6; searching 46 scans all five and fails, for 7')}
      </text>
      <text className="diagram-note" x="52" y="486">
        {L('不能对块 2 直接二分：块内元素并未排序', 'Do not binary-search block 2: its keys are not sorted')}
      </text>

      <rect className="diagram-box diagram-accent" x="642" y="368" width="210" height="122" rx="9" />
      <text className="diagram-label diagram-label-strong" x="747" y="396" textAnchor="middle">
        {L('命中 45：6 次比较', '45 found: 6 comparisons')}
      </text>
      <text className="diagram-note" x="747" y="424" textAnchor="middle">
        {L('2 次索引 + 4 次块内', '2 index + 4 in-block')}
      </text>
      <text className="diagram-note" x="747" y="450" textAnchor="middle">
        {L('失败 46：2 + 5 = 7 次', '46 absent: 2 + 5 = 7')}
      </text>
      <text className="diagram-note" x="747" y="474" textAnchor="middle">
        {L('无通用固定值', 'No universal fixed value')}
      </text>
    </svg>
  );
}
