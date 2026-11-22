import type { Lang } from '../../i18n/types';

/**
 * Static teaching diagram for "choosing a sort: multi-key, LSD/MSD and chained
 * buckets". It deliberately shows the record chains and bucket heads/tails;
 * the generic `sorting` diagram only explains stability.
 */
export function SortingComparisonDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  const chip = (
    x: number,
    y: number,
    width: number,
    label: string,
    key: string,
    testId: string,
  ) => (
    <g data-testid={testId} data-record-key={key}>
      <rect className="diagram-chip" x={x} y={y} width={width} height="30" rx="5" />
      <text className="diagram-node-text" x={x + width / 2} y={y + 21} textAnchor="middle">
        {label}
      </text>
    </g>
  );

  const arrow = (x1: number, x2: number, y: number, testId?: string) => (
    <g data-testid={testId}>
      <line className="diagram-line" x1={x1} y1={y} x2={x2 - 8} y2={y} />
      <polygon className="diagram-arrow" points={`${x2},${y} ${x2 - 8},${y - 5} ${x2 - 8},${y + 5}`} />
    </g>
  );

  return (
    <svg
      className="concept-svg"
      viewBox="0 0 760 500"
      role="img"
      data-testid="sorting-comparison-svg"
      aria-label={L(
        'LSD 两趟稳定分配与链式桶示意，同一主关键字下保留次关键字次序',
        'Two stable LSD passes with chained buckets, preserving secondary-key order within equal primary keys',
      )}
    >
      <text className="diagram-label diagram-label-strong" x="28" y="28">
        {L(
          'LSD 两趟：先个位、后十位；桶内 FIFO，链头到尾收集',
          'LSD: ones then tens; FIFO buckets, head-to-tail collection',
        )}
      </text>
      <text className="diagram-note" x="732" y="28" textAnchor="end">
        {L('记录 A=23, B=12, C=21', 'records A=23, B=12, C=21')}
      </text>

      <rect className="diagram-box" x="24" y="48" width="340" height="176" rx="10" />
      <text className="diagram-label" x="42" y="72">
        {L('第 1 趟：按个位分配', 'Pass 1: distribute by ones')}
      </text>
      <text className="diagram-note diagram-note-compact" x="42" y="90">
        {L('LSD 从最低位开始', 'LSD starts at the lowest digit')}
      </text>
      <text className="diagram-note diagram-note-compact" x="42" y="108">
        {L('初始链', 'initial chain')}
      </text>
      {chip(42, 116, 86, 'A 23', '23', 'sorting-comparison-initial-a')}
      {arrow(128, 146, 131)}
      {chip(146, 116, 86, 'B 12', '12', 'sorting-comparison-initial-b')}
      {arrow(232, 250, 131)}
      {chip(250, 116, 86, 'C 21', '21', 'sorting-comparison-initial-c')}
      <text className="diagram-note diagram-note-compact" x="42" y="166">
        {L('个位 3/2/1 → 桶 3/2/1', 'ones 3/2/1 → buckets 3/2/1')}
      </text>
      <text className="diagram-label" x="42" y="188">
        {L('收集：C(21) → B(12) → A(23)', 'collected: C(21) → B(12) → A(23)')}
      </text>
      <text className="diagram-note diagram-note-compact" x="42" y="208">
        {L('同桶记录按进入次序排队。', 'Records in one bucket keep arrival order.')}
      </text>

      <rect className="diagram-box" x="380" y="48" width="356" height="176" rx="10" />
      <text className="diagram-label" x="398" y="72">
        {L('第 1 趟桶头 / 桶尾', 'Pass 1 bucket heads / tails')}
      </text>
      {[1, 2, 3].map((digit, index) => {
        const y = 92 + index * 38;
        const record = digit === 1 ? ['C 21', '21'] : digit === 2 ? ['B 12', '12'] : ['A 23', '23'];
        const test = `sorting-comparison-pass1-bucket-${digit}`;
        return (
          <g key={digit} data-testid={test} data-bucket-digit={digit}>
            <rect className="diagram-cell" x="398" y={y} width="66" height="30" rx="4" />
            <text className="diagram-cell-label" x="431" y={y + 20} textAnchor="middle">
              {L(`桶 ${digit}`, `bucket ${digit}`)}
            </text>
            {arrow(466, 482, y + 15)}
            {chip(482, y, 92, record[0], record[1], `${test}-node`)}
            <text className="diagram-note" x="582" y={y + 20}>
              {L('head = tail', 'head = tail')}
            </text>
          </g>
        );
      })}
      <text className="diagram-note diagram-note-compact" x="398" y="214">
        {L('空桶不写尾指针；收集按桶号 1 → 2 → 3。', 'Empty buckets have no tail; collect 1 → 2 → 3.')}
      </text>

      <rect className="diagram-box" x="24" y="244" width="340" height="176" rx="10" />
      <text className="diagram-label" x="42" y="268">
        {L('第 2 趟：按十位分配', 'Pass 2: distribute by tens')}
      </text>
      <text className="diagram-note diagram-note-compact" x="42" y="288">
        {L('上一趟结果 C → B → A', 'previous result C → B → A')}
      </text>
      {chip(42, 300, 86, 'C 21', '21', 'sorting-comparison-pass2-input-c')}
      {arrow(128, 146, 315)}
      {chip(146, 300, 86, 'B 12', '12', 'sorting-comparison-pass2-input-b')}
      {arrow(232, 250, 315)}
      {chip(250, 300, 86, 'A 23', '23', 'sorting-comparison-pass2-input-a')}
      <text className="diagram-label" x="42" y="352">
        {L('最终：B(12) → C(21) → A(23)', 'final: B(12) → C(21) → A(23)')}
      </text>
      <text className="diagram-note diagram-note-compact" x="42" y="372">
        {L('十位 2 下：C、A 保持第 1 趟先后。', 'Tens key 2: C and A keep pass-1 order.')}
      </text>
      <text className="diagram-note diagram-note-compact" x="42" y="392">
        {L('先次键、后主键：21 在 23 前。', 'Secondary first, primary last: 21 before 23.')}
      </text>

      <rect className="diagram-box" x="380" y="244" width="356" height="176" rx="10" />
      <text className="diagram-label" x="398" y="268">
        {L('第 2 趟桶链：桶 2 串起两条记录', 'Pass 2 chains: bucket 2 holds two records')}
      </text>
      {[
        { digit: 1, records: [['B 12', '12']] },
        { digit: 2, records: [['C 21', '21'], ['A 23', '23']] },
        { digit: 3, records: [] as string[][] },
      ].map(({ digit, records }, index) => {
        const y = 288 + index * 44;
        const pointers =
          records.length === 0
            ? [L('empty', 'empty')]
            : records.length === 1
              ? [L('head = tail', 'head = tail')]
              : [L('头 C', 'head C'), L('尾 A', 'tail A')];
        return (
          <g key={digit} data-testid={`sorting-comparison-pass2-bucket-${digit}`} data-bucket-digit={digit}>
            <rect className="diagram-cell" x="398" y={y} width="66" height="30" rx="4" />
            <text className="diagram-cell-label" x="431" y={y + 20} textAnchor="middle">
              {L(`桶 ${digit}`, `bucket ${digit}`)}
            </text>
            {records.map((record, recordIndex) => {
              const x = 482 + recordIndex * 92;
              return (
                <g key={record[1]} data-testid={`sorting-comparison-pass2-bucket-${digit}-${record[1]}`}>
                  {recordIndex > 0 ? arrow(x - 10, x, y + 15) : arrow(466, x, y + 15)}
                  {chip(x, y, 82, record[0], record[1], `sorting-comparison-pass2-node-${record[1]}`)}
                </g>
              );
            })}
            {pointers.map((pointer, index) => (
              <text
                key={pointer}
                className="diagram-note diagram-note-compact"
                x="660"
                y={y + (pointers.length === 2 ? 12 : 20) + index * 19}
              >
                {pointer}
              </text>
            ))}
          </g>
        );
      })}

      <rect className="diagram-band" x="24" y="424" width="712" height="70" rx="9" />
      <text className="diagram-label" x="380" y="444" textAnchor="middle">
        {L(
          'LSD：最低位 → 最高位，逐趟稳定分配/收集；MSD：最高位 → 低位，按组递归。',
          'LSD: low→high, stable each pass; MSD: high→low, recurse by group.',
        )}
      </text>
      <text className="diagram-note diagram-note-compact" x="380" y="462" textAnchor="middle">
        {L(
          '同主键的次键次序靠桶内 FIFO 保留；链式桶只改链接，避免整条记录搬动。',
          'FIFO buckets preserve secondary order; chaining moves links, not records.',
        )}
      </text>
      <text
        className="diagram-note diagram-note-compact"
        x="380"
        y="480"
        textAnchor="middle"
        data-testid="sorting-comparison-selection"
      >
        {L(
          '选择条件：关键字可按位分解；LSD 每趟分配/收集必须稳定；桶数 b 与基数匹配。',
          'Selection conditions: keys split into digits; each LSD pass is stable; b matches the radix.',
        )}
      </text>
    </svg>
  );
}
