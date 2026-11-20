import { useI18n } from '../../i18n/I18nProvider';
import type { KmpOperation } from '../../domain/trace/kmpSchema';
import type { KmpCellModel, KmpVisualModel } from '../../domain/visualization/kmpModel';
import '../../styles/str01.css';

const OPERATION_KEYS: Record<KmpOperation, string> = {
  init: 'kmpOpInit',
  'build-start': 'kmpOpBuildStart',
  'build-compare': 'kmpOpBuildCompare',
  'build-fallback': 'kmpOpBuildFallback',
  'build-record': 'kmpOpBuildRecord',
  'build-complete': 'kmpOpBuildComplete',
  'search-start': 'kmpOpSearchStart',
  'search-compare': 'kmpOpSearchCompare',
  'search-advance': 'kmpOpSearchAdvance',
  'search-fallback': 'kmpOpSearchFallback',
  'search-miss': 'kmpOpSearchMiss',
  'match-found': 'kmpOpMatchFound',
  'search-done': 'kmpOpSearchDone',
};

const CELL_STEP = 40;

function pointerClass(tone: KmpCellModel['tone']): string {
  return tone === 'none' ? 'kmp-cell' : `kmp-cell is-${tone}`;
}

/**
 * Two-phase character view. Phase A exposes the lps derivation on the pattern;
 * phase B shows the same pattern sliding below the text with real i/j pointers.
 * No prose is embedded in the canvas: the rail owns the explanation.
 */
export function KmpVisual({ model }: { model: KmpVisualModel }) {
  const { t } = useI18n();
  const isBuild = model.phase === 'build';
  const boardWidth = Math.max(model.boardColumns * CELL_STEP - 6, 260);
  const currentMatch = model.currentMatchStart;
  const fallbackText =
    model.fallbackFrom !== null && model.fallbackTo !== null
      ? (isBuild ? t('kmpBuildFallbackBanner') : t('kmpSearchFallbackBanner'))
          .replace('{from}', String(model.fallbackFrom))
          .replace('{to}', String(model.fallbackTo))
          .replace('{i}', String(model.i ?? '—'))
      : null;

  return (
    <div
      className={`kmp-visual kmp-${model.phase}`}
      data-testid="kmp-visual"
      data-phase={model.phase}
      data-operation={model.operation}
      data-i={model.i ?? ''}
      data-j={model.j ?? ''}
      data-alignment={model.alignment}
      data-lps-ready={model.lpsReady}
      data-lps={model.lps.join(',')}
      data-match-count={model.matches.length}
      data-matches={model.matches.join(',')}
      data-fallback-from={model.fallbackFrom ?? ''}
      data-fallback-to={model.fallbackTo ?? ''}
      role="group"
      aria-label={t('kmpVisualLabel')}
    >
      <div className="kmp-op-row">
        <span className="kmp-op" data-testid="kmp-operation">
          {t(OPERATION_KEYS[model.operation])}
        </span>
        <span className="kmp-phase-chip" data-testid="kmp-phase">
          {t(isBuild ? 'kmpPhaseBuild' : 'kmpPhaseSearch')}
        </span>
        {model.matched !== null && model.operation !== 'build-record' && (
          <span className={`kmp-result-chip ${model.matched ? 'is-match' : 'is-mismatch'}`}>
            {t(model.matched ? 'kmpMatched' : 'kmpMismatched')}
          </span>
        )}
        <span className="kmp-live-pointer" data-testid="kmp-i">
          i = {model.i ?? '—'}
        </span>
        <span className="kmp-live-pointer" data-testid="kmp-j">
          j = {model.j ?? '—'}
        </span>
      </div>

      <div className="kmp-board-scroll">
        <div className="kmp-board" style={{ width: `${boardWidth}px` }}>
          {isBuild ? (
            <>
              <div className="kmp-track-head">
                <span className="kmp-track-name">{t('kmpPattern')}</span>
                <span className="kmp-track-meta">
                  m = {model.pattern.length} · lps {model.lpsReady}/{model.pattern.length}
                </span>
              </div>
              <div
                className="kmp-cell-row kmp-pattern-row"
                style={{ gridTemplateColumns: `repeat(${Math.max(model.pattern.length, 1)}, 34px)` }}
              >
                {model.patternCells.map((cell) => (
                  <KmpCell
                    key={`p-${cell.index}`}
                    cell={cell}
                    pointerI={cell.index === model.i}
                    pointerJ={cell.index === model.j}
                    testPrefix="kmp-pattern-cell"
                  />
                ))}
              </div>

              <div className="kmp-lps-head">
                <span className="kmp-track-name">{t('kmpLps')}</span>
                <span className="kmp-track-meta">{t('kmpLpsConvention')}</span>
              </div>
              <div
                className="kmp-lps-row"
                style={{ gridTemplateColumns: `repeat(${Math.max(model.pattern.length, 1)}, 34px)` }}
              >
                {model.lpsCells.map((cell) => (
                  <div
                    key={`l-${cell.index}`}
                    className={`kmp-lps-cell${cell.current ? ' is-current' : ''}${cell.value === null ? ' is-pending' : ''}`}
                    data-testid="kmp-lps-cell"
                    data-index={cell.index}
                    data-value={cell.value ?? ''}
                  >
                    <span className="kmp-lps-value">{cell.value ?? '—'}</span>
                    <span className="kmp-lps-index">lps[{cell.index}]</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="kmp-track-head">
                <span className="kmp-track-name">{t('kmpText')}</span>
                <span className="kmp-track-meta">n = {model.text.length}</span>
              </div>
              <div
                className="kmp-cell-row kmp-text-row"
                style={{ gridTemplateColumns: `repeat(${Math.max(model.textCells.length, 1)}, 34px)` }}
              >
                {model.textCells.map((cell) => (
                  <KmpCell
                    key={`t-${cell.index}`}
                    cell={cell}
                    pointerI={cell.index === model.i}
                    pointerJ={false}
                    testPrefix="kmp-text-cell"
                  />
                ))}
              </div>

              <div
                className="kmp-track-head kmp-pattern-head"
                style={{ marginLeft: `${model.alignment * CELL_STEP}px` }}
              >
                <span className="kmp-track-name">{t('kmpPattern')}</span>
                <span className="kmp-track-meta">
                  {t('kmpAlignedAt').replace('{start}', String(model.alignment))}
                </span>
              </div>
              <div
                className="kmp-cell-row kmp-pattern-row kmp-slide-row"
                style={{
                  marginLeft: `${model.alignment * CELL_STEP}px`,
                  gridTemplateColumns: `repeat(${Math.max(model.pattern.length, 1)}, 34px)`,
                }}
              >
                {model.patternCells.map((cell) => (
                  <KmpCell
                    key={`sp-${cell.index}`}
                    cell={cell}
                    pointerI={false}
                    pointerJ={cell.index === model.j}
                    testPrefix="kmp-search-pattern-cell"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {fallbackText && (
        <p className="kmp-fallback-banner" data-testid="kmp-fallback">
          {fallbackText}
          {!isBuild && <span className="kmp-no-backtrack">{t('kmpNoBacktrack')}</span>}
        </p>
      )}

      {model.operation === 'match-found' && currentMatch !== null && (
        <p className="kmp-match-banner" data-testid="kmp-match-banner">
          {t('kmpMatchAt').replace('{start}', String(currentMatch))}
        </p>
      )}

      {isBuild ? (
        <p className="kmp-foot-note">
          {t('kmpBuildNote')}
        </p>
      ) : (
        <div className="kmp-matches" data-testid="kmp-matches">
          <span className="kmp-matches-label">{t('kmpMatchStarts')}</span>
          {model.matches.length === 0 ? (
            <span className="kmp-match-empty">{t('kmpNoMatches')}</span>
          ) : (
            model.matches.map((start) => (
              <span
                key={start}
                className={`kmp-match-chip${start === currentMatch ? ' is-current' : ''}`}
                data-testid="kmp-match-chip"
                data-start={start}
              >
                s = {start}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function KmpCell({
  cell,
  pointerI,
  pointerJ,
  testPrefix,
}: {
  cell: KmpCellModel;
  pointerI: boolean;
  pointerJ: boolean;
  testPrefix: string;
}) {
  return (
    <div
      className={pointerClass(cell.tone)}
      data-testid={testPrefix}
      data-index={cell.index}
      data-char={cell.char}
      data-tone={cell.tone}
      title={`${cell.index}: ${cell.char}`}
    >
      <span className="kmp-pointer-slot">
        {pointerI && <span className="kmp-pointer kmp-pointer-i">i</span>}
        {pointerJ && <span className="kmp-pointer kmp-pointer-j">j</span>}
      </span>
      <span className="kmp-char">{cell.char}</span>
      <span className="kmp-index">{cell.index}</span>
    </div>
  );
}
