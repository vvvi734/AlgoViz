import { useI18n } from '../../i18n/I18nProvider';
import type { StaticLinkedListVisualModel } from '../../domain/visualization/staticLinkedListModel';

/**
 * TEXTBOOK-02 static linked list canvas.
 *
 * Top: the real array, one row per slot with index/data/cursor.
 * Bottom: the logical chain that the recorded cursors actually form.
 * Both are painted from the same snapshot, so a cursor change updates both.
 */
export function StaticLinkedListVisual({ model }: { model: StaticLinkedListVisualModel }) {
  const { b } = useI18n();

  const formatCursor = (cursor: number | null) =>
    cursor === null ? b('NULL', 'NULL') : `→ [${cursor}]`;

  const roleLabel = (role: (typeof model.slots)[number]['role']) => {
    if (role === 'head') return b('头结点', 'HEAD');
    if (role === 'free-head') return b('空闲头', 'FREE HEAD');
    if (role === 'live') return b('链上结点', 'LIVE');
    if (role === 'free') return b('空闲结点', 'FREE');
    if (role === 'allocated') return b('已申请 · 未接入', 'ALLOCATED');
    return b('未用', 'IDLE');
  };

  return (
    <section
      className="static-linked-visual"
      data-testid="static-linked-visual"
      data-operation={model.operation}
      data-action={model.action}
      data-head={model.head === null ? '' : model.head}
      data-free-head={model.freeHead === null ? '' : model.freeHead}
      data-logical={model.logical.map((node) => node.index).join(',')}
      data-free={model.freeList.map((node) => node.index).join(',')}
      aria-label={b('静态链表可视化', 'Static linked list visualization')}
    >
      <header className="static-linked-head">
        <div>
          <b>{b('数组存储区', 'Array storage')}</b>
          <span>{b('data 存元素，cur 存后继下标', 'data stores the element; cur stores the successor index')}</span>
        </div>
        <div className="static-linked-pointers">
          <span className="static-pointer-badge is-head">head = {model.head === null ? b('NULL', 'NULL') : model.head}</span>
          <span className="static-pointer-badge is-free">freeHead = {model.freeHead === null ? b('NULL', 'NULL') : model.freeHead}</span>
          <span className="static-pointer-badge is-capacity">{b('容量', 'capacity')} {model.capacity}</span>
        </div>
      </header>

      <div className="static-array-wrap">
        <table className="static-array-table">
          <thead>
            <tr>
              <th>{b('下标', 'Index')}</th>
              <th>data</th>
              <th>cur</th>
              <th>{b('角色', 'Role')}</th>
            </tr>
          </thead>
          <tbody>
            {model.slots.map((slot) => (
              <tr
                key={slot.index}
                className={[
                  slot.active ? 'is-active' : '',
                  slot.changed ? 'is-changed' : '',
                  slot.role === 'head' ? 'is-head' : '',
                  slot.role === 'free-head' || slot.role === 'free' ? 'is-free' : '',
                  slot.role === 'allocated' ? 'is-allocated' : '',
                ].filter(Boolean).join(' ')}
                data-testid={`static-slot-${slot.index}`}
                data-role={slot.role}
                data-data={slot.data === null ? '' : slot.data}
                data-cursor={slot.cursor === null ? '' : slot.cursor}
              >
                <td className="static-index">{slot.index}</td>
                <td className="static-data">{slot.data === null ? '·' : String(slot.data)}</td>
                <td className="static-cursor">{formatCursor(slot.cursor)}</td>
                <td className="static-role">{roleLabel(slot.role)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {model.change ? (
        <div className="static-change" data-testid="static-change">
          <span>{b('游标变化', 'Cursor change')}</span>
          <code>[{model.change.index}].cur</code>
          <span>{model.change.beforeCursor === null ? b('NULL', 'NULL') : model.change.beforeCursor}</span>
          <span>→</span>
          <span>{model.change.afterCursor === null ? b('NULL', 'NULL') : model.change.afterCursor}</span>
        </div>
      ) : null}

      <div className="static-logical-block">
        <header>
          <b>{b('逻辑链表（按 cur 行走）', 'Logical chain (follow cur)')}</b>
          <span>{b('节点下标不是物理顺序', 'node indices are not physical order')}</span>
        </header>
        <div className="static-chain" data-testid="static-logical-chain">
          {"HEAD"}
          <span className="static-arrow">→</span>
          {model.logical.length === 0 ? (
            <span className="static-null">{b('NULL', 'NULL')}</span>
          ) : (
            <>
              {model.logical.map((node) => (
                <span className="static-node-wrap" key={node.index}>
                  <span
                    className={`static-node${model.activeIndex === node.index ? ' is-active' : ''}`}
                    data-testid={`static-logical-node-${node.index}`}
                    data-index={node.index}
                    data-value={node.value === null ? '' : String(node.value)}
                  >
                    <small>[{node.index}]</small>
                    <strong>{node.value === null ? '·' : String(node.value)}</strong>
                  </span>
                  <span className="static-arrow">→</span>
                </span>
              ))}
              <span className="static-null">{b('NULL', 'NULL')}</span>
            </>
          )}
        </div>
      </div>

      <div className="static-free-block">
        <span>{b('空闲链', 'Free chain')}</span>
        <div className="static-free-chain">
          {model.freeHead === null ? (
            <span className="static-null">{b('NULL · 数组已满', 'NULL · array is full')}</span>
          ) : (
            model.freeList.map((node, position) => (
              <span className="static-free-item" key={node.index}>
                {position === 0 ? '' : '→ '}[{node.index}]
              </span>
            ))
          )}
        </div>
      </div>

      <footer className="static-linked-note">
        {b(
          '上方是物理存放顺序，下方是游标定义的逻辑顺序；两次插入后，数组下标和逻辑次序通常不再一致。',
          'The table is physical storage; the chain below is the logical order defined by cursors. After a few insertions the indices and logical order usually diverge.',
        )}
      </footer>
    </section>
  );
}
