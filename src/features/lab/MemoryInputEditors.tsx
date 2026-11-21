import { useI18n } from '../../i18n/I18nProvider';
import {
  nextBuddyRow,
  type BuddyInputDraft,
  type BuddyOperationRow,
} from '../../domain/algorithms/buddyInput';
import {
  nextFreeListRow,
  type FreeListInputDraft,
  type FreeListOperationRow,
} from '../../domain/algorithms/freeListInput';
import {
  nextGarbageRow,
  type GarbageInputDraft,
  type GarbageObjectRow,
} from '../../domain/algorithms/garbageInput';

interface OperationRow {
  id: string;
  op: 'alloc' | 'free';
  blockId: string;
  size: string;
}

function OperationTable({
  rows,
  onChange,
  testPrefix,
  onAdd,
}: {
  rows: OperationRow[];
  onChange: (rows: Array<FreeListOperationRow & BuddyOperationRow>) => void;
  testPrefix: 'free' | 'buddy';
  onAdd: () => OperationRow;
}) {
  const { t, b } = useI18n();
  const update = (rowId: string, patch: Partial<OperationRow>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)) as Array<FreeListOperationRow & BuddyOperationRow>);
  };
  return (
    <div className="memory-editor-block">
      <div className="memory-editor-title">{t('memoryOperationsLabel')}</div>
      <div className="memory-op-table" data-testid={`${testPrefix}-operations`}>
        <span className="memory-op-head">{b('#', '#')}</span>
        <span className="memory-op-head">{b('操作', 'Op')}</span>
        <span className="memory-op-head">{t('memoryBlockIdLabel')}</span>
        <span className="memory-op-head">{t('memorySizeLabel')}</span>
        <span className="memory-op-head" />
        {rows.map((row, index) => (
          <div className="memory-op-row" key={row.id} data-testid={`${testPrefix}-row-${index}`}>
            <span className="memory-op-index">{index + 1}</span>
            <select
              className="input memory-op-select"
              aria-label={b('操作类型', 'Operation type')}
              value={row.op}
              data-testid={`${testPrefix}-row-${index}-op`}
              onChange={(event) => update(row.id, { op: event.target.value === 'free' ? 'free' : 'alloc' })}
            >
              <option value="alloc">{t('memoryOpAlloc')}</option>
              <option value="free">{t('memoryOpFree')}</option>
            </select>
            <input
              className="input memory-op-id"
              aria-label={t('memoryBlockIdLabel')}
              value={row.blockId}
              data-testid={`${testPrefix}-row-${index}-id`}
              onChange={(event) => update(row.id, { blockId: event.target.value })}
              placeholder="A"
              maxLength={3}
              spellCheck={false}
              autoComplete="off"
            />
            <input
              className="input memory-op-size"
              aria-label={t('memorySizeLabel')}
              value={row.op === 'free' ? '' : row.size}
              data-testid={`${testPrefix}-row-${index}-size`}
              onChange={(event) => update(row.id, { size: event.target.value })}
              placeholder={row.op === 'free' ? '—' : '8'}
              inputMode="numeric"
              disabled={row.op === 'free'}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              className="btn small memory-op-remove"
              type="button"
              aria-label={t('memoryRemoveRow')}
              data-testid={`${testPrefix}-row-${index}-remove`}
              disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((candidate) => candidate.id !== row.id) as Array<FreeListOperationRow & BuddyOperationRow>)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        className="btn small memory-add-row"
        type="button"
        data-testid={`${testPrefix}-add-row`}
        disabled={rows.length >= 12}
        onClick={() => onChange([...rows, onAdd()] as Array<FreeListOperationRow & BuddyOperationRow>)}
      >
        + {t('memoryAddOperation')}
      </button>
    </div>
  );
}

export function FreeListInputEditor({
  draft,
  onChange,
}: {
  draft: FreeListInputDraft;
  onChange: (draft: FreeListInputDraft) => void;
}) {
  const { t, b } = useI18n();
  return (
    <div className="memory-editor" data-testid="free-editor">
      <div className="memory-field-row">
        <label className="memory-field">
          <span>{t('memoryCapacityLabel')}</span>
          <input
            className="input memory-capacity"
            data-testid="free-capacity"
            value={draft.capacity}
            onChange={(event) => onChange({ ...draft, capacity: event.target.value })}
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="memory-field">
          <span>{t('memoryPolicyLabel')}</span>
          <select
            className="input"
            data-testid="free-policy"
            value={draft.policy}
            onChange={(event) =>
              onChange({ ...draft, policy: event.target.value === 'best-fit' ? 'best-fit' : 'first-fit' })
            }
          >
            <option value="first-fit">{t('memoryFirstFit')}</option>
            <option value="best-fit">{t('memoryBestFit')}</option>
          </select>
        </label>
      </div>
      <OperationTable
        rows={draft.rows}
        testPrefix="free"
        onAdd={() => nextFreeListRow(draft.rows)}
        onChange={(rows) => onChange({ ...draft, rows })}
      />
      <p className="memory-field-note">{b('释放行不需要大小；申请大小必须能放进当前容量。', 'A free row needs no size; a request must fit in the capacity.')}</p>
    </div>
  );
}

export function BuddyInputEditor({
  draft,
  onChange,
}: {
  draft: BuddyInputDraft;
  onChange: (draft: BuddyInputDraft) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="memory-editor" data-testid="buddy-editor">
      <div className="memory-field-row">
        <label className="memory-field">
          <span>{t('memoryCapacityLabel')}</span>
          <input
            className="input memory-capacity"
            data-testid="buddy-capacity"
            value={draft.capacity}
            onChange={(event) => onChange({ ...draft, capacity: event.target.value })}
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>
      <p className="memory-field-note">{t('memoryBuddyCapacityHint')}</p>
      <OperationTable
        rows={draft.rows}
        testPrefix="buddy"
        onAdd={() => nextBuddyRow(draft.rows)}
        onChange={(rows) => onChange({ ...draft, rows })}
      />
      <p className="memory-field-note">{t('memoryFreeSizeNote')}</p>
    </div>
  );
}

function replaceObjectToken(value: string, previous: string, next: string): string {
  if (!previous || previous === next) return value;
  return value
    .split(/[,，\s]+/)
    .map((token) => (token === previous ? next : token))
    .filter(Boolean)
    .join(', ');
}

export function GarbageCollectionInputEditor({
  draft,
  onChange,
}: {
  draft: GarbageInputDraft;
  onChange: (draft: GarbageInputDraft) => void;
}) {
  const { t, b } = useI18n();
  const updateRow = (rowId: string, patch: Partial<GarbageObjectRow>) => {
    const nextObjects = draft.objects.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    if (patch.objectId === undefined) {
      onChange({ ...draft, objects: nextObjects });
      return;
    }
    const previous = draft.objects.find((row) => row.id === rowId)?.objectId ?? '';
    const renamed = patch.objectId;
    onChange({
      ...draft,
      roots: replaceObjectToken(draft.roots, previous, renamed),
      objects: nextObjects.map((row) => ({
        ...row,
        refs: replaceObjectToken(row.refs, previous, renamed),
      })),
    });
  };
  const removeRow = (rowId: string) => {
    const target = draft.objects.find((row) => row.id === rowId);
    const remaining = draft.objects.filter((row) => row.id !== rowId);
    onChange({
      ...draft,
      roots: target ? replaceObjectToken(draft.roots, target.objectId, '') : draft.roots,
      objects: target
        ? remaining.map((row) => ({ ...row, refs: replaceObjectToken(row.refs, target.objectId, '') }))
        : remaining,
    });
  };
  return (
    <div className="memory-editor gc-editor" data-testid="gc-editor">
      <div className="memory-field-row">
        <label className="memory-field">
          <span>{t('gcModeLabel')}</span>
          <select
            className="input"
            data-testid="gc-mode"
            value={draft.mode}
            onChange={(event) =>
              onChange({ ...draft, mode: event.target.value === 'compaction' ? 'compaction' : 'mark-sweep' })
            }
          >
            <option value="mark-sweep">{t('gcModeMarkSweep')}</option>
            <option value="compaction">{t('gcModeCompaction')}</option>
          </select>
        </label>
        <label className="memory-field">
          <span>{t('gcCapacityLabel')}</span>
          <input
            className="input memory-capacity"
            data-testid="gc-capacity"
            value={draft.capacity}
            onChange={(event) => onChange({ ...draft, capacity: event.target.value })}
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="memory-field memory-field-wide">
          <span>{t('gcRootsLabel')}</span>
          <input
            className="input"
            data-testid="gc-roots"
            value={draft.roots}
            onChange={(event) => onChange({ ...draft, roots: event.target.value })}
            placeholder={t('gcRootsPlaceholder')}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>
      <p className="memory-field-note">{t('gcModeNote')}</p>
      <div className="memory-editor-block">
        <div className="memory-editor-title">{t('gcObjectsLabel')}</div>
        <div className="gc-object-table" data-testid="gc-objects">
          <span className="memory-op-head">{t('gcObjectIdLabel')}</span>
          <span className="memory-op-head">{t('gcObjectSizeLabel')}</span>
          <span className="memory-op-head">{t('gcRefsLabel')}</span>
          <span className="memory-op-head" />
          {draft.objects.map((row, index) => (
            <div className="gc-object-row" key={row.id} data-testid={`gc-object-${index}`}>
              <input
                className="input memory-op-id"
                aria-label={t('gcObjectIdLabel')}
                value={row.objectId}
                data-testid={`gc-object-${index}-id`}
                onChange={(event) => updateRow(row.id, { objectId: event.target.value })}
                placeholder="A"
                maxLength={3}
                spellCheck={false}
                autoComplete="off"
              />
              <input
                className="input memory-op-size"
                aria-label={t('gcObjectSizeLabel')}
                value={row.size}
                data-testid={`gc-object-${index}-size`}
                onChange={(event) => updateRow(row.id, { size: event.target.value })}
                placeholder="8"
                inputMode="numeric"
                spellCheck={false}
                autoComplete="off"
              />
              <input
                className="input gc-refs-input"
                aria-label={t('gcRefsLabel')}
                value={row.refs}
                data-testid={`gc-object-${index}-refs`}
                onChange={(event) => updateRow(row.id, { refs: event.target.value })}
                placeholder={t('gcRefsPlaceholder')}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className="btn small memory-op-remove"
                type="button"
                aria-label={t('memoryRemoveRow')}
                data-testid={`gc-object-${index}-remove`}
                disabled={draft.objects.length <= 1}
                onClick={() => removeRow(row.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn small memory-add-row"
          type="button"
          data-testid="gc-add-object"
          disabled={draft.objects.length >= 8}
          onClick={() => onChange({ ...draft, objects: [...draft.objects, nextGarbageRow(draft.objects)] })}
        >
          + {t('gcAddObject')}
        </button>
      </div>
      <p className="memory-field-note">{b('地址由算法分配，编辑时只改对象与引用。', 'Addresses are assigned by the program; edit only objects and references.')}</p>
    </div>
  );
}
