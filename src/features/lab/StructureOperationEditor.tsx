import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import {
  STRUCTURE_LIMITS,
  structureFieldLabelKey,
  structureOperationSpecs,
  type StructureGuidedInputAlgorithm,
  type StructureOperationDraft,
} from '../../domain/algorithms/structureInput';

interface StructureOperationEditorProps {
  algorithm: StructureGuidedInputAlgorithm;
  rows: StructureOperationDraft[];
  initialValues: string;
  onChangeRows: (rows: StructureOperationDraft[]) => void;
  onChangeInitialValues: (value: string) => void;
}

function nextRowId(rows: StructureOperationDraft[]): string {
  const used = new Set(rows.map((row) => row.id));
  let sequence = rows.length + 1;
  while (used.has(`r${sequence}`)) sequence += 1;
  return `r${sequence}`;
}

/**
 * INPUT-04: compact structured row editor. It never writes JSON and only offers
 * operations that the selected Python program actually handles.
 */
export function StructureOperationEditor({
  algorithm,
  rows,
  initialValues,
  onChangeRows,
  onChangeInitialValues,
}: StructureOperationEditorProps) {
  const { t } = useI18n();
  const specs = structureOperationSpecs(algorithm);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Switching algorithms should never leave the new editor hidden.
    setCollapsed(false);
  }, [algorithm]);

  const update = (index: number, patch: Partial<StructureOperationDraft>) => {
    onChangeRows(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  };

  const changeOperation = (index: number, op: string) => {
    // Clear old arguments: an old anchor must not silently become the value of
    // another operation after the type changes.
    update(index, { op, value: '', index: '', anchor: '' });
  };

  const addRow = () => {
    if (rows.length >= STRUCTURE_LIMITS.MAX_OPERATIONS) return;
    onChangeRows([...rows, { id: nextRowId(rows), op: specs[0]!.op, value: '', index: '', anchor: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChangeRows(rows.filter((_, position) => position !== index));
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChangeRows(next);
  };

  const fieldInput = (
    row: StructureOperationDraft,
    spec: (typeof specs)[number],
    field: 'value' | 'index' | 'anchor',
    rowIndex: number,
  ) => (
    <label className="structure-field" key={field}>
      <span>{t(structureFieldLabelKey(field))}</span>
      <input
        className="input structure-field-input"
        data-testid={`structure-op-${field}`}
        value={row[field]}
        onChange={(event) => update(rowIndex, { [field]: event.target.value })}
        placeholder={field === 'index' ? '0' : field === 'anchor' ? '5' : '7'}
        inputMode="numeric"
        step={1}
        type="number"
        aria-label={`${t(spec.labelKey)} ${t(structureFieldLabelKey(field))}`}
      />
    </label>
  );

  return (
    <div className="structure-editor" data-testid="structure-editor" data-algorithm={algorithm}>
      {algorithm === 'seqlist' ? (
        <div className="structure-initial">
          <label className="structure-field structure-initial-field">
            <span>{t('structureInitialValues')}</span>
            <input
              className="input code-dock-input"
              data-testid="structure-initial-values"
              value={initialValues}
              onChange={(event) => onChangeInitialValues(event.target.value)}
              placeholder="10, 20, 30, 40, 50"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <span className="structure-capacity-note">
            {t('structureCapacityNote').replace('{capacity}', String(STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY))}
          </span>
        </div>
      ) : null}

      <div className="structure-editor-head">
        <span>{t('structureOperationsLabel')}</span>
        <span className="structure-row-count" data-testid="structure-row-count">
          {rows.length} / {STRUCTURE_LIMITS.MAX_OPERATIONS}
        </span>
        <button
          className="btn small structure-add"
          type="button"
          onClick={addRow}
          disabled={collapsed || rows.length >= STRUCTURE_LIMITS.MAX_OPERATIONS}
          data-testid="structure-add"
        >
          + {t('structureAddOperation')}
        </button>
        <button
          className="btn small structure-toggle"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          data-testid="structure-toggle"
        >
          {collapsed ? t('structureExpand') : t('structureCollapse')}
        </button>
      </div>

      {collapsed ? null : (
        <div className="structure-rows" data-testid="structure-op-list">
          {rows.map((row, index) => {
            const spec = specs.find((candidate) => candidate.op === row.op) ?? specs[0]!;
            const fields = spec.fields;
            return (
              <div className="structure-row" data-testid="structure-op-row" data-op={row.op} key={row.id}>
                <span className="structure-row-index">{index + 1}</span>
                <select
                  id={index === 0 ? 'run-input' : undefined}
                  className="input structure-op-select"
                  data-testid="structure-op-type"
                  value={row.op}
                  onChange={(event) => changeOperation(index, event.target.value)}
                  aria-label={`${t('structureOperationsLabel')} ${index + 1}`}
                >
                  {specs.map((candidate) => (
                    <option key={candidate.op} value={candidate.op}>
                      {t(candidate.labelKey)}
                    </option>
                  ))}
                </select>
                {fields.includes('anchor') ? fieldInput(row, spec, 'anchor', index) : null}
                {fields.includes('index') ? fieldInput(row, spec, 'index', index) : null}
                {fields.includes('value') ? fieldInput(row, spec, 'value', index) : null}
                <div className="structure-row-actions">
                  <button
                    className="btn small structure-move"
                    type="button"
                    onClick={() => moveRow(index, -1)}
                    disabled={index === 0}
                    aria-label={t('structureMoveUp')}
                    data-testid="structure-row-up"
                  >
                    ↑
                  </button>
                  <button
                    className="btn small structure-move"
                    type="button"
                    onClick={() => moveRow(index, 1)}
                    disabled={index === rows.length - 1}
                    aria-label={t('structureMoveDown')}
                    data-testid="structure-row-down"
                  >
                    ↓
                  </button>
                  <button
                    className="btn small structure-remove"
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 1}
                    aria-label={t('structureRemoveOperation')}
                    data-testid="structure-row-remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
