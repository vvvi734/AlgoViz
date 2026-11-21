import { useI18n } from '../../i18n/I18nProvider';
import type {
  FileStructureGuidedInputAlgorithm,
  FileStructureInputFields,
} from '../../domain/algorithms/fileStructureInput';
import '../../styles/fileStructures.css';

const EMPTY: FileStructureInputFields = {
  records: '',
  indexKind: 'dense',
  blockCapacity: '3',
  targetKey: '',
  command: 'find',
  newLabel: '',
  queryTerms: '',
  queryMode: 'and',
};

export function FileStructureInputEditor({
  algorithm,
  draft,
  onChange,
}: {
  algorithm: FileStructureGuidedInputAlgorithm;
  draft: { file?: FileStructureInputFields };
  onChange: (fields: FileStructureInputFields) => void;
}) {
  const { t } = useI18n();
  const fields = draft.file ?? EMPTY;
  const set = (key: keyof FileStructureInputFields, value: string) =>
    onChange({ ...fields, [key]: value });

  if (algorithm === 'inverted-index') {
    return (
      <div className="file-input-editor" data-testid="inverted-input-editor">
        <label className="guided-external-runs">
          <span>
            {t('guidedInvertedRecordsLabel')}
            <small>{fields.records.split(/\r?\n/).filter(Boolean).length} / 9</small>
          </span>
          <textarea
            className="input code-dock-input file-records-input"
            id="run-input"
            data-testid="inverted-records"
            rows={5}
            value={fields.records}
            onChange={(event) => set('records', event.target.value)}
            placeholder={'R1: 数据结构, 算法\nR2: 算法, 排序'}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <div className="guided-field-grid">
          <label className="guided-field">
            <span>{t('guidedInvertedQueryLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="inverted-query-terms"
              value={fields.queryTerms}
              onChange={(event) => set('queryTerms', event.target.value)}
              placeholder="算法, 排序"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="guided-field">
            <span>{t('guidedInvertedModeLabel')}</span>
            <select
              className="input code-dock-input"
              data-testid="inverted-mode"
              value={fields.queryMode}
              onChange={(event) => set('queryMode', event.target.value)}
            >
              <option value="and">{t('guidedModeAnd')}</option>
              <option value="or">{t('guidedModeOr')}</option>
            </select>
          </label>
        </div>
        <p className="guided-hint note muted">{t('guidedInvertedRecordsHint')}</p>
      </div>
    );
  }

  const isIsam = algorithm === 'isam';
  return (
    <div className="file-input-editor" data-testid={isIsam ? 'isam-input-editor' : 'file-index-input-editor'}>
      <label className="guided-external-runs">
        <span>
          {t('guidedFileRecordsLabel')}
          <small>{fields.records.split(/\r?\n/).filter(Boolean).length} / {isIsam ? 18 : 12}</small>
        </span>
        <textarea
          className="input code-dock-input file-records-input"
          id="run-input"
          data-testid={isIsam ? 'isam-records' : 'file-index-records'}
          rows={5}
          value={fields.records}
          onChange={(event) => set('records', event.target.value)}
          placeholder={'101, A\n102, B\n103, C'}
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      <div className="guided-field-grid">
        {isIsam ? (
          <label className="guided-field">
            <span>{t('guidedIsamCommandLabel')}</span>
            <select
              className="input code-dock-input"
              data-testid="isam-command"
              value={fields.command}
              onChange={(event) => set('command', event.target.value)}
            >
              <option value="find">{t('guidedIsamFind')}</option>
              <option value="insert">{t('guidedIsamInsert')}</option>
            </select>
          </label>
        ) : (
          <label className="guided-field">
            <span>{t('guidedFileIndexKindLabel')}</span>
            <select
              className="input code-dock-input"
              data-testid="file-index-kind"
              value={fields.indexKind}
              onChange={(event) => set('indexKind', event.target.value)}
            >
              <option value="dense">{t('guidedFileDense')}</option>
              <option value="sparse">{t('guidedFileSparse')}</option>
            </select>
          </label>
        )}
        <label className="guided-field">
          <span>{t('guidedFileCapacityLabel')}</span>
          <input
            className="input code-dock-input"
            data-testid={isIsam ? 'isam-block-capacity' : 'file-index-block-capacity'}
            value={fields.blockCapacity}
            onChange={(event) => set('blockCapacity', event.target.value)}
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="guided-field">
          <span>{isIsam && fields.command === 'insert' ? t('guidedIsamInsertKeyLabel') : t('guidedFileTargetLabel')}</span>
          <input
            className="input code-dock-input"
            data-testid={isIsam ? 'isam-target-key' : 'file-index-target-key'}
            value={fields.targetKey}
            onChange={(event) => set('targetKey', event.target.value)}
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        {isIsam && fields.command === 'insert' ? (
          <label className="guided-field">
            <span>{t('guidedIsamNewLabelLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="isam-new-label"
              value={fields.newLabel}
              onChange={(event) => set('newLabel', event.target.value)}
              maxLength={12}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        ) : null}
      </div>
      <p className="guided-hint note muted">{t('guidedFileRecordsHint')}</p>
    </div>
  );
}
