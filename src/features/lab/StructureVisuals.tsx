import { useI18n } from '../../i18n/I18nProvider';
import type { StructureItemModel } from '../../domain/visualization/model';
import type { StructureOperation } from '../../domain/trace/schema';

/**
 * Stage 7B dedicated renderers. They only paint a `stack`/`queue` model built
 * from a real Trace Event; no operation is read from text and no playback
 * state is kept here. Element ids and order come straight from the runner.
 */
type StructureModel = {
  operation: StructureOperation;
  items: StructureItemModel[];
  removed?: StructureItemModel;
  empty: boolean;
  label: string;
};

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
  model: StructureModel;
  /** Stage 7E graph frontier: override the container operation headline. */
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { t, lang } = useI18n();
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
  model: StructureModel;
  /** Stage 7E graph frontier: override the container operation headline. */
  operationLabel?: string;
  hint?: string | null;
  compact?: boolean;
}) {
  const { t, lang } = useI18n();
  const activeFront = model.operation === 'front' || model.operation === 'dequeue';
  const activeRear = model.operation === 'enqueue';
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

      {model.removed && (
        <div className="queue-exit" data-testid="queue-exit">
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
          <span className="queue-exit-label">{t('structureQueueFront')}</span>
        </div>
      )}

      <div className="queue-track" data-testid="queue-track">
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
