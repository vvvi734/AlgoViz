import type { Lang } from '../../i18n/types';

/**
 * AUDIT-02 / P1-10: a sequential-list diagram that actually teaches length,
 * capacity and one growth snapshot. It is intentionally static: the page is a
 * concept lesson, not a second trace player for dynamic arrays.
 *
 * The two snapshots keep length = 5 so the capacity difference is easy to
 * compare. The trigger card states the real precondition separately: growth is
 * only started when length == capacity and another insertion is requested.
 */
export function SequentialCapacityDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const values = ['21', '32', '45', '58', '66'] as const;
  const beforeSlots = Array.from({ length: 8 }, (_, index) => values[index] ?? null);
  const afterSlots = Array.from({ length: 16 }, (_, index) => values[index] ?? null);

  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 960 620"
      role="img"
      aria-label={L(
        '顺序表的 length、capacity 与一次扩容后的容量对比',
        'Sequential-list length, capacity and a post-growth capacity snapshot',
      )}
    >
      <text className="diagram-label diagram-label-strong" x="30" y="30">
        {L('顺序表容量：先分清 length 与 capacity，再看扩容快照', 'Sequential capacity: separate length from capacity, then read the growth snapshot')}
      </text>

      <g data-testid="sequential-capacity-before" data-length="5" data-capacity="8">
        <rect className="diagram-band" x="24" y="54" width="420" height="224" rx="10" />
        <text className="diagram-label diagram-label-strong" x="44" y="80">
          {L('快照 A：未满', 'Snapshot A: not full')}
        </text>
        <text className="diagram-note" x="44" y="102">
          {L('length = 5　capacity = 8', 'length = 5　capacity = 8')}
        </text>
        {beforeSlots.map((value, index) => {
          const x = 44 + index * 45;
          return (
            <g key={`before-${index}`} data-slot-index={index} data-slot-state={value ? 'used' : 'free'}>
              <rect
                className={value ? 'diagram-cell' : 'diagram-cell diagram-cell-free'}
                x={x}
                y="116"
                width="42"
                height="48"
                rx="4"
              />
              <text className="diagram-label" x={x + 21} y="146" textAnchor="middle">
                {value ?? '—'}
              </text>
              <text className="diagram-note" x={x + 21} y="180" textAnchor="middle">
                {index}
              </text>
            </g>
          );
        })}
        <text className="diagram-note" x="44" y="210">
          {L('前 5 格是有效区 [0, 5)；3 个空槽只是容量余量', 'slots 0–4 are live; the 3 free slots are spare capacity')}
        </text>
        <text className="diagram-note" x="44" y="234">
          {L('length = 5 < capacity = 8：未满，不扩容', 'length = 5 < capacity = 8: not full, so no growth')}
        </text>
        <text className="diagram-note" x="44" y="258">
          {L('长度数元素，容量数槽位', 'length counts elements; capacity counts slots')}
        </text>
      </g>

      <g data-testid="sequential-capacity-trigger">
        <rect className="diagram-band" x="516" y="54" width="420" height="224" rx="10" />
        <text className="diagram-label diagram-label-strong" x="536" y="80">
          {L('触发条件与动作', 'Trigger and actions')}
        </text>
        <text className="diagram-label" x="536" y="108">
          {L('仅当 length == capacity', 'only when length == capacity')}
        </text>
        <text className="diagram-label" x="536" y="130">
          {L('且还要插入新元素时，才扩容', 'and another insertion is requested')}
        </text>
        <text className="diagram-note" x="536" y="160">
          {L('① 申请一块更大的连续空间', '① allocate a larger contiguous block')}
        </text>
        <text className="diagram-note" x="536" y="182">
          {L('② 复制 length 个有效元素', '② copy the length live elements')}
        </text>
        <text className="diagram-note" x="536" y="204">
          {L('③ 更新 data / capacity，释放旧块', '③ update data / capacity, release the old block')}
        </text>
        <text className="diagram-note" x="536" y="232">
          {L('扩容不是每次插入都发生', 'growth does not happen on every insertion')}
        </text>
        <text className="diagram-note" x="536" y="256">
          {L('常用常数倍扩容；本例取 ×2，不表示所有实现都固定 2 倍', 'constant-factor growth is common; ×2 is not universal')}
        </text>
      </g>

      <g data-testid="sequential-capacity-old-block">
        <rect className="diagram-band" x="24" y="302" width="210" height="230" rx="10" />
        <text className="diagram-label diagram-label-strong" x="44" y="328">
          {L('旧块：已释放', 'Old block: released')}
        </text>
        <rect className="diagram-cell diagram-cell-free" x="44" y="348" width="170" height="52" rx="5" />
        <line className="diagram-line diagram-cut" x1="50" y1="354" x2="208" y2="394" />
        <line className="diagram-line diagram-cut" x1="208" y1="354" x2="50" y2="394" />
        <text className="diagram-note" x="44" y="426">
          {L('旧块原有 8 个槽位。', 'The old block had 8 slots.')}
        </text>
        <text className="diagram-note" x="44" y="450">
          {L('释放后旧地址失效，', 'after release the old address is invalid;')}
        </text>
        <text className="diagram-note" x="44" y="474">
          {L('不能继续读写旧块。', 'the old block must not be accessed.')}
        </text>
        <text className="diagram-note" x="44" y="502">
          {L('左右并排只用于对照，', 'the side-by-side view is only')}
        </text>
        <text className="diagram-note" x="44" y="524">
          {L('新旧空间不长期同时有效。', 'a comparison; both are not live long-term.')}
        </text>
      </g>

      <g data-testid="sequential-capacity-after" data-length="5" data-capacity="16">
        <rect className="diagram-band" x="250" y="302" width="686" height="230" rx="10" />
        <text className="diagram-label diagram-label-strong" x="270" y="328">
          {L('快照 B：扩容后 · capacity = 16，length = 5', 'Snapshot B: after growth · capacity = 16, length = 5')}
        </text>
        {afterSlots.map((value, index) => {
          const x = 264 + index * 42;
          return (
            <g key={`after-${index}`} data-slot-index={index} data-slot-state={value ? 'used' : 'free'}>
              <rect
                className={value ? 'diagram-cell' : 'diagram-cell diagram-cell-free'}
                x={x}
                y="348"
                width="40"
                height="50"
                rx="4"
              />
              <text className="diagram-label" x={x + 20} y="380" textAnchor="middle">
                {value ?? '—'}
              </text>
              <text className="diagram-note" x={x + 20} y="414" textAnchor="middle">
                {index}
              </text>
            </g>
          );
        })}
        <text className="diagram-note" x="270" y="442">
          {L('原 5 个元素按下标复制到新块；length 在复制前后保持 5。', 'the five elements are copied by index; length stays 5 across the copy.')}
        </text>
        <text className="diagram-note" x="270" y="466">
          {L('11 个空槽属于 capacity 的余量，不是有效元素。', 'the 11 free slots are capacity headroom, not live elements.')}
        </text>
        <text className="diagram-note" x="270" y="490">
          {L('data 指向新块；旧块已释放，不能同时读写两块。', 'data points at the new block; the old block is released and must not be read or written.')}
        </text>
        <text className="diagram-note" x="270" y="514">
          {L('示意固定 length = 5 以对比容量；真实触发时旧表必为 length = capacity。', 'length is fixed at 5 here to compare capacity; a real trigger has length = capacity.')}
        </text>
      </g>

      <rect className="diagram-band" data-testid="sequential-capacity-summary" x="24" y="546" width="912" height="62" rx="8" />
      <text className="diagram-label" x="44" y="568">
        {L('length 是有效元素数；capacity 是当前存储空间的槽位数。', 'length is the live-element count; capacity is the slot count of the current block.')}
      </text>
      <text className="diagram-label" x="44" y="590">
        {L('扩容搬移的是元素，不放宽 length 的定义。', 'Growth moves elements; it does not redefine length.')}
      </text>
    </svg>
  );
}
