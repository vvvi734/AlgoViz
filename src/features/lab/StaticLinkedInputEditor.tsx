import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import {
  CHAPTER2_LIMITS,
  type StaticLinkedInputFields,
  type StaticLinkedOperation,
} from '../../domain/algorithms/chapter2Input';

/**
 * TEXTBOOK-02 structured editor for the static list. It exposes capacity,
 * initial values and logical 1-based operations; it never asks for JSON.
 */
export function StaticLinkedInputEditor({
  fields,
  onChange,
}: {
  fields: StaticLinkedInputFields;
  onChange: (next: StaticLinkedInputFields) => void;
}) {
  const { b } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setCollapsed(false), []);

  const updateRow = (index: number, patch: Partial<StaticLinkedInputFields['operations'][number]>) => {
    onChange({
      ...fields,
      operations: fields.operations.map((row, position) => (position === index ? { ...row, ...patch } : row)),
    });
  };

  const changeOperation = (index: number, op: StaticLinkedOperation) => {
    updateRow(index, { op, position: '', value: '' });
  };

  const addRow = () => {
    if (fields.operations.length >= CHAPTER2_LIMITS.STATIC_MAX_OPERATIONS) return;
    onChange({
      ...fields,
      operations: [
        ...fields.operations,
        { id: `s${fields.operations.length + 1}-${Date.now()}`, op: 'insert', position: '', value: '' },
      ],
    });
  };

  return (
    <div className="structure-editor static-input-editor" data-testid="static-linked-editor">
      <div className="structure-initial">
        <label className="structure-field structure-initial-field">
          <span>{b('数组容量', 'Array capacity')}</span>
          <input
            className="input structure-field-input"
            data-testid="static-capacity"
            type="number"
            min={CHAPTER2_LIMITS.STATIC_MIN_CAPACITY}
            max={CHAPTER2_LIMITS.STATIC_MAX_CAPACITY}
            value={fields.capacity}
            onChange={(event) => onChange({ ...fields, capacity: event.target.value })}
          />
        </label>
        <label className="structure-field structure-initial-field">
          <span>{b('初始值（按逻辑顺序）', 'Initial values (logical order)')}</span>
          <input
            className="input code-dock-input"
            data-testid="static-values"
            value={fields.values}
            onChange={(event) => onChange({ ...fields, values: event.target.value })}
            placeholder="10, 20, 30"
            spellCheck={false}
          />
        </label>
        <span className="structure-capacity-note">
          {b('容量 4–10；位置从 1 开始', 'Capacity 4–10; positions start at 1')}
        </span>
      </div>

      <div className="structure-editor-head">
        <span>{b('逻辑操作序列', 'Logical operations')}</span>
        <span className="structure-row-count">{fields.operations.length} / {CHAPTER2_LIMITS.STATIC_MAX_OPERATIONS}</span>
        <button
          className="btn small structure-add"
          type="button"
          onClick={addRow}
          disabled={fields.operations.length >= CHAPTER2_LIMITS.STATIC_MAX_OPERATIONS}
          data-testid="static-add-operation"
        >
          + {b('添加操作', 'Add operation')}
        </button>
        <button
          className="btn small structure-toggle"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          data-testid="static-toggle"
        >
          {collapsed ? b('展开', 'Expand') : b('收起', 'Collapse')}
        </button>
      </div>

      {collapsed ? null : (
        <div className="structure-rows" data-testid="static-operation-list">
          {fields.operations.length === 0 ? (
            <span className="structure-capacity-note">
              {b('没有操作时只显示初始结构', 'With no operations the initial structure is shown')}
            </span>
          ) : null}
          {fields.operations.map((row, index) => (
            <div className="structure-row" key={row.id} data-testid="static-operation-row" data-op={row.op}>
              <span className="structure-row-index">{index + 1}</span>
              <select
                className="input structure-op-select"
                data-testid="static-operation-type"
                value={row.op}
                onChange={(event) => changeOperation(index, event.target.value as StaticLinkedOperation)}
                aria-label={`${b('操作', 'Operation')} ${index + 1}`}
              >
                <option value="insert">{b('插入', 'Insert')}</option>
                <option value="delete">{b('删除', 'Delete')}</option>
                <option value="traverse">{b('遍历', 'Traverse')}</option>
              </select>
              {row.op !== 'traverse' ? (
                <label className="structure-field">
                  <span>{b('位置', 'Position')}</span>
                  <input
                    className="input structure-field-input"
                    data-testid="static-position"
                    type="number"
                    min={1}
                    value={row.position}
                    onChange={(event) => updateRow(index, { position: event.target.value })}
                    placeholder="2"
                  />
                </label>
              ) : null}
              {row.op === 'insert' ? (
                <label className="structure-field">
                  <span>{b('值', 'Value')}</span>
                  <input
                    className="input structure-field-input"
                    data-testid="static-value"
                    type="number"
                    value={row.value}
                    onChange={(event) => updateRow(index, { value: event.target.value })}
                    placeholder="25"
                  />
                </label>
              ) : null}
              <div className="structure-row-actions">
                <button
                  className="btn small structure-remove"
                  type="button"
                  onClick={() => onChange({ ...fields, operations: fields.operations.filter((_, position) => position !== index) })}
                  aria-label={b('删除操作', 'Remove operation')}
                  data-testid="static-remove-operation"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
