import { useId, useRef, useState } from 'react';
import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS } from '../../domain/algorithms/types';
import { useI18n } from '../../i18n/I18nProvider';
import type { ResolvedTheme } from '../../theme/resolve';
import { CodeEditorPanel } from './CodeEditorPanel';
import type { LabController } from './useLabController';

/**
 * UI-03: the code editor is a bottom dock spanning the whole learning area.
 *
 * The panel is collapsed by default and only changes presentation. The Monaco
 * instance stays mounted while collapsed, so expanding again preserves the
 * draft, undo history, cursor and scroll position. Playback, trace selection and
 * Python execution remain owned by LabController.
 */
export function CodeDock({
  lab,
  highlightLine,
  noLocationHint,
  theme,
}: {
  lab: LabController;
  highlightLine: number | null;
  noLocationHint: boolean;
  theme: ResolvedTheme;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const language = CODE_LANGUAGE_LABELS[lab.codeLang];
  const status = lab.status.text || t('codeDockReady');

  const toggle = () => {
    setExpanded((value) => !value);
    // Monaco's automaticLayout observes its host; this also covers browsers
    // that coalesce the size change with the transition's first frame.
    window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };

  return (
    <section
      className={`panel code-dock${expanded ? ' is-expanded' : ''}`}
      data-testid="code-dock"
      data-expanded={expanded}
      aria-labelledby={`${bodyId}-title`}
    >
      <header className="code-dock-head">
        <div className="code-dock-heading">
          <div className="eyebrow">{t('codeDockKicker')}</div>
          <div className="code-dock-title-row">
            <h2 id={`${bodyId}-title`} data-testid="code-dock-title">
              {language} {t('codeDockTitle')}
            </h2>
            <select
              id="code-lang"
              className="select code-dock-lang"
              value={lab.codeLang}
              aria-label={t('programLang')}
              onChange={(event) => lab.setCodeLang(event.target.value as typeof lab.codeLang)}
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{CODE_LANGUAGE_LABELS[lang]}</option>
              ))}
            </select>
          </div>
          <span className="code-dock-hint">{t('codeDockHint')}</span>
        </div>
        <div className="code-dock-actions">
          <span
            className={`code-dock-status${lab.status.error ? ' is-error' : ''}`}
            data-testid="code-dock-status"
            aria-live="polite"
          >
            {status}
          </span>
          <button className="btn primary code-dock-run" type="button" onClick={lab.runVisualization} data-testid="run-btn">
            {t('run')}
          </button>
          <button
            ref={toggleRef}
            className="btn code-dock-toggle"
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            data-testid="code-dock-toggle"
            onClick={toggle}
          >
            <span>{expanded ? t('collapseCode') : t('expandCode')}</span>
            <span className="code-dock-chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
          </button>
        </div>
      </header>
      <div
        id={bodyId}
        className="code-dock-body"
        data-testid="code-dock-body"
        aria-hidden={!expanded}
        inert={!expanded}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && expanded) {
            event.stopPropagation();
            setExpanded(false);
            toggleRef.current?.focus();
          }
        }}
      >
        <CodeEditorPanel
          codeLang={lab.codeLang}
          engineText={lab.engineText}
          code={lab.editorCode}
          inputJson={lab.inputJson}
          status={lab.status}
          highlightLine={highlightLine}
          noLocationHint={noLocationHint}
          diagnostics={lab.diagnostics}
          draftStatus={lab.draftStatus}
          theme={theme}
          embedded
          showRun={false}
          onCodeLangChange={lab.setCodeLang}
          onCodeChange={lab.editCode}
          onInputChange={lab.setInputJson}
          onRun={lab.runVisualization}
          onRestore={lab.restorePreset}
          onRandom={lab.randomizeInput}
        />
      </div>
    </section>
  );
}
