import { useI18n } from '../../i18n/I18nProvider';
import type {
  QueueVisualModel,
  StackVisualModel,
  StructureNodeModel,
} from '../../domain/visualization/model';
import type { StructureOperation } from '../../domain/trace/schema';

/**
 * Stage 7B dedicated renderers. They only paint a `stack`/`queue` model built
 * from a real Trace Event; no operation is read from text and no playback
 * state is kept here. Element ids and order come straight from the runner.
 *
 * Chapter 3 adds storage-aware branches. The legacy vertical stack and linear
 * queue remain the fallback for old traces that do not declare a representation.
 */

function operationText(operation: StructureOperation, lang: 'zh' | 'en'): string {
  const labels: Record<StructureOperation, [string, string]> = {
    init: ['初始化', 'INIT'],
    push: ['入栈 PUSH ↓', 'PUSH ↓'],
    pop: ['出栈 POP ↑', 'POP ↑'],
    peek: ['查看栈顶 PEEK', 'PEEK ◎'],
    enqueue: ['入队 ENQUEUE →', 'ENQUEUE →'],
    dequeue: ['出队 ← DEQUEUE', '← DEQUEUE'],
    front: ['查看队首 FRONT', 'FRONT ◎'],
    done: ['完成 DONE', 'DONE'],
  };
  return labels[operation][lang === 'zh' ? 0 : 1];
}

function hintText(operation: StructureOperation, lang: 'zh' | 'en'): string | null {
  const hints: Partial<Record<StructureOperation, [string, string]>> = {
    push: ['新元素从顶部进入，成为新的栈顶', 'The new element enters at the open top and becomes TOP'],
    pop: ['栈顶元素从顶部离开，下面的元素接替栈顶', 'TOP leaves through the open top; the element below becomes TOP'],
    peek: ['只读取栈顶，不移除任何元素', 'Reads TOP without removing anything'],
    enqueue: ['新元素从队尾进入，排到队尾', 'The new element enters at REAR and joins the back of the line'],
    dequeue: ['队首元素从左侧离开，后面的元素依次前移', 'FRONT leaves to the left; the remaining elements move up'],
    front: ['只读取队首，不移除任何元素', 'Reads FRONT without removing anything'],
  };
  const pair = hints[operation];
  return pair ? pair[lang === 'zh' ? 0 : 1] : null;
}

function valueText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function StackVisual({
  model,
  operationLabel,
  hint,
  compact,
}: {
  model: StackVisualModel;
  /** Stage 7E graph frontier: override the container operation headline. */
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { t, lang } = useI18n();
  if (model.storage === 'array') {
    return <ArrayStackVisual model={model} operationLabel={operationLabel} hint={hint} compact={compact} />;
  }
  if (model.storage === 'linked') {
    return <LinkedStackVisual model={model} operationLabel={operationLabel} hint={hint} compact={compact} />;
  }
  const topFirst = [...model.items].reverse();
  const top = model.items[model.items.length - 1];
  return (
    <div
      className={`structure-visual stack-visual${compact ? ' is-compact' : ''}`}
      data-testid="stack-visual"
      data-operation={model.operation}
      data-empty={model.empty ? 'true' : 'false'}
      role="group"
      aria-label={t('stackVisualLabel')}
    >
      <div className="structure-op-row">
        <span className="structure-op" data-testid="stack-op-label">
          {operationLabel ?? operationText(model.operation, lang)}
        </span>
        <span className="structure-hint">{hint ?? hintText(model.operation, lang)}</span>
      </div>

      <div className="stack-tank" data-testid="stack-tank">
        <div className="stack-topline">
          <span data-testid="stack-top">TOP</span>
          <span aria-hidden="true">↓</span>
        </div>
        <div className="stack-body" data-testid="stack-body">
          {model.removed && (
            <div
              className="structure-item stack-item stack-leaving"
              data-testid="stack-leaving"
              data-element-id={model.removed.id}
              data-node-id={model.removed.nodeId}
              data-value={valueText(model.removed.value)}
              data-status="leaving"
            >
              <span className="structure-value">{valueText(model.removed.value)}</span>
              <span className="structure-tag">{t('structureLeaving')}</span>
            </div>
          )}

          {model.empty ? (
            <div className="structure-empty" data-testid="stack-empty">
              <span className="structure-empty-icon" aria-hidden="true">▭</span>
              <span>{model.label}</span>
            </div>
          ) : (
            topFirst.map((item) => {
              const isTop = top?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`structure-item stack-item${item.state === 'entering' ? ' is-entering' : ''}${item.state === 'peeking' ? ' is-peeking' : ''}${item.active ? ' is-active' : ''}${isTop ? ' is-top' : ''}`}
                  data-testid="stack-item"
                  data-element-id={item.id}
                  data-node-id={item.nodeId}
                  data-value={valueText(item.value)}
                  data-role={isTop ? 'top' : 'member'}
                  data-status={item.state}
                  data-active={item.active ? 'true' : 'false'}
                >
                  <span className="structure-value">{valueText(item.value)}</span>
                  {(isTop || item.active) && (
                    <span className="structure-tag">
                      {isTop ? 'TOP' : ''}
                      {isTop && item.active ? ' · ' : ''}
                      {item.active ? t('structurePeekTag') : ''}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="stack-bottom">STACK · LIFO</div>
      </div>
    </div>
  );
}

export function QueueVisual({
  model,
  operationLabel,
  hint,
  compact,
}: {
  model: QueueVisualModel;
  /** Stage 7E graph frontier: override the container operation headline. */
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { t, lang } = useI18n();
  if (model.storage === 'circular') {
    return <CircularQueueVisual model={model} operationLabel={operationLabel} hint={hint} compact={compact} />;
  }
  if (model.storage === 'linked') {
    return <LinkedQueueVisual model={model} operationLabel={operationLabel} hint={hint} compact={compact} />;
  }
  const activeFront = model.operation === 'front' || model.operation === 'dequeue';
  const activeRear = model.operation === 'enqueue';
  const leavingItem = model.removed ? (
    <div
      className="structure-item queue-item queue-leaving"
      data-testid="queue-leaving"
      data-element-id={model.removed.id}
      data-node-id={model.removed.nodeId}
      data-value={valueText(model.removed.value)}
      data-status="leaving"
    >
      <span className="structure-value">{valueText(model.removed.value)}</span>
      <span className="structure-tag">{t('structureLeaving')}</span>
    </div>
  ) : null;
  return (
    <div
      className={`structure-visual queue-visual${compact ? ' is-compact' : ''}`}
      data-testid="queue-visual"
      data-operation={model.operation}
      data-empty={model.empty ? 'true' : 'false'}
      role="group"
      aria-label={t('queueVisualLabel')}
    >
      <div className="structure-op-row">
        <span className="structure-op" data-testid="queue-op-label">
          {operationLabel ?? operationText(model.operation, lang)}
        </span>
        <span className="structure-hint">{hint ?? hintText(model.operation, lang)}</span>
      </div>

      {model.removed && !compact && (
        <div className="queue-exit" data-testid="queue-exit">
          {leavingItem}
          <span className="queue-exit-label">{t('structureQueueFront')}</span>
        </div>
      )}

      <div className="queue-track" data-testid="queue-track">
        {model.removed && compact && (
          <div className="queue-exit-inline" data-testid="queue-exit">
            {leavingItem}
          </div>
        )}
        <div className={`queue-rail queue-front${activeFront ? ' is-active' : ''}`} data-testid="queue-front">
          <b>FRONT</b>
          <small>{t('structureQueueFront')}</small>
          <span aria-hidden="true">←</span>
        </div>

        <div className="queue-lane" data-testid="queue-lane">
          {model.empty ? (
            <div className="structure-empty queue-empty" data-testid="queue-empty">
              <span className="structure-empty-icon" aria-hidden="true">⇥</span>
              <span>{model.label}</span>
            </div>
          ) : (
            model.items.map((item) => (
              <div
                key={item.id}
                className={`structure-item queue-item${item.state === 'entering' ? ' is-entering' : ''}${item.active ? ' is-active' : ''} queue-${item.role}`}
                data-testid="queue-item"
                data-element-id={item.id}
                data-node-id={item.nodeId}
                data-value={valueText(item.value)}
                data-role={item.role}
                data-status={item.state}
                data-active={item.active ? 'true' : 'false'}
              >
                <span className="structure-value">{valueText(item.value)}</span>
                {item.role !== 'member' && (
                  <span className="structure-tag">
                    {item.role === 'front' ? 'FRONT' : 'REAR'}
                    {item.active ? ` · ${t('structureFrontTag')}` : ''}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className={`queue-rail queue-rear${activeRear ? ' is-active' : ''}`} data-testid="queue-rear">
          <b>REAR</b>
          <small>{t('structureQueueRear')}</small>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </div>
  );
}

function StorageHeader({
  model,
  operationLabel,
  hint,
  lang,
}: {
  model: { operation: StructureOperation; label: string };
  operationLabel?: string;
  hint?: string | null;
  lang: 'zh' | 'en';
}) {
  return (
    <div className="structure-op-row storage-op-row">
      <span className="structure-op">{operationLabel ?? operationText(model.operation, lang)}</span>
      <span className="structure-hint">{hint ?? hintText(model.operation, lang)}</span>
    </div>
  );
}

function chainFrom(
  nodes: StructureNodeModel[],
  startId: string | null | undefined,
): Array<{ node: StructureNodeModel; index: number }> {
  if (!startId) return [];
  const byId = new Map<string, StructureNodeModel>(nodes.map((item) => [item.id, item]));
  const chain: Array<{ node: StructureNodeModel; index: number }> = [];
  const seen = new Set<string>();
  let current: string | null = startId;
  while (current && byId.has(current) && !seen.has(current) && chain.length <= 40) {
    seen.add(current);
    const node: StructureNodeModel = byId.get(current)!;
    chain.push({ node, index: chain.length });
    current = node.nextId;
  }
  return chain;
}

function nodeArrow(lang: 'zh' | 'en') {
  return <span className="storage-node-arrow" aria-label={lang === 'zh' ? 'next 指针' : 'next pointer'}>→</span>;
}

/**
 * Sequential stack: the array is the storage, `top` is the index of the live
 * top element. Empty cells are rendered too, so capacity and TOP movement stay
 * visible at every frame.
 */
function ArrayStackVisual({
  model,
  operationLabel,
  hint,
  compact,
}: {
  model: StackVisualModel;
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const capacity = model.capacity ?? Math.max(1, model.items.length);
  const slots = Array.from({ length: capacity }, (_, slot) => slot);
  const bySlot = new Map(model.items.map((item) => [item.slot ?? item.index, item]));
  return (
    <div
      className={`structure-visual stack-visual array-stack-visual${compact ? ' is-compact' : ''}`}
      data-testid="array-stack-visual"
      data-operation={model.operation}
      data-storage="array"
      role="group"
      aria-label={lang === 'zh' ? '顺序栈：数组槽位与 top 下标' : 'Sequential stack: array slots and top index'}
    >
      <StorageHeader model={model} operationLabel={operationLabel} hint={hint} lang={lang} />
      <div className="storage-meta-row">
        <span className="storage-chip">storage = array</span>
        <span className="storage-chip">capacity = {capacity}</span>
        <span className="storage-chip" data-testid="array-stack-top">top = {model.topIndex ?? -1}</span>
      </div>
      {model.removed ? (
        <div className="storage-removed" data-testid="array-stack-leaving">
          {lang === 'zh' ? '已出栈' : 'popped'} <b>{valueText(model.removed.value)}</b>
        </div>
      ) : null}
      <div className="array-storage-row" data-testid="array-stack-slots">
        {slots.map((slot) => {
          const item = bySlot.get(slot);
          const isTop = slot === model.topIndex;
          return (
            <div className="array-slot-wrap" key={slot}>
              <div className={`array-pointer${isTop ? ' is-active' : ''}`} data-testid={isTop ? 'array-stack-pointer' : undefined}>
                {isTop ? 'TOP ↓' : '\u00a0'}
              </div>
              <div
                className={`array-slot${item ? ' is-filled' : ' is-free'}${isTop ? ' is-top' : ''}${item?.state === 'entering' ? ' is-entering' : ''}${item?.active ? ' is-peek' : ''}`}
                data-testid="array-stack-slot"
                data-slot={slot}
                data-value={item ? valueText(item.value) : ''}
                data-status={item ? (isTop ? 'top' : 'filled') : 'free'}
                data-active={item?.active ? 'true' : undefined}
              >
                <span className="array-slot-index">[{slot}]</span>
                <span className="array-slot-value">{item ? valueText(item.value) : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="storage-note">
        {lang === 'zh'
          ? 'top = -1 表示空栈；push 先 ++top 再写入，pop 先读取再 --top。'
          : 'top = -1 means empty; push does ++top then writes, pop reads then does --top.'}
      </div>
    </div>
  );
}

/** Linked stack: TOP is a pointer to the first node; push/pop only relink at the head. */
function LinkedStackVisual({
  model,
  operationLabel,
  hint,
  compact,
}: {
  model: StackVisualModel;
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const chain = chainFrom(model.nodes ?? [], model.topId);
  return (
    <div
      className={`structure-visual stack-visual linked-stack-visual${compact ? ' is-compact' : ''}`}
      data-testid="linked-stack-visual"
      data-operation={model.operation}
      data-storage="linked"
      role="group"
      aria-label={lang === 'zh' ? '链栈：top 指针指向首节点' : 'Linked stack: top points at the first node'}
    >
      <StorageHeader model={model} operationLabel={operationLabel} hint={hint} lang={lang} />
      <div className="storage-meta-row">
        <span className="storage-chip">storage = linked</span>
        <span className="storage-chip" data-testid="linked-stack-top">
          top → {model.topId && chain[0] ? valueText(chain[0].node.value) : 'NULL'}
        </span>
        <span className="storage-chip">size = {chain.length}</span>
      </div>
      {model.removed ? (
        <div className="storage-removed" data-testid="linked-stack-leaving">
          {lang === 'zh' ? '已出栈节点' : 'popped node'} <b>{valueText(model.removed.value)}</b>
        </div>
      ) : null}
      {chain.length === 0 ? (
        <div className="structure-empty storage-empty" data-testid="linked-stack-empty">
          <span>{model.label}</span>
          <span>top = NULL</span>
        </div>
      ) : (
        <div className="storage-chain storage-chain-scroll" data-testid="linked-stack-chain">
          {chain.map(({ node, index }) => (
            <div className="storage-chain-cell" key={node.id}>
              <div className={`storage-pointer${index === 0 ? ' is-active' : ''}`}>
                {index === 0 ? 'TOP ↓' : '\u00a0'}
              </div>
              <div
                className={`storage-node${index === 0 ? ' is-top' : ''}${node.id === model.removed?.id ? ' is-leaving' : ''}`}
                data-testid="linked-stack-node"
                data-node-id={node.id}
                data-value={valueText(node.value)}
              >
                <span className="storage-node-value">{valueText(node.value)}</span>
                <span className="storage-node-next">next</span>
              </div>
              {index < chain.length - 1 ? nodeArrow(lang) : <span className="storage-null">NULL</span>}
            </div>
          ))}
        </div>
      )}
      <div className="storage-note">
        {lang === 'zh'
          ? 'push：新节点 next = top，top = 新节点；pop：top = top.next。'
          : 'push: node.next = top, then top = node; pop: top = top.next.'}
      </div>
    </div>
  );
}

/**
 * Circular queue: physical array slots plus FRONT/REAR indices. The wrap arrow
 * makes the distinction between physical end and logical rear explicit.
 */
function CircularQueueVisual({
  model,
  operationLabel,
  hint,
  compact,
}: {
  model: QueueVisualModel;
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const capacity = model.capacity ?? Math.max(1, model.items.length + 1);
  const front = model.frontIndex ?? 0;
  const rear = model.rearIndex ?? 0;
  const bySlot = new Map(model.items.map((item) => [item.slot ?? item.index, item]));
  return (
    <div
      className={`structure-visual queue-visual circular-queue-visual${compact ? ' is-compact' : ''}`}
      data-testid="circular-queue-visual"
      data-operation={model.operation}
      data-storage="circular"
      role="group"
      aria-label={lang === 'zh' ? '循环队列：物理数组、front/rear 与回绕' : 'Circular queue: array, front/rear and wraparound'}
    >
      <StorageHeader model={model} operationLabel={operationLabel} hint={hint} lang={lang} />
      <div className="storage-meta-row">
        <span className="storage-chip">storage = circular</span>
        <span className="storage-chip">capacity = {capacity}</span>
        <span className="storage-chip" data-testid="circular-front">front = {front}</span>
        <span className="storage-chip" data-testid="circular-rear">rear = {rear}</span>
        <span className="storage-chip">count = {model.count ?? model.items.length}</span>
      </div>
      {model.removed ? (
        <div className="storage-removed" data-testid="circular-queue-leaving">
          {lang === 'zh' ? '已出队' : 'dequeued'} <b>{valueText(model.removed.value)}</b>
        </div>
      ) : null}
      <div className="circular-ring-row" data-testid="circular-queue-slots">
        {Array.from({ length: capacity }, (_, slot) => {
          const item = bySlot.get(slot);
          const isFront = slot === front;
          const isRear = slot === rear;
          return (
            <div className="circular-slot-wrap" key={slot}>
              <div className={`circular-pointer circular-rear-pointer${isRear ? ' is-active' : ''}`}>
                {isRear ? 'REAR ↓' : '\u00a0'}
              </div>
              <div
                className={`array-slot circular-slot${item ? ' is-filled' : ' is-free'}${isFront ? ' is-front' : ''}${isRear ? ' is-rear' : ''}${item?.state === 'entering' ? ' is-entering' : ''}${item?.active ? ' is-peek' : ''}`}
                data-testid="circular-queue-slot"
                data-slot={slot}
                data-value={item ? valueText(item.value) : ''}
                data-status={item ? (isFront ? 'front' : 'filled') : 'free'}
                data-rear={isRear ? 'true' : undefined}
                data-active={item?.active ? 'true' : undefined}
              >
                <span className="array-slot-index">[{slot}]</span>
                <span className="array-slot-value">{item ? valueText(item.value) : ''}</span>
              </div>
              <div className={`circular-pointer circular-front-pointer${isFront ? ' is-active' : ''}`}>
                {isFront ? 'FRONT ↑' : '\u00a0'}
              </div>
            </div>
          );
        })}
      </div>
      <div className="circular-wrap" aria-hidden="true">
        <span>↺</span>
        {lang === 'zh' ? 'rear 从最后一个槽位回绕到 0' : 'rear wraps from the last slot back to 0'}
      </div>
      <div className="storage-note">
        {lang === 'zh'
          ? '牺牲一个单元：front == rear 为空，(rear + 1) % capacity == front 为满；实际最多存 capacity − 1 个元素。'
          : 'One slot is reserved: front == rear means empty, (rear + 1) % capacity == front means full; at most capacity − 1 items.'}
      </div>
    </div>
  );
}

/** Linked queue: a dummy head, FRONT points at the head, REAR at the last data node. */
function LinkedQueueVisual({
  model,
  operationLabel,
  hint,
  compact,
}: {
  model: QueueVisualModel;
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const chain = chainFrom(model.nodes ?? [], model.frontId);
  return (
    <div
      className={`structure-visual queue-visual linked-queue-visual${compact ? ' is-compact' : ''}`}
      data-testid="linked-queue-visual"
      data-operation={model.operation}
      data-storage="linked"
      role="group"
      aria-label={lang === 'zh' ? '链队列：带头结点，front 指向头结点，rear 指向尾结点' : 'Linked queue: dummy head, front at head and rear at the tail'}
    >
      <StorageHeader model={model} operationLabel={operationLabel} hint={hint} lang={lang} />
      <div className="storage-meta-row">
        <span className="storage-chip">storage = linked</span>
        <span className="storage-chip" data-testid="linked-queue-front">front → {model.frontId ? 'head' : 'NULL'}</span>
        <span className="storage-chip" data-testid="linked-queue-rear">rear → {model.rearId === model.frontId ? 'head' : 'tail'}</span>
        <span className="storage-chip">size = {Math.max(0, chain.length - 1)}</span>
      </div>
      {model.removed ? (
        <div className="storage-removed" data-testid="linked-queue-leaving">
          {lang === 'zh' ? '已出队节点' : 'dequeued node'} <b>{valueText(model.removed.value)}</b>
        </div>
      ) : null}
      {chain.length === 0 ? (
        <div className="structure-empty storage-empty" data-testid="linked-queue-empty">
          <span>{model.label}</span>
          <span>front = rear = head</span>
        </div>
      ) : (
        <div className="storage-chain storage-chain-scroll" data-testid="linked-queue-chain">
          {chain.map(({ node, index }) => {
            const isHead = index === 0;
            const isRear = node.id === model.rearId;
            return (
              <div className="storage-chain-cell" key={node.id}>
                <div className={`storage-pointer${isHead ? ' is-active' : ''}`}>
                  {isHead ? 'FRONT ↓' : isRear ? 'REAR ↓' : '\u00a0'}
                </div>
                <div
                  className={`storage-node${isHead ? ' is-head' : ''}${isRear && !isHead ? ' is-rear' : ''}`}
                  data-testid={isHead ? 'linked-queue-head' : 'linked-queue-node'}
                  data-node-id={node.id}
                  data-value={isHead ? '' : valueText(node.value)}
                >
                  <span className="storage-node-value">{isHead ? 'HEAD' : valueText(node.value)}</span>
                  <span className="storage-node-next">{isHead ? 'dummy' : 'next'}</span>
                </div>
                {index < chain.length - 1 ? nodeArrow(lang) : <span className="storage-null">NULL</span>}
              </div>
            );
          })}
        </div>
      )}
      <div className="storage-note">
        {lang === 'zh'
          ? '入队接在 rear 后并把 rear 后移；出队删除 head.next，若删到最后一个数据结点，rear 回到 head。'
          : 'Enqueue links after rear and moves rear; dequeue removes head.next and resets rear to head when the last data node leaves.'}
      </div>
    </div>
  );
}
