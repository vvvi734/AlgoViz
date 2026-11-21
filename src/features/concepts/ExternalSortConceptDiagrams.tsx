import type { Lang } from '../../i18n/types';
import '../../styles/externalSort.css';

export type ExternalSortConceptDiagramKind =
  | 'external-sort'
  | 'external-runs'
  | 'external-comparison';

export function ExternalSortConceptDiagram({
  kind,
  lang,
}: {
  kind: ExternalSortConceptDiagramKind;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'external-sort') {
    return (
      <svg
        className="concept-svg external-concept-svg"
        viewBox="0 0 940 520"
        role="img"
        aria-label={L(
          '外存记录分批读入内存，形成初始归并段，再多路归并成完整有序文件',
          'External records enter memory in batches, form initial runs, and are multiway-merged into one sorted file',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="28" y="30">
          {L('为什么不能一次全部读入：外存 → 内存批次 → 初始归并段 → 多路归并', 'Why not load everything: disk → memory batch → initial runs → multiway merge')}
        </text>
        <text className="diagram-note" x="912" y="30" textAnchor="end">
          {L('教学模拟 · 不代表浏览器真实磁盘访问', 'teaching model · not real browser disk access')}
        </text>

        <rect className="diagram-band" x="24" y="58" width="250" height="232" rx="12" />
        <text className="diagram-label" x="42" y="82">{L('外存中的大文件', 'Large file on external storage')}</text>
        <text className="diagram-note" x="42" y="102">{L('记录数 n 远大于内存容量', 'n records far exceed memory')}</text>
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            {[0, 1, 2, 3].map((col) => (
              <rect
                key={col}
                className={row === 0 && col < 2 ? 'diagram-chip diagram-accent' : 'diagram-chip'}
                x={44 + col * 52}
                y={120 + row * 32}
                width="44"
                height="24"
                rx="4"
              />
            ))}
            <text className="diagram-note" x="264" y={137 + row * 32} textAnchor="end">
              {L(`块 B${row}`, `block B${row}`)}
            </text>
          </g>
        ))}
        <text className="diagram-note" x="42" y="282">
          {L('按数据块读，不能随机装下整个文件', 'read by blocks; the whole file cannot fit')}
        </text>

        <path className="diagram-line" d="M278 174 C320 174, 320 174, 356 174" markerEnd="url(#ext-arrow-a)" />
        <defs>
          <marker id="ext-arrow-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="external-arrow-head" />
          </marker>
        </defs>
        <text className="diagram-note" x="317" y="162" textAnchor="middle">{L('读块', 'read block')}</text>

        <rect className="diagram-band diagram-accent" x="356" y="58" width="246" height="232" rx="12" />
        <text className="diagram-label" x="374" y="82">{L('内存工作区（容量有限）', 'Memory workspace (limited)')}</text>
        <text className="diagram-note" x="374" y="102">{L('只装入一批记录，内部排序', 'load one batch and sort in memory')}</text>
        {[0, 1, 2, 3].map((row) => (
          <rect className="diagram-cell" key={row} x="376" y="118 + row * 34" width="204" height="27" rx="5" />
        ))}
        {['7, 3, 9', '1, 8, 2', '6, 4, 5', '…'].map((value, row) => (
          <text className="diagram-node-text" key={value} x="478" y={137 + row * 34} textAnchor="middle">{value}</text>
        ))}
        <text className="diagram-note" x="374" y="276">
          {L('内存只能容纳 M 条；内部排序后写成一个有序段', 'memory holds M records; internal sort writes one ordered run')}
        </text>

        <path className="diagram-line" d="M604 174 C640 174, 640 174, 672 174" markerEnd="url(#ext-arrow-a)" />
        <text className="diagram-note" x="638" y="162" textAnchor="middle">{L('写成段', 'write run')}</text>

        <rect className="diagram-band" x="672" y="58" width="244" height="232" rx="12" />
        <text className="diagram-label" x="690" y="82">{L('初始归并段（已各自有序）', 'Initial runs (each internally sorted)')}</text>
        {['R1: 1, 2, 3, 8', 'R2: 4, 5, 6, 7', 'R3: 9, 10, 11'].map((run, index) => (
          <g key={run}>
            <rect className={index === 0 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="690" y={104 + index * 48} width="208" height="34" rx="6" />
            <text className="diagram-label" x="794" y={126 + index * 48} textAnchor="middle">{run}</text>
          </g>
        ))}
        <text className="diagram-note" x="690" y="276">
          {L('段数 m = 归并段个数；每段内部有序', 'm = number of runs; each run is internally sorted')}
        </text>

        <path className="diagram-line" d="M480 314 L480 346" markerEnd="url(#ext-arrow-a)" />
        <text className="diagram-note" x="500" y="337">
          {L('k 路归并：每段一个输入缓冲区 + 一个输出缓冲区', 'k-way merge: one input buffer per run + one output buffer')}
        </text>

        <rect className="diagram-band" x="24" y="350" width="892" height="140" rx="12" />
        {['R1 缓冲', 'R2 缓冲', 'R3 缓冲'].map((label, index) => (
          <g key={label}>
            <rect className="diagram-cell" x={48 + index * 154} y="370" width="134" height="54" rx="7" />
            <text className="diagram-label" x={115 + index * 154} y="392" textAnchor="middle">{label}</text>
            <text className="diagram-note" x={115 + index * 154} y="410" textAnchor="middle">
              {L('当前候选 → 比较', 'head candidate → compare')}
            </text>
          </g>
        ))}
        <text className="diagram-label" x="526" y="392" textAnchor="middle">{L('选出最小 → 输出缓冲区', 'choose minimum → output buffer')}</text>
        <text className="diagram-note" x="526" y="412" textAnchor="middle">{L('满块后写回外存', 'flush a full block')}</text>
        <rect className="diagram-chip diagram-accent" x="620" y="368" width="124" height="58" rx="7" />
        <text className="diagram-label" x="682" y="392" textAnchor="middle">{L('输出缓冲区', 'output buffer')}</text>
        <text className="diagram-note" x="682" y="410" textAnchor="middle">{L('满块写出', 'flush when full')}</text>
        <path className="diagram-line" d="M748 397 L784 397" markerEnd="url(#ext-arrow-a)" />
        <rect className="diagram-band" x="788" y="366" width="108" height="62" rx="8" />
        <text className="diagram-label" x="842" y="391" textAnchor="middle">{L('有序文件', 'sorted file')}</text>
        <text className="diagram-note" x="842" y="410" textAnchor="middle">{L('最终结果', 'final result')}</text>
        <text className="diagram-note" x="48" y="452">
          {L('归并趟数 s = ⌈log_k m⌉；I/O 次数 = 读写的数据块数量，通常远大于内存中的比较次数。', 'Merge passes s = ⌈log_k m⌉; I/O counts are block reads/writes and usually dominate in-memory comparisons.')}
        </text>
        <text className="diagram-note" x="48" y="474">
          {L('因此外部排序优化的核心是减少读写块数，而不是只盯着内部排序的比较次数。', 'The main optimisation is reducing block I/O, not only counting comparisons inside memory.')}
        </text>
      </svg>
    );
  }

  if (kind === 'external-runs') {
    return (
      <svg
        className="concept-svg external-concept-svg"
        viewBox="0 0 940 520"
        role="img"
        aria-label={L(
          '初始归并段生成：内存分批内部排序，以及置换选择的冻结与解冻',
          'Building initial runs: internal sorting of memory batches, plus freezing and unfreezing in replacement selection',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="28" y="30">
          {L('初始归并段：先把无序文件变成若干条内部有序的“段”', 'Initial runs: turn an unordered file into internally ordered segments')}
        </text>
        <text className="diagram-note" x="912" y="30" textAnchor="end">
          {L('段长可以不同；置换选择可超过工作区容量', 'run lengths may differ; replacement selection can exceed workspace capacity')}
        </text>

        <rect className="diagram-band" x="24" y="54" width="430" height="204" rx="12" />
        <text className="diagram-label" x="42" y="78">{L('方法 A：内存分批 + 内部排序', 'Method A: memory batches + internal sort')}</text>
        <text className="diagram-note" x="42" y="98">{L('工作区容量固定为 M，每次装入 M 条', 'workspace capacity M; load M records at a time')}</text>
        {['7, 3, 9, 1', '8, 2, 6, 4', '5, …'].map((batch, index) => (
          <g key={batch}>
            <rect className="diagram-cell" x="44" y={112 + index * 36} width="144" height="28" rx="5" />
            <text className="diagram-label" x="116" y={131 + index * 36} textAnchor="middle">{batch}</text>
            <text className="diagram-note" x="200" y={131 + index * 36}>{L('内部排序', 'sort internally')}</text>
            <path className="diagram-line" d={`M292 ${126 + index * 36} L330 ${126 + index * 36}`} markerEnd="url(#ext-arrow-b)" />
            <text className="diagram-label" x="398" y={131 + index * 36} textAnchor="middle">
              {[L('R1: 1, 3, 7, 9', 'R1: 1, 3, 7, 9'), L('R2: 2, 4, 6, 8', 'R2: 2, 4, 6, 8'), L('R3: 5, …', 'R3: 5, …')][index]}
            </text>
          </g>
        ))}
        <defs>
          <marker id="ext-arrow-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="external-arrow-head" />
          </marker>
        </defs>
        <text className="diagram-note" x="42" y="238">{L('每段长度约等于 M；段之间没有次序关系', 'each run is about M long; runs are not ordered relative to one another')}</text>

        <rect className="diagram-band diagram-accent" x="474" y="54" width="442" height="204" rx="12" />
        <text className="diagram-label" x="492" y="78">{L('方法 B：置换选择（工作区 3 槽）', 'Method B: replacement selection (3 slots)')}</text>
        <text className="diagram-note" x="492" y="98">{L('每次输出可输出的最小值，再读入下一条', 'repeatedly emit the smallest eligible record, then read one more')}</text>
        {['可输出 8', '冻结 3', '可输出 9'].map((label, index) => (
          <g key={label}>
            <rect className={index === 1 ? 'diagram-chip external-frozen-chip' : 'diagram-cell'} x={500 + index * 132} y="116" width="116" height="42" rx="6" />
            <text className="diagram-label" x={558 + index * 132} y="141" textAnchor="middle">{label}</text>
          </g>
        ))}
        <text className="diagram-note" x="492" y="178">
          {L('上次输出 = 7：新读入 8 ≥ 7 可继续；3 < 7 冻结到下一段', 'last output = 7: new 8 ≥ 7 stays eligible; 3 < 7 is frozen for the next run')}
        </text>
        <path className="diagram-line" d="M558 164 L558 190" markerEnd="url(#ext-arrow-b)" />
        <rect className="diagram-chip" x="500" y="194" width="324" height="32" rx="6" />
        <text className="diagram-label" x="662" y="215" textAnchor="middle">
          {L('当前段 R1：1, 4, 5, 7, 8, 9 … 长度可超过 3', 'current run R1: 1, 4, 5, 7, 8, 9 … length may exceed 3')}
        </text>
        <text className="diagram-note" x="492" y="242">
          {L('当前段无可输出记录时封段；解冻冻结记录，开始下一段。', 'close the run when nothing is eligible; unfreeze frozen records to start the next run.')}
        </text>

        <rect className="diagram-band" x="24" y="286" width="892" height="186" rx="12" />
        <text className="diagram-label" x="42" y="310">{L('段的边界与长度的意义', 'Why run boundaries and lengths matter')}</text>
        {[
          [L('R1', 'R1'), '1, 2, 3, 4', 190],
          [L('R2', 'R2'), '5, 6, 7', 150],
          [L('R3', 'R3'), '8, 9', 110],
          [L('R4', 'R4'), '10, 11, 12, 13, 14', 220],
        ].map(([name, values, width], index) => (
          <g key={String(name)}>
            <text className="diagram-label" x="48" y={338 + index * 31}>{name}</text>
            <rect className="diagram-chip" x="92" y={322 + index * 31} width={Number(width)} height="24" rx="4" />
            <text className="diagram-label" x={100 + Number(width) / 2} y={339 + index * 31} textAnchor="middle">{values}</text>
            <text className="diagram-note" x={96 + Number(width) + 10} y={339 + index * 31}>
              {L(`长度 ${String(values).split(',').length}`, `length ${String(values).split(',').length}`)}
            </text>
          </g>
        ))}
        <text className="diagram-note" x="474" y="344">
          {L('段数 m 越少，后续归并趟数越少。', 'Fewer runs m means fewer later merge passes.')}
        </text>
        <text className="diagram-note" x="474" y="368">
          {L('段长不等时，归并顺序会影响总代价 → 最佳归并树。', 'With unequal lengths, merge order affects total cost → optimal merge tree.')}
        </text>
        <text className="diagram-note" x="474" y="392">
          {L('置换选择的“冻结”不是丢弃：记录仍在工作区，等下一段解冻。', 'A frozen record is not discarded: it stays in the workspace until the next run unfreezes it.')}
        </text>
        <text className="diagram-note" x="42" y="452">
          {L('初始段内部必须有序；所有段合起来的多重集合必须与原文件完全相同。', 'Every initial run must be internally sorted, and the multiset of all runs must equal the original file.')}
        </text>
      </svg>
    );
  }

  return (
    <svg
      className="concept-svg external-concept-svg"
      viewBox="0 0 940 520"
      role="img"
      aria-label={L(
        '二路归并、四路归并与最佳归并树的代价对比',
        'Cost comparison: two-way merge, four-way merge and the optimal merge tree',
      )}
    >
      <text className="diagram-label diagram-label-strong" x="28" y="30">
        {L('外部排序方法比较：先看 I/O 趟数，再看内存比较与段长结构', 'Compare external sorts by I/O passes, then in-memory comparisons and run lengths')}
      </text>

      <rect className="diagram-band" x="24" y="52" width="284" height="276" rx="12" />
      <text className="diagram-label" x="42" y="78">{L('二路平衡归并（8 段）', 'Two-way balanced merge (8 runs)')}</text>
      {[0, 1, 2].map((level) => (
        <text className="diagram-note" x="42" y={106 + level * 30} key={level}>
          {L(`第 ${level + 1} 趟：${8 / 2 ** level} → ${8 / 2 ** (level + 1)} 段`, `pass ${level + 1}: ${8 / 2 ** level} → ${8 / 2 ** (level + 1)} runs`)}
        </text>
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <rect className="diagram-chip" key={index} x={42 + index * 31} y="196" width="26" height="22" rx="3" />
      ))}
      <text className="diagram-note" x="42" y="234">{L('叶子 = 8 个初始段', 'leaves = 8 initial runs')}</text>
      <text className="diagram-note" x="42" y="258">{L('3 趟；每趟读写整份数据', '3 passes; every pass rewrites the data')}</text>
      <text className="diagram-note" x="42" y="282">{L('每条约记录比较 1 次（2 选 1）', 'one comparison per output (1 of 2)')}</text>

      <rect className="diagram-band" x="326" y="52" width="284" height="276" rx="12" />
      <text className="diagram-label" x="344" y="78">{L('四路平衡归并（8 段）', 'Four-way balanced merge (8 runs)')}</text>
      {[0, 1].map((level) => (
        <text className="diagram-note" x="344" y={106 + level * 30} key={level}>
          {L(`第 ${level + 1} 趟：${8 / 4 ** level} → ${8 / 4 ** (level + 1)} 段`, `pass ${level + 1}: ${8 / 4 ** level} → ${8 / 4 ** (level + 1)} runs`)}
        </text>
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <rect className="diagram-chip" key={index} x={344 + index * 31} y="196" width="26" height="22" rx="3" />
      ))}
      <text className="diagram-note" x="344" y="234">{L('2 趟；I/O 趟数更少', '2 passes; fewer I/O passes')}</text>
      <text className="diagram-note" x="344" y="258">{L('但每条要比较 3 次（4 选 1）', 'but 3 comparisons per output (1 of 4)')}</text>
      <text className="diagram-note" x="344" y="282">{L('败者树可把每条比较降到 O(log k)', 'a loser tree reduces this to O(log k) per record')}</text>

      <rect className="diagram-band diagram-accent" x="628" y="52" width="288" height="276" rx="12" />
      <text className="diagram-label" x="646" y="78">{L('最佳归并树（段长不等）', 'Optimal merge tree (unequal runs)')}</text>
      {[
        ['R1=3', 646, 112],
        ['R2=5', 700, 112],
        ['R3=8', 754, 112],
        ['R4=11', 808, 112],
      ].map(([label, x, y]) => (
        <g key={String(label)}>
          <rect className="diagram-chip" x={Number(x)} y={Number(y)} width="46" height="24" rx="4" />
          <text className="diagram-note" x={Number(x) + 23} y={Number(y) + 16} textAnchor="middle">{label}</text>
        </g>
      ))}
      <path className="diagram-line" d="M669 136 L692 176 M723 136 L704 176" markerEnd="url(#ext-arrow-c)" />
      <defs>
        <marker id="ext-arrow-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="external-arrow-head" />
        </marker>
      </defs>
      <rect className="diagram-tree-node" x="668" y="176" width="76" height="34" rx="6" />
      <text className="diagram-label" x="706" y="198" textAnchor="middle">{L('8', '8')}</text>
      <text className="diagram-note" x="760" y="198">{L('代价 +8', 'cost +8')}</text>
      <path className="diagram-line" d="M706 210 L706 242 M831 136 L720 242" markerEnd="url(#ext-arrow-c)" />
      <rect className="diagram-tree-node is-root" x="662" y="242" width="116" height="36" rx="6" />
      <text className="diagram-label" x="720" y="265" textAnchor="middle">{L('根 27 · 总代价 51', 'root 27 · total 51')}</text>
      <text className="diagram-note" x="646" y="306">{L('短段先合并：3 + 5 = 8，再与 8 合并为 16，最后与 11 合并为根 27；总代价 = 8 + 16 + 27 = 51。', 'merge short runs first: 3 + 5 = 8, then 8 + 8 = 16, then 16 + 11 = root 27; total = 8 + 16 + 27 = 51.')}</text>

      <rect className="diagram-band" x="24" y="350" width="892" height="132" rx="12" />
      <text className="diagram-label" x="42" y="375">{L('三个维度一起看', 'Three dimensions together')}</text>
      <text className="diagram-note" x="42" y="400">{L('I/O 趟数：增大 k 通常减少归并趟数 s = ⌈log_k m⌉，但需要更多输入缓冲区和更大的 k 选 1 比较结构。', 'I/O passes: larger k usually reduces s = ⌈log_k m⌉, but needs more input buffers and a larger k-way selection structure.')}</text>
      <text className="diagram-note" x="42" y="426">{L('内存比较：线性扫描 k 个候选是 O(k)；败者树沿一条路径更新是 O(log k)，但空间与实现更复杂。', 'In-memory comparison: a linear scan costs O(k); a loser tree updates one path in O(log k) with extra space and complexity.')}</text>
      <text className="diagram-note" x="42" y="452">{L('段长结构：段长不等时，按最小权重优先合并可降低总记录处理量；k 路满树不足时要补零权重虚拟叶。', 'Run lengths: with unequal lengths, merging lightest roots first lowers total processed records; a full k-ary tree may need zero-weight virtual leaves.')}</text>
    </svg>
  );
}
