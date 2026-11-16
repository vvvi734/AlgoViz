import { useEffect, useRef, useState } from 'react';
import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS, type CodeLanguage } from '../../domain/algorithms/types';
import type { DraftStatus, StatusMessage } from './useLabController';
import type { ExecutionDiagnostic } from '../../domain/trace/diagnostic';
import type { ResolvedTheme } from '../../theme/resolve';
import { Feedback } from '../../components/Feedback';
import { MonacoEditor } from './MonacoEditor';
import { useI18n } from '../../i18n/I18nProvider';

export function CodeEditorPanel({
  codeLang,
  engineText,
  code,
  inputJson,
  status,
  highlightLine,
  noLocationHint,
  diagnostics,
  draftStatus,
  theme,
  onCodeLangChange,
  onCodeChange,
  onInputChange,
  onRun,
  onRestore,
  onRandom,
}: {
  codeLang: CodeLanguage;
  engineText: string;
  code: string;
  inputJson: string;
  status: StatusMessage;
  highlightLine: number | null;
  noLocationHint: boolean;
  diagnostics: ExecutionDiagnostic[];
  draftStatus: DraftStatus;
  theme: ResolvedTheme;
  onCodeLangChange: (lang: CodeLanguage) => void;
  onCodeChange: (code: string) => void;
  onInputChange: (input: string) => void;
  onRun: () => void;
  onRestore: () => void;
  onRandom: () => void;
}) {
  const { t } = useI18n();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  // Two-step restore: first click arms it, second click within 3s confirms.
  const handleRestore = () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      if (confirmTimer.current != null) window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => setConfirmRestore(false), 3000);
      return;
    }
    if (confirmTimer.current != null) window.clearTimeout(confirmTimer.current);
    setConfirmRestore(false);
    onRestore();
  };

  useEffect(() => () => {
    if (confirmTimer.current != null) window.clearTimeout(confirmTimer.current);
  }, []);

  return (
    <section className="panel pad code-editor-panel">
      <div className="sectionhead">
        <div className="language-row">
          <h2>{t('codeEditor')}</h2>
          <label htmlFor="code-lang">{t('programLang')}</label>
          <select
            id="code-lang"
            className="select"
            value={codeLang}
            aria-label="Programming language"
            onChange={(event) => onCodeLangChange(event.target.value as CodeLanguage)}
          >
            {CODE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{CODE_LANGUAGE_LABELS[lang]}</option>
            ))}
          </select>
        </div>
        <div className="controls">
          <button className={`btn small${confirmRestore ? ' danger' : ''}`} onClick={handleRestore} data-testid="restore-btn">
            {confirmRestore ? t('confirmRestore') : t('restore')}
          </button>
          <button className="btn primary" onClick={onRun} data-testid="run-btn">{t('run')}</button>
        </div>
      </div>
      <div className="engine-note" aria-live="polite">
        <span>{engineText}</span>
        <SaveIndicator status={draftStatus} />
      </div>
      <MonacoEditor
        value={code}
        language={codeLang}
        theme={theme}
        highlightLine={highlightLine}
        diagnostics={diagnostics}
        onChange={onCodeChange}
      />
      {noLocationHint && (
        <div className="note muted" data-testid="editor-no-location">{t('noEditorLocation')}</div>
      )}
      <div className="inputline">
        <label htmlFor="run-input">{t('input')}</label>
        <input id="run-input" value={inputJson} onChange={(event) => onInputChange(event.target.value)} />
        <button className="btn small" onClick={onRandom}>{t('random')}</button>
      </div>
      <div className="note">{t('traceNote')}</div>
      <Feedback status={status} variant="status" testId="run-feedback" />
    </section>
  );
}

function SaveIndicator({ status }: { status: DraftStatus }) {
  const { t } = useI18n();
  const label = status === 'dirty'
    ? t('saveDirty')
    : status === 'saving'
      ? t('saveSaving')
      : status === 'error'
        ? t('saveError')
        : t('saveSaved');
  return (
    <span className={`save-indicator save-${status}`} data-testid="save-indicator">{label}</span>
  );
}
