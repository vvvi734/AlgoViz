import type { Lang } from '../../i18n/types';
import type { ConceptDiagramKind } from '../../domain/concepts/types';

/**
 * TEXTBOOK-01 static diagrams for the three new storage/recursion pages.
 * They are deliberately declarative SVG: no animation, no trace and no editor.
 * Keeping them in a separate module avoids growing ConceptDiagram.tsx, which
 * already carries the older chapter diagrams.
 */
export function StorageConceptDiagram({
  kind,
  lang,
}: {
  kind: Extract<ConceptDiagramKind, 'static-linked-list' | 'stack-recursion' | 'string-storage'>;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'static-linked-list') {
    const cells = [
      { index: 1, data: 'A', next: '2', used: true },
      { index: 2, data: 'C', next: '3', used: true },
      { index: 3, data: 'E', next: 'NULL', used: true },
      { index: 4, data: '—', next: '5', used: false },
      { index: 5, data: '—', next: '6', used: false },
      { index: 6, data: '—', next: 'NULL', used: false },
    ];
    const xFor = (index: number) => 66 + (index - 1) * 136;
    return (
      <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 430"
        role="img"
        aria-label={L('静态链表的数组、游标与空闲链表', 'Static linked list with cursors and a free list')}
      >
        <text className="diagram-label diagram-label-strong" x="34" y="30">
          {L('一条链存放在数组里：next 是下标，不是地址', 'One chain inside an array: next is an index, not an address')}
        </text>

        <text className="diagram-label" x={xFor(1) + 59} y="88" textAnchor="middle">
          head = 1
        </text>
        <line className="diagram-line" x1={xFor(1) + 59} y1="96" x2={xFor(1) + 59} y2="112" />
        <polygon className="diagram-arrow" points={`${xFor(1) + 59},120 ${xFor(1) + 54},111 ${xFor(1) + 64},111`} />

        <text className="diagram-label" x={xFor(4) + 59} y="88" textAnchor="middle">
          freeHead = 4
        </text>
        <line className="diagram-line" x1={xFor(4) + 59} y1="96" x2={xFor(4) + 59} y2="112" />
        <polygon className="diagram-arrow" points={`${xFor(4) + 59},120 ${xFor(4) + 54},111 ${xFor(4) + 64},111`} />

        {cells.map((cell) => {
          const x = xFor(cell.index);
          return (
            <g key={cell.index}>
              <rect
                className={`diagram-box ${cell.used ? '' : 'diagram-cell-free'}`}
                x={x}
                y="120"
                width="118"
                height="84"
                rx="6"
              />
              <text className="diagram-note" x={x + 10} y="138">
                {`[${cell.index}]`}
              </text>
              <rect className="diagram-cell" x={x + 8} y="145" width="102" height="26" rx="3" />
              <text className="diagram-label" x={x + 59} y="164" textAnchor="middle">
                {cell.data}
              </text>
              <text className="diagram-note" x={x + 8} y="188">
                {L('游标', 'cursor')}
              </text>
              <text className="diagram-label" x={x + 110} y="188" textAnchor="end">
                {cell.next}
              </text>
            </g>
          );
        })}

        {[1, 2, 4, 5].map((index) => {
          const x = xFor(index);
          return (
            <g key={`link-${index}`}>
              <line className="diagram-line" x1={x + 119} y1="178" x2={x + 134} y2="178" />
              <polygon className="diagram-arrow" points={`${x + 136},178 ${x + 128},173 ${x + 128},183`} />
            </g>
          );
        })}

        <rect className="diagram-band" x="34" y="228" width="832" height="76" rx="8" />
        <text className="diagram-label" x="52" y="254">
          {L('有效链：head → [1] A → [2] C → [3] E → NULL', 'Data chain: head → [1] A → [2] C → [3] E → NULL')}
        </text>
        <text className="diagram-label" x="52" y="282">
          {L('空闲链：freeHead → [4] → [5] → [6] → NULL', 'Free chain: freeHead → [4] → [5] → [6] → NULL')}
        </text>

        <text className="diagram-note" x="34" y="330">
          {L('虚线单元 = 可复用空槽；它们靠 next 串成空闲链表', 'Dashed cells are reusable free slots linked by next')}
        </text>
        <text className="diagram-note" x="34" y="354">
          {L('插入：取空闲链首元 → 先接后继 → 再改前驱 next', 'Insert: take free-list head → link successor → rewrite predecessor next')}
        </text>
        <text className="diagram-note" x="34" y="378">
          {L('删除：绕过目标 → 把它的 next 指向 freeHead → 更新 freeHead', 'Delete: bypass target → point its next at freeHead → update freeHead')}
        </text>
        <text className="diagram-label" x="34" y="412">
          {L('游标约定必须全表统一：图示用 NULL；教材实现常用 0 号单元作头结点', 'One null convention must hold everywhere: this diagram uses NULL; textbook implementations often reserve slot 0 as a header')}
        </text>
      </svg>
    );
  }

  if (kind === 'stack-recursion') {
    const frames = [
      { call: 'F(3)', n: 'n = 3', state: L('等待 3 × F(2)', 'waiting for 3 × F(2)'), result: '→ 6', top: false },
      { call: 'F(2)', n: 'n = 2', state: L('等待 2 × F(1)', 'waiting for 2 × F(1)'), result: '→ 2', top: false },
      { call: 'F(1)', n: 'n = 1', state: L('等待 1 × F(0)', 'waiting for 1 × F(0)'), result: '→ 1', top: false },
      { call: 'F(0)', n: 'n = 0', state: L('命中递归基，直接返回', 'base case, returns at once'), result: '→ 1', top: true },
    ];
    return (
      <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 430"
        role="img"
        aria-label={L('递归调用栈的压帧与返回过程', 'Recursive call stack: pushing and returning frames')}
      >
        <text className="diagram-label diagram-label-strong" x="34" y="30">
          {L('factorial(3)：先逐层压栈，再逐层返回', 'factorial(3): push layer by layer, then return layer by layer')}
        </text>

        <text className="diagram-label diagram-label-strong" x="34" y="68">
          {L('调用链', 'Call chain')}
        </text>
        {[
          ['F(3)', '3 × F(2)'],
          ['F(2)', '2 × F(1)'],
          ['F(1)', '1 × F(0)'],
          ['F(0)', 'return 1'],
        ].map(([call, body], index) => (
          <g key={call}>
            <rect className="diagram-box" x="34" y={84 + index * 54} width="330" height="40" rx="7" />
            <text className="diagram-label" x="50" y={109 + index * 54}>
              {call}
            </text>
            <text className="diagram-note" x="118" y={109 + index * 54}>
              {body}
            </text>
            {index < 3 ? (
              <>
                <line className="diagram-line" x1="199" y1={125 + index * 54} x2="199" y2={137 + index * 54} />
                <polygon className="diagram-arrow" points={`199,${141 + index * 54} 194,${133 + index * 54} 204,${133 + index * 54}`} />
              </>
            ) : null}
          </g>
        ))}

        <text className="diagram-label" x="398" y="68">
          {L('调用栈', 'Call stack')}
        </text>
        <text className="diagram-note" x="398" y="94">
          {L('栈顶 = 当前执行帧', 'top = frame currently running')}
        </text>
        {frames.map((frame, index) => {
          const y = 108 + index * 66;
          return (
            <g key={frame.call}>
              <rect
                className={`diagram-box ${frame.top ? 'diagram-accent' : ''}`}
                x="398"
                y={y}
                width="460"
                height="56"
                rx="8"
              />
              <text className="diagram-label diagram-label-strong" x="414" y={y + 23}>
                {frame.call}
              </text>
              <text className="diagram-note" x="414" y={y + 45}>
                {frame.n}
              </text>
              <text className="diagram-note" x="484" y={y + 23}>
                {frame.state}
              </text>
              <text className="diagram-label" x="840" y={y + 45} textAnchor="end">
                {frame.result}
              </text>
            </g>
          );
        })}

        <line className="diagram-line" x1="378" y1="96" x2="378" y2="354" />
        <polygon className="diagram-arrow" points="378,361 373,352 383,352" />
        <text className="diagram-note" x="368" y="200" textAnchor="end" transform="rotate(-90 368 200)">
          {L('压栈方向 →', 'push direction →')}
        </text>
        <line className="diagram-line" x1="866" y1="354" x2="866" y2="96" />
        <polygon className="diagram-arrow" points="866,89 861,98 871,98" />
        <text className="diagram-note" x="880" y="220" textAnchor="start" transform="rotate(90 880 220)">
          {L('返回方向 ↑', 'return direction ↑')}
        </text>

        <rect className="diagram-band" x="34" y="382" width="824" height="34" rx="8" />
        <text className="diagram-label" x="446" y="404" textAnchor="middle">
          {L('栈帧保存 n、局部状态、返回位置和结果；返回按后进先出恢复', 'A frame keeps n, local state, return site and result; returns restore them in LIFO order')}
        </text>
      </svg>
    );
  }

  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 900 650"
      role="img"
      aria-label={L('定长顺序、堆分配与块链三种串存储结构', 'Fixed, heap-allocated and block-chain string storage')}
    >
      <text className="diagram-label diagram-label-strong" x="34" y="30">
        {L('字符串的三种存放方式：容量、串长和结束约定必须分清', 'Three ways to store a string: keep capacity, length and termination distinct')}
      </text>

      <text className="diagram-label diagram-label-strong" x="34" y="62">
        {L('① 定长顺序存储', '① Fixed sequential storage')}
      </text>
      <text className="diagram-note" x="34" y="84">
        {L('字符数组 + 固定容量 MAXLEN；容量不够只能截断或报错', 'Character array + fixed MAXLEN; overflow must truncate or fail')}
      </text>
      {['H', 'E', 'L', 'L', 'O', '\\0', '—', '—'].map((char, index) => (
        <g key={`fixed-${index}`}>
          <rect
            className={`diagram-cell ${index >= 6 ? 'diagram-cell-free' : index === 5 ? 'diagram-accent' : ''}`}
            x={180 + index * 56}
            y="120"
            width="52"
            height="46"
            rx="3"
          />
          <text className="diagram-label" x={206 + index * 56} y="148" textAnchor="middle">
            {char}
          </text>
          <text className="diagram-note" x={206 + index * 56} y="180" textAnchor="middle">
            {index}
          </text>
        </g>
      ))}
      <text className="diagram-label" x="34" y="148">
        {L('MAXLEN = 8', 'MAXLEN = 8')}
      </text>
      <text className="diagram-label" x="180" y="108" data-testid="string-c-terminator">
        {L("C 字符串：ch[5] = '\\0'", "C string: ch[5] = '\\0'")}
      </text>
      <text className="diagram-note" x="180" y="200">
        {L('教材串 ADT：S.length = 5，第 5 格及以后仍算容量', 'String ADT: S.length = 5; slot 5 and later remain capacity')}
      </text>
      <text className="diagram-note" x="180" y="224">
        {L("C 字符串没有 length 字段，靠 '\\0' 判断结束，strlen 需要扫描", "A C string has no length field; '\\0' ends it and strlen scans for it")}
      </text>

      <text className="diagram-label diagram-label-strong" x="34" y="248">
        {L('② 堆分配存储', '② Heap-allocated storage')}
      </text>
      <text className="diagram-note" x="34" y="270">
        {L('base 指向连续堆块，length 记录有效字符，capacity 记录可写槽位', 'base points at a contiguous heap block; length counts valid characters and capacity counts writable slots')}
      </text>
      <rect className="diagram-box diagram-accent" x="150" y="284" width="96" height="42" rx="6" />
      <text className="diagram-label" x="198" y="310" textAnchor="middle">
        base
      </text>
      <line className="diagram-line" x1="246" y1="305" x2="286" y2="305" />
      <polygon className="diagram-arrow" points="294,305 285,300 285,310" />
      {['A', 'L', 'G', 'O', 'V', 'I', 'Z', '—', '—'].map((char, index) => (
        <g key={`heap-${index}`} >
          <rect
            className={`diagram-cell ${index >= 7 ? 'diagram-cell-free' : ''}`}
            x={300 + index * 46}
            y="284"
            width="42"
            height="42"
            rx="3"
          />
          <text className="diagram-label" x={321 + index * 46} y="310" textAnchor="middle">
            {char}
          </text>
        </g>
      ))}
      <text className="diagram-note" x="34" y="336">
        {L('S.length = 7，S.capacity = 9；有效字符只到下标 6', 'S.length = 7, S.capacity = 9; valid characters stop at index 6')}
      </text>
      <text className="diagram-note" x="34" y="360">
        {L('扩容：申请新块 → 复制旧字符 → 释放旧块 → 更新 base；realloc 可能搬动地址', 'Grow: allocate → copy → free old → update base; realloc may move the block')}
      </text>

      <text className="diagram-label diagram-label-strong" x="34" y="396">
        {L('③ 块链存储', '③ Block-chain storage')}
      </text>
      <text className="diagram-note" x="34" y="418">
        {L('每块存固定个字符，next 串起下一块；最后一块可以不满', 'Each block stores a fixed number of characters; next links blocks; the last block may be partial')}
      </text>
      {[0, 1, 2].map((block) => {
        const x = 100 + block * 270;
        const chars = block === 0 ? ['D', 'A', 'T', 'A'] : block === 1 ? ['S', 'T', 'R', 'U'] : ['C', 'T', '—', '—'];
        return (
          <g key={`block-${block}`} data-testid="string-block" data-block-index={block}>
            <rect className="diagram-box" x={x} y="428" width="228" height="92" rx="7" />
            <text className="diagram-note" x={x + 10} y="450">
              {L(`结点 ${block + 1} · 容量 4`, `Block ${block + 1} · capacity 4`)}
            </text>
            {chars.map((char, index) => (
              <g key={`block-${block}-${index}`}>
                <rect
                  className={`diagram-cell ${char === '—' ? 'diagram-cell-free' : ''}`}
                  x={x + 10 + index * 43}
                  y="458"
                  width="39"
                  height="32"
                  rx="3"
                />
                <text className="diagram-label" x={x + 29.5 + index * 43} y="480" textAnchor="middle">
                  {char}
                </text>
              </g>
            ))}
            {block < 2 ? (
              <>
                <text className="diagram-note" x={x + 180} y="492">
                  next
                </text>
                <line className="diagram-line" x1={x + 228} y1="486" x2={x + 252} y2="486" />
                <polygon className="diagram-arrow" points={`${x + 260},486 ${x + 251},481 ${x + 251},491`} />
              </>
            ) : (
              <text className="diagram-note" x={x + 218} y="492" textAnchor="end" data-testid="string-tail-pointer">
                next = NULL
              </text>
            )}
            <text className="diagram-note" x={x + 10} y="514">
              {L('块内字符数组', 'in-block character array')}
            </text>
          </g>
        );
      })}
      <text className="diagram-note" x="100" y="548">
        {L('length = 10；第三块只有 2 个有效字符，遍历到 length 就停止', 'length = 10; the third block has only 2 valid characters, so traversal stops at length')}
      </text>
      <text className="diagram-note" x="100" y="572">
        {L('存储密度 = 有效字符空间 / 全部结点空间；next 指针与末块空位都会降低密度', 'Storage density = valid-character space / total node space; next pointers and final-block gaps reduce it')}
      </text>

      <rect className="diagram-band" x="34" y="592" width="832" height="34" rx="8" />
      <text className="diagram-label" x="450" y="614" textAnchor="middle">
        {L('定长：容量固定 · 堆分配：连续可扩 · 块链：按块拼接，指针开销换灵活连接', 'Fixed: bounded capacity · Heap: contiguous and growable · Block chain: link blocks, trading pointer overhead for flexible joins')}
      </text>
    </svg>
  );
}
