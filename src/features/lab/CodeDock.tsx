import { useId } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { isGuidedInputAlgorithm } from '../../domain/algorithms/guidedInput';
import { GuidedInputPanel } from './GuidedInputPanel';
import { AutoGrowTextarea } from './AutoGrowTextarea';
import type { LabController } from './useLabController';

/**
 * UI-03 / global-scroll pass: a compact run bar below the learning workspace.
 *
 * The source example is intentionally not rendered here. The dock keeps one
 * visible action row for the default example, the JSON input, random data and
 * Run, so expanding the reference code can never hide the way to run it.
 */
export function CodeDock({ lab }: { lab: LabController }) {
  const { t } = useI18n();
  const titleId = useId();
  const guided = isGuidedInputAlgorithm(lab.currentAlgo);
  const status = lab.status.text || t('codeDockReady');

  return (
    <section
      className="panel code-dock is-compact is-expanded"
      data-testid="code-dock"
      data-expanded="true"
      aria-labelledby={titleId}
    >
      <header className="code-dock-head">
        <div className="code-dock-heading">
          <div className="eyebrow">{t('codeDockKicker')}</div>
          <div className="code-dock-title-row">
            <h2 id={titleId} data-testid="code-dock-title">{t('codeDockTitle')}</h2>
          </div>
          <span className="code-dock-hint">{t('codeDockHint')}</span>
        </div>
        <div className="code-dock-actions">
          {!guided ? (
            <>
              <button className="btn small" type="button" onClick={lab.restorePreset} data-testid="restore-btn">
                {t('restore')}
              </button>
              <button className="btn primary code-dock-run" type="button" onClick={lab.runVisualization} data-testid="run-btn">
                {t('run')}
              </button>
            </>
          ) : null}
        </div>
      </header>
      <div className="code-dock-body is-compact" data-testid="code-dock-body">
        {guided ? (
          <GuidedInputPanel lab={lab} />
        ) : (
          <>
            <div className="code-dock-input-row">
              <label className="code-dock-input-label" htmlFor="run-input">{t('input')}</label>
              <AutoGrowTextarea
                id="run-input"
                data-testid="run-input"
                value={lab.inputJson}
                onChange={(event) => lab.setInputJson(event.target.value)}
                minRows={1}
                maxRows={8}
              />
              <button className="btn small code-dock-random" type="button" onClick={lab.randomizeInput} data-testid="random-btn">
                {t('random')}
              </button>
            </div>
            <div
              className={`code-dock-feedback note${lab.status.error ? ' error' : ' muted'}`}
              data-testid="run-feedback"
            >
              {status}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
