import { useI18n } from '../../i18n/I18nProvider';
import type {
  FileIndexVisualModel,
  InvertedVisualModel,
  IsamVisualModel,
  FileRecordView,
} from '../../domain/visualization/fileStructureModel';
import '../../styles/fileStructures.css';

const FILE_INDEX_OP: Record<FileIndexVisualModel['operation'], string> = {
  init: 'fileIndexOpInit',
  'index-probe': 'fileIndexOpProbe',
  'read-block': 'fileIndexOpRead',
  compare: 'fileIndexOpCompare',
  found: 'fileIndexOpFound',
  'not-found': 'fileIndexOpNotFound',
  done: 'fileIndexOpDone',
};

const ISAM_OP: Record<IsamVisualModel['operation'], string> = {
  init: 'isamOpInit',
  'index-probe': 'isamOpProbe',
  'read-main': 'isamOpReadMain',
  compare: 'isamOpCompare',
  'read-overflow': 'isamOpReadOverflow',
  found: 'isamOpFound',
  'not-found': 'isamOpNotFound',
  'insert-main': 'isamOpInsertMain',
  'insert-overflow': 'isamOpInsertOverflow',
  'link-overflow': 'isamOpLink',
  'index-update': 'isamOpIndexUpdate',
  done: 'isamOpDone',
};

const INVERTED_OP: Record<InvertedVisualModel['operation'], string> = {
  init: 'invertedOpInit',
  'scan-record': 'invertedOpScan',
  'term-add': 'invertedOpAdd',
  'build-done': 'invertedOpBuildDone',
  'query-term': 'invertedOpQueryTerm',
  combine: 'invertedOpCombine',
  done: 'invertedOpDone',
};

function FileRecordChip({
  record,
  testId,
}: {
  record: FileRecordView;
  testId: string;
}) {
  return (
    <span
      className={`file-record is-${record.state}`}
      data-testid={testId}
      data-record-id={record.id}
      data-key={record.key}
      data-state={record.state}
    >
      <strong>{record.key}</strong>
      <small>{record.label}</small>
    </span>
  );
}

export function FileIndexVisual({ model }: { model: FileIndexVisualModel }) {
  const { t, lang } = useI18n();
  const pathEntry = model.currentIndexIndex === null ? null : model.entries[model.currentIndexIndex];
  return (
    <div
      className="file-visual file-index-visual"
      data-testid="file-index-visual"
      data-operation={model.operation}
      data-index-kind={model.indexKind}
      data-result={model.result ?? ''}
    >
      <div className="sort10-head file-head">
        <span className="sort10-op">{t(FILE_INDEX_OP[model.operation])}</span>
        <span className="sort10-meta">
          {t('fileIndexKindLabel')} <strong>{model.indexKind === 'dense' ? t('fileIndexDense') : t('fileIndexSparse')}</strong>
        </span>
        <span className="sort10-meta">{t('fileIndexTargetLabel')} <strong>{model.targetKey}</strong></span>
        <span className="sort10-meta">{t('fileIndexCapacityLabel')} <strong>{model.blockCapacity}</strong></span>
      </div>

      <div className="file-io-strip" aria-label={t('fileIndexIoLabel')}>
        <div><span>{t('fileIndexEntriesCount')}</span><strong>{model.entries.length}</strong></div>
        <div><span>{t('fileIndexProbes')}</span><strong>{model.indexEntryProbes}</strong></div>
        <div><span>{t('fileIndexIndexReads')}</span><strong>{model.indexBlockReads}</strong></div>
        <div><span>{t('fileIndexDataReads')}</span><strong>{model.dataBlockReads}</strong></div>
        <small>{t('fileIndexIoNote')}</small>
      </div>

      <section className="file-panel file-index-panel" aria-label={t('fileIndexTableLabel')}>
        <header>
          <h4>{t('fileIndexTableLabel')}</h4>
          <span>{t('fileIndexTableHint')}</span>
        </header>
        <div className="file-index-entries" data-testid="file-index-entries">
          {model.entries.map((entry, index) => (
            <div
              className={`file-index-entry${entry.active ? ' is-active' : ''}${entry.path ? ' is-path' : ''}`}
              key={`${entry.key}-${entry.blockId}-${index}`}
              data-testid="file-index-entry"
              data-key={entry.key}
              data-block={entry.blockId}
            >
              <strong>{entry.key}</strong>
              <span className="file-index-arrow">→</span>
              <small>{entry.blockId}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="file-path" data-testid="file-index-path">
        <span>{t('fileIndexPathLabel')}</span>
        <b>{model.targetKey}</b>
        <span>→</span>
        <b>{pathEntry ? pathEntry.blockId : '—'}</b>
        <span>→</span>
        <b>{model.foundId ?? t('fileIndexNoRecord')}</b>
      </div>

      <section className="file-panel" aria-label={t('fileIndexDataLabel')}>
        <header>
          <h4>{t('fileIndexDataLabel')}</h4>
          <span>{t('fileIndexDataHint').replace('{capacity}', String(model.blockCapacity))}</span>
        </header>
        <div className="file-block-grid" data-testid="file-index-blocks">
          {model.blocks.map((block) => (
            <article
              className={`file-block${block.current ? ' is-current' : ''}`}
              key={block.id}
              data-testid="file-index-block"
              data-block-id={block.id}
            >
              <header>
                <b>{block.id}</b>
                <span>{t('fileIndexBlockMax')} {block.indexKey}</span>
                {block.current ? <em>{t('fileIndexCurrentBlock')}</em> : null}
              </header>
              <div className="file-record-row">
                {block.records.map((record) => (
                  <FileRecordChip key={record.id} record={record} testId="file-index-record" />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {model.operation === 'done' ? (
        <div
          className={`file-result ${model.result === 'found' ? 'is-found' : 'is-miss'}`}
          data-testid="file-index-result"
          data-result={model.result ?? ''}
        >
          <b>{model.result === 'found' ? t('fileIndexHit') : t('fileIndexMiss')}</b>
          <span>
            {model.result === 'found'
              ? t('fileIndexHitDetail').replace('{id}', model.foundId ?? '').replace('{key}', String(model.targetKey))
              : t('fileIndexMissDetail').replace('{key}', String(model.targetKey))}
          </span>
          <small>{lang === 'zh' ? '块计数是教学模拟，不是真实磁盘测量。' : 'Block counters are teaching simulations, not real disk measurements.'}</small>
        </div>
      ) : null}
    </div>
  );
}

export function IsamVisual({ model }: { model: IsamVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="file-visual isam-visual"
      data-testid="isam-visual"
      data-operation={model.operation}
      data-command={model.command}
      data-result={model.result ?? ''}
    >
      <div className="sort10-head file-head">
        <span className="sort10-op">{t(ISAM_OP[model.operation])}</span>
        <span className="sort10-meta">
          {t('isamCommandLabel')} <strong>{model.command === 'insert' ? t('isamCommandInsert') : t('isamCommandFind')}</strong>
        </span>
        <span className="sort10-meta">{t('isamTargetLabel')} <strong>{model.targetKey}</strong></span>
        <span className="sort10-meta">{t('fileIndexCapacityLabel')} <strong>{model.blockCapacity}</strong></span>
      </div>

      <div className="file-io-strip" aria-label={t('isamIoLabel')}>
        <div><span>{t('fileIndexIndexReads')}</span><strong>{model.indexBlockReads}</strong></div>
        <div><span>{t('isamMainReads')}</span><strong>{model.mainBlockReads}</strong></div>
        <div><span>{t('isamOverflowReads')}</span><strong>{model.overflowBlockReads}</strong></div>
        <div><span>{t('isamOverflowNodesCount')}</span><strong>{model.overflowNodes.length}</strong></div>
        <small>{t('isamIoNote')}</small>
      </div>

      <section className="file-panel" aria-label={t('isamIndexLabel')}>
        <header>
          <h4>{t('isamIndexLabel')}</h4>
          <span>{t('isamIndexHint')}</span>
        </header>
        <div className="file-index-entries isam-index-entries" data-testid="isam-index-entries">
          {model.entries.map((entry, index) => (
            <div
              className={`file-index-entry${entry.active ? ' is-active' : ''}${entry.path ? ' is-path' : ''}`}
              key={`${entry.key}-${entry.blockId}-${index}`}
              data-testid="isam-index-entry"
            >
              <span>{t('isamLessOrEqual')}</span>
              <strong>{entry.key}</strong>
              <span className="file-index-arrow">→</span>
              <small>{entry.blockId}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="file-path" data-testid="isam-path">
        <span>{t('isamPathLabel')}</span>
        <b>{model.targetKey}</b>
        <span>→</span>
        <b>{model.selectedBlockId ?? '—'}</b>
        <span>→</span>
        <b>{model.currentOverflowId ?? t('isamMainAreaShort')}</b>
      </div>

      <section className="file-panel" aria-label={t('isamMainLabel')}>
        <header>
          <h4>{t('isamMainLabel')}</h4>
          <span>{t('isamMainHint')}</span>
        </header>
        <div className="isam-block-grid" data-testid="isam-blocks">
          {model.blocks.map((block) => (
            <article
              className={`isam-block${block.current ? ' is-current' : ''}${block.overflow.length ? ' has-overflow' : ''}`}
              key={block.id}
              data-testid="isam-block"
              data-block-id={block.id}
            >
              <header>
                <b>{block.id}</b>
                <span>{t('isamUpperBound')} {block.indexKey}</span>
              </header>
              <div className="file-record-row">
                {block.records.map((record) => (
                  <FileRecordChip key={record.id} record={record} testId="isam-record" />
                ))}
              </div>
              <div className="isam-overflow">
                <span className="isam-overflow-label">{t('isamOverflowLabel')}</span>
                {block.overflow.length ? block.overflow.map((node) => (
                  <div className="isam-overflow-chain" key={node.id}>
                    <div
                      className={`isam-overflow-node${node.active ? ' is-current' : ''}`}
                      data-testid="isam-overflow-node"
                      data-node-id={node.id}
                    >
                      <b>{node.id}</b>
                      <div className="file-record-row">
                        {node.records.map((record) => (
                          <FileRecordChip key={record.id} record={record} testId="isam-record" />
                        ))}
                      </div>
                    </div>
                    {node.nextId ? <span className="isam-next">→ {node.nextId}</span> : <span className="isam-next is-null">NULL</span>}
                  </div>
                )) : <span className="isam-overflow-empty">{t('isamEmptyOverflow')}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {model.operation === 'done' ? (
        <div
          className={`file-result ${model.result === 'not-found' ? 'is-miss' : 'is-found'}`}
          data-testid="isam-result"
          data-result={model.result ?? ''}
        >
          <b>
            {model.result === 'inserted'
              ? t('isamInsertedResult').replace('{id}', model.insertedId ?? '')
              : model.result === 'found'
                ? t('isamFoundResult').replace('{id}', model.foundId ?? '')
                : t('isamMissResult')}
          </b>
          <span>{model.overflowNodes.length ? t('isamChainDetail') : t('isamNoChainDetail')}</span>
          <small>{t('isamIoNote')}</small>
        </div>
      ) : null}
    </div>
  );
}

export function InvertedIndexVisual({ model }: { model: InvertedVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="file-visual inverted-visual"
      data-testid="inverted-index-visual"
      data-operation={model.operation}
      data-mode={model.mode}
      data-result={model.result ?? ''}
    >
      <div className="sort10-head file-head">
        <span className="sort10-op">{t(INVERTED_OP[model.operation])}</span>
        <span className="sort10-meta">
          {t('invertedModeLabel')} <strong>{model.mode === 'and' ? 'AND ∩' : 'OR ∪'}</strong>
        </span>
        <span className="sort10-meta">{t('invertedBuiltLabel')} <strong>{model.builtCount} / {model.records.length}</strong></span>
        <span className="sort10-meta">{t('invertedMatchedLabel')} <strong>{model.matchedIds.length}</strong></span>
      </div>

      <div className="file-io-strip inverted-summary">
        <div><span>{t('invertedRecordCount')}</span><strong>{model.records.length}</strong></div>
        <div><span>{t('invertedTermCount')}</span><strong>{model.entries.length}</strong></div>
        <div><span>{t('invertedQueryCount')}</span><strong>{model.queryTerms.length}</strong></div>
        <div><span>{t('invertedMatchedCount')}</span><strong>{model.matchedIds.length}</strong></div>
        <small>{t('invertedTokenizerNote')}</small>
      </div>

      <div className="inverted-layout">
        <section className="file-panel inverted-records-panel" aria-label={t('invertedRecordsLabel')}>
          <header>
            <h4>{t('invertedRecordsLabel')}</h4>
            <span>{t('invertedRecordsHint')}</span>
          </header>
          <div className="inverted-record-list" data-testid="inverted-records">
            {model.records.map((record) => (
              <article
                className={`inverted-record is-${record.state}`}
                key={record.id}
                data-testid="inverted-record"
                data-record-id={record.id}
              >
                <b>{record.id}</b>
                <div className="inverted-keywords">
                  {record.keywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="file-panel inverted-index-panel" aria-label={t('invertedIndexLabel')}>
          <header>
            <h4>{t('invertedIndexLabel')}</h4>
            <span>{t('invertedIndexHint')}</span>
          </header>
          <div className="inverted-term-list" data-testid="inverted-index">
            {model.entries.map((entry) => (
              <article
                className={`inverted-term${entry.active ? ' is-active' : ''}`}
                key={entry.term}
                data-testid="inverted-term"
                data-term={entry.term}
              >
                <b>{entry.term}</b>
                <span className="inverted-arrow">→</span>
                <div className="inverted-postings">
                  {entry.postings.length ? entry.postings.map((recordId) => (
                    <span
                      key={recordId}
                      className={entry.currentPostingIds.includes(recordId) ? 'is-current' : ''}
                    >
                      {recordId}
                    </span>
                  )) : <em>{t('invertedEmptyPosting')}</em>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="file-panel inverted-query-panel" aria-label={t('invertedQueryLabel')}>
        <header>
          <h4>{t('invertedQueryLabel')}</h4>
          <span>{model.mode === 'and' ? t('invertedAndHint') : t('invertedOrHint')}</span>
        </header>
        <div className="inverted-query-flow" data-testid="inverted-query">
          <div className="inverted-query-terms">
            {model.queryTerms.map((term) => (
              <span
                key={term}
                className={`${term === model.currentTerm ? 'is-current' : ''}${model.entries.some((entry) => entry.term === term) ? '' : ' is-missing'}`}
              >
                {term}
              </span>
            ))}
          </div>
          <div className="inverted-set-op">{model.mode === 'and' ? '∩' : '∪'}</div>
          <div className="inverted-match-box">
            <span>{t('invertedResultLabel')}</span>
            <strong>{model.matchedIds.length}</strong>
            <div>
              {model.matchedIds.length ? model.matchedIds.map((id) => (
                <span key={id} className="is-matched">{id}</span>
              )) : <em>{t('invertedNoMatch')}</em>}
            </div>
          </div>
        </div>
        {model.operation === 'done' ? (
          <div
            className={`file-result ${model.result === 'empty' ? 'is-miss' : 'is-found'}`}
            data-testid="inverted-result"
            data-result={model.result ?? ''}
          >
            <b>{model.result === 'empty' ? t('invertedEmptyResult') : t('invertedMatchedResult')}</b>
            <span>{t('invertedResultDetail').replace('{count}', String(model.matchedIds.length))}</span>
            <small>{t('invertedTokenizerNote')}</small>
          </div>
        ) : null}
      </section>
    </div>
  );
}
