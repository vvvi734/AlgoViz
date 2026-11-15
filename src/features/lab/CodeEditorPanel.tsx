import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS, type CodeLanguage } from '../../domain/algorithms/types';
import type { StatusMessage } from './useLabController';
import { Feedback } from '../../components/Feedback';
import { useI18n } from '../../i18n/I18nProvider';

export function CodeEditorPanel({
  codeLang,
  engineText,
  code,
  inputJson,
  status,
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
  onCodeLangChange: (lang: CodeLanguage) => void;
  onCodeChange: (code: string) => void;
  onInputChange: (input: string) => void;
  onRun: () => void;
  onRestore: () => void;
  onRandom: () => void;
}) {
  const { t } = useI18n();
  return (
    <section className="panel pad">
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
          <button className="btn small" onClick={onRestore}>{t('restore')}</button>
          <button className="btn primary" onClick={onRun} data-testid="run-btn">{t('run')}</button>
        </div>
      </div>
      <div className="engine-note" aria-live="polite">{engineText}</div>
      {/* Plain textarea in Phase 1. Highlighting, line numbers, diagnostics and
          save are Issue 06; this surface already uses the code colour tokens. */}
      <textarea
        className="codearea"
        spellCheck={false}
        aria-label="Algorithm code editor"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        data-testid="code-editor"
      />
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
