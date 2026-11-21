import type { Lang } from '../../i18n/types';
import type { ConceptDiagramKind } from '../../domain/concepts/types';

type DynamicStorageDiagramKind = Extract<
  ConceptDiagramKind,
  'dynamic-storage' | 'boundary-tag-method' | 'storage-compaction'
>;

const W = 1000;

function FragmentationDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const scale = (start: number, size: number, capacity: number, x = 50, width = 900) => ({
    x: x + (start / capacity) * width,
    width: (size / capacity) * width,
  });
  return (
    <svg className="ds-diagram" viewBox={`0 0 ${W} 430`} role="img" aria-label={L('内部碎片与外部碎片对比', 'Internal vs external fragmentation')}>
      <defs>
        <pattern id="ds-waste-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect className="ds-hatch-base" width="8" height="8" />
          <path className="ds-hatch-line" d="M0 8 L8 0" />
        </pattern>
      </defs>
      <text className="ds-title" x="50" y="26">
        1 · {L('内部碎片', 'Internal fragmentation')}
      </text>
      <text className="ds-caption" x="50" y="46">
        {L('已分配块 A 占 8B，只用了 6B；多出的 2B 在块内，不能给别人。', 'Block A owns 8B but only 6B is used; the extra 2B stays inside the block.')}
      </text>
      <rect className="ds-track" x="50" y="58" width="900" height="66" rx="4" />
      {[
        { start: 0, size: 8, label: 'A', status: 'used', sub: L('申请 6B', 'asked 6B') },
        { start: 8, size: 10, label: 'B', status: 'used', sub: L('申请 10B', 'asked 10B') },
        { start: 18, size: 6, label: L('空闲', 'free'), status: 'free', sub: '6B' },
      ].map((block) => {
        const box = scale(block.start, block.size, 24);
        return (
          <g key={block.start}>
            <rect className={`ds-segment is-${block.status}`} x={box.x} y="58" width={box.width} height="66" />
            <text className="ds-block-label" x={box.x + box.width / 2} y="84" textAnchor="middle">{block.label}</text>
            <text className="ds-block-sub" x={box.x + box.width / 2} y="104" textAnchor="middle">{block.sub}</text>
            {block.status === 'used' && block.size === 8 ? (
              <>
                <rect x={box.x + (6 / 24) * 900} y="58" width={(2 / 24) * 900} height="66" fill="url(#ds-waste-hatch)" />
                <text className="ds-waste-label" x={box.x + (7 / 24) * 900} y="145" textAnchor="middle">
                  {L('内部碎片 2B', 'internal 2B')}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      <text className="ds-tick" x="50" y="137">0</text>
      <text className="ds-tick" x="950" y="137" textAnchor="end">24B</text>

      <line className="ds-divider" x1="50" x2="950" y1="170" y2="170" />
      <text className="ds-title" x="50" y="200">
        2 · {L('外部碎片', 'External fragmentation')}
      </text>
      <text className="ds-caption" x="50" y="220">
        {L('总空闲 12B ≥ 申请 8B，但最大连续空闲只有 4B，所以 8B 申请失败。', 'Total free 12B ≥ request 8B, but the largest run is 4B, so an 8B request fails.')}
      </text>
      <rect className="ds-track" x="50" y="234" width="900" height="66" rx="4" />
      {[
        { start: 0, size: 6, label: 'A', status: 'used' },
        { start: 6, size: 4, label: L('空 4', 'free 4'), status: 'free' },
        { start: 10, size: 6, label: 'B', status: 'used' },
        { start: 16, size: 4, label: L('空 4', 'free 4'), status: 'free' },
        { start: 20, size: 6, label: 'C', status: 'used' },
        { start: 26, size: 4, label: L('空 4', 'free 4'), status: 'free' },
        { start: 30, size: 6, label: L('空闲', 'free'), status: 'free' },
      ].map((block) => {
        const box = scale(block.start, block.size, 36);
        return (
          <g key={block.start}>
            <rect className={`ds-segment is-${block.status}`} x={box.x} y="234" width={box.width} height="66" />
            {box.width > 34 ? (
              <text className="ds-block-label" x={box.x + box.width / 2} y="272" textAnchor="middle">{block.label}</text>
            ) : null}
          </g>
        );
      })}
      <rect className="ds-request" x="480" y="310" width="190" height="26" rx="13" />
      <text className="ds-request-label" x="575" y="328" textAnchor="middle">
        {L('申请 D = 8B ✕', 'request D = 8B ✕')}
      </text>
      <text className="ds-tick" x="50" y="319">0</text>
      <text className="ds-tick" x="950" y="319" textAnchor="end">36B</text>
      <text className="ds-footnote" x="50" y="390">
        {L('内部碎片：块内剩余；外部碎片：块间分散空闲。', 'Internal: waste inside a block. External: scattered free runs between blocks.')}
      </text>
    </svg>
  );
}

function BoundaryTagDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const blocks = [
    { x: 40, width: 220, status: 'used', label: 'A · 12B' },
    { x: 260, width: 300, status: 'free', label: L('F · 16B', 'F · 16B') },
    { x: 560, width: 220, status: 'used', label: 'B · 12B' },
    { x: 780, width: 180, status: 'free', label: L('空闲 · 10B', 'free · 10B') },
  ];
  const cases = [
    {
      y: 205,
      title: L('左右都占用', 'both neighbours used'),
      left: 'used',
      right: 'used',
      result: L('不合并，只把块标记为空闲', 'No merge; just mark the block free'),
    },
    {
      y: 255,
      title: L('左邻空闲', 'left free'),
      left: 'free',
      right: 'used',
      result: L('与左块合并，更新合并块的尾标识', 'Merge left; update the merged tail tag'),
    },
    {
      y: 305,
      title: L('右邻空闲', 'right free'),
      left: 'used',
      right: 'free',
      result: L('与右块合并，更新合并块的头标识', 'Merge right; update the merged head tag'),
    },
    {
      y: 355,
      title: L('左右都空闲', 'both free'),
      left: 'free',
      right: 'free',
      result: L('三块合一，删除两个空闲表项', 'Three blocks become one; remove two free entries'),
    },
  ];
  return (
    <svg className="ds-diagram" viewBox={`0 0 ${W} 430`} role="img" aria-label={L('边界标识与四种合并情形', 'Boundary tags and four merge cases')}>
      <text className="ds-title" x="40" y="24">{L('块头与块尾都保存大小和状态', 'Head and tail both store size and state')}</text>
      <rect className="ds-track" x="40" y="44" width="920" height="88" rx="4" />
      {blocks.map((block) => (
        <g key={block.x}>
          <rect className={`ds-segment is-${block.status}`} x={block.x} y="44" width={block.width} height="88" />
          <line className="ds-tag-line" x1={block.x} x2={block.x + block.width} y1="64" y2="64" />
          <line className="ds-tag-line" x1={block.x} x2={block.x + block.width} y1="112" y2="112" />
          <text className="ds-tag" x={block.x + 6} y="58">H · 12</text>
          <text className="ds-tag" x={block.x + block.width - 6} y="106" textAnchor="end">F · 12</text>
          <text className="ds-block-label" x={block.x + block.width / 2} y="92" textAnchor="middle">{block.label}</text>
        </g>
      ))}
      <text className="ds-caption" x="40" y="156">
        {L('释放 X 时读取 X-1 的尾标识和 X+size 的头标识，就能 O(1) 找到左右邻块。', 'On releasing X, read the tail tag at X-1 and the head tag at X+size to find both neighbours in O(1).')}
      </text>
      {cases.map((item) => (
        <g key={item.title}>
          <text className="ds-case-title" x="40" y={item.y}>{item.title}</text>
          <rect className={`ds-mini is-${item.left}`} x="230" y={item.y - 20} width="74" height="26" rx="4" />
          <text className="ds-mini-label" x="267" y={item.y - 3} textAnchor="middle">{L('邻块', 'left')}</text>
          <rect className="ds-mini is-target" x="312" y={item.y - 20} width="74" height="26" rx="4" />
          <text className="ds-mini-label" x="349" y={item.y - 3} textAnchor="middle">X</text>
          <rect className={`ds-mini is-${item.right}`} x="394" y={item.y - 20} width="74" height="26" rx="4" />
          <text className="ds-mini-label" x="431" y={item.y - 3} textAnchor="middle">{L('邻块', 'right')}</text>
          <text className="ds-case-arrow" x="490" y={item.y - 3}>→</text>
          <text className="ds-case-result" x="520" y={item.y - 3}>{item.result}</text>
        </g>
      ))}
    </svg>
  );
}

function StorageCompactionDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const before = [
    { start: 0, size: 6, label: 'A', status: 'used' },
    { start: 6, size: 2, sizeLabel: L('空洞', 'hole'), status: 'free' },
    { start: 8, size: 8, label: 'B', status: 'used' },
    { start: 16, size: 4, sizeLabel: L('空洞', 'hole'), status: 'free' },
    { start: 20, size: 6, label: 'C', status: 'used' },
    { start: 26, size: 8, label: 'D', status: 'used' },
    { start: 34, size: 14, label: L('空闲', 'free'), status: 'free' },
  ];
  const after = [
    { start: 0, size: 6, label: 'A', status: 'used' },
    { start: 6, size: 8, label: 'B', status: 'used', old: 8 },
    { start: 14, size: 6, label: 'C', status: 'used', old: 20 },
    { start: 20, size: 8, label: 'D', status: 'used', old: 26 },
    { start: 28, size: 20, label: L('连续空闲 20B', 'free 20B'), status: 'free' },
  ];
  const x = 60;
  const width = 880;
  const capacity = 48;
  return (
    <svg className="ds-diagram" viewBox={`0 0 ${W} 430`} role="img" aria-label={L('存储紧缩前后的对象地址', 'Object addresses before and after compaction')}>
      <text className="ds-title" x={x} y="26">{L('整理前：存活对象之间夹着空洞', 'Before: live objects separated by holes')}</text>
      <rect className="ds-track" x={x} y="42" width={width} height="72" rx="4" />
      {before.map((block) => {
        const bx = x + (block.start / capacity) * width;
        const bw = (block.size / capacity) * width;
        return (
          <g key={block.start}>
            <rect className={`ds-segment is-${block.status}`} x={bx} y="42" width={bw} height="72" />
            {bw > 26 ? <text className="ds-block-label" x={bx + bw / 2} y="78" textAnchor="middle">{block.label ?? block.sizeLabel}</text> : null}
            <text className="ds-address" x={bx + bw / 2} y="100" textAnchor="middle">{block.start}</text>
          </g>
        );
      })}
      <text className="ds-tick" x={x} y="130">0</text>
      <text className="ds-tick" x={x + width} y="130" textAnchor="end">48B</text>

      <text className="ds-title" x={x} y="180">{L('整理后：存活对象前移，尾部形成连续空闲区', 'After: live objects move left; one contiguous free run remains')}</text>
      <rect className="ds-track" x={x} y="196" width={width} height="72" rx="4" />
      {after.map((block) => {
        const bx = x + (block.start / capacity) * width;
        const bw = (block.size / capacity) * width;
        return (
          <g key={block.start}>
            <rect className={`ds-segment is-${block.status}`} x={bx} y="196" width={bw} height="72" />
            <text className="ds-block-label" x={bx + bw / 2} y="230" textAnchor="middle">{block.label}</text>
            <text className="ds-address" x={bx + bw / 2} y="252" textAnchor="middle">
              {block.old !== undefined ? `${block.old}→${block.start}` : block.start}
            </text>
          </g>
        );
      })}
      <text className="ds-tick" x={x} y="284">0</text>
      <text className="ds-tick" x={x + width} y="284" textAnchor="end">48B</text>

      <rect className="ds-ref-box" x={x} y="304" width={width} height="48" rx="8" />
      <text className="ds-ref-title" x={x + 14} y="324">{L('引用地址必须一起更新', 'Every reference address must be updated')}</text>
      <text className="ds-ref-line" x={x + 14} y="344">
        root→A @0 · A→B @6 · B→C @14 · C→D @20
      </text>
      <text className="ds-footnote" x={x} y="386">
        {L('B、C、D 的旧地址 8、20、26 已失效，之后只能使用新地址。', 'Old addresses 8, 20 and 26 for B, C, D are stale; only the new addresses are valid.')}
      </text>
    </svg>
  );
}

export function DynamicStorageDiagram({ kind, lang }: { kind: DynamicStorageDiagramKind; lang: Lang }) {
  if (kind === 'boundary-tag-method') return <BoundaryTagDiagram lang={lang} />;
  if (kind === 'storage-compaction') return <StorageCompactionDiagram lang={lang} />;
  return <FragmentationDiagram lang={lang} />;
}
