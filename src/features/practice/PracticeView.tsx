import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS, type CodeLanguage } from '../../domain/algorithms/types';
import { ProblemList } from './ProblemList';
import type { PracticeController } from './usePracticeController';
import { Feedback } from '../../components/Feedback';
import { useI18n } from '../../i18n/I18nProvider';

export function PracticeView({ controller, apiUrl }: { controller: PracticeController; apiUrl: string }) {
  const { t, pick } = useI18n();
  const isSolved = controller.solved.has(controller.currentProblem.id);
  return (
    <div className="practice" data-testid="practice-view">
      <ProblemList controller={controller} />
      <section className="panel pad">
        <div className="sectionhead">
          <h2>{pick(controller.currentProblem.name)}</h2>
          <span className="tag">
            {controller.currentProblem.diff === 'easy' ? t('levelEasy') : t('levelMid')}
          </span>
        </div>
        <p className="muted">{pick(controller.currentProblem.desc)}</p>
        <div className="language-row">
          <h3 className="smalltext">{t('scaffold')}</h3>
          <label htmlFor="practice-lang">{t('programLang')}</label>
          <select
            id="practice-lang"
            className="select"
            value={controller.practiceLang}
            aria-label="Practice programming language"
            onChange={(event) => controller.setPracticeLang(event.target.value as CodeLanguage)}
          >
            {CODE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{CODE_LANGUAGE_LABELS[lang]}</option>
            ))}
          </select>
        </div>
        <div className="engine-note" aria-live="polite">{controller.engineText}</div>
        <textarea
          className="codearea"
          spellCheck={false}
          style={{ minHeight: 300 }}
          aria-label="Practice code editor"
          value={controller.practiceCode}
          onChange={(event) => controller.setPracticeCode(event.target.value)}
        />
        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={() => void controller.runSamples()} data-testid="run-samples">{t('runSamples')}</button>
          <button className="btn" onClick={controller.showHint}>{t('hint')}</button>
          <button className="btn" onClick={() => void controller.reviewCode(apiUrl)}>{t('review')}</button>
          <button className="btn ghost" onClick={controller.resetScaffold}>{t('resetScaffold')}</button>
          <button className="btn" onClick={controller.toggleSolved} data-testid="toggle-solved">
            {isSolved ? t('unmarkDone') : t('markDone')}
          </button>
        </div>
        <Feedback status={controller.status} />
      </section>
    </div>
  );
}
