import type { ProblemFilter, PracticeController } from './usePracticeController';
import type { PracticeProblem } from '../../domain/problems/types';
import { useI18n } from '../../i18n/I18nProvider';

const FILTERS: Array<{ value: ProblemFilter; key: string }> = [
  { value: 'all', key: 'all' },
  { value: 'university', key: 'university' },
  { value: 'postgrad', key: 'postgrad' },
];

export function ProblemList({ controller }: { controller: PracticeController }) {
  const { t, pick } = useI18n();
  return (
    <section className="panel pad">
      <div className="sectionhead">
        <div>
          <div className="eyebrow">QUESTION BANK</div>
          <h2>{t('questionList')}</h2>
        </div>
        <select
          className="select"
          value={controller.filter}
          aria-label="Filter problems"
          onChange={(event) => controller.setFilter(event.target.value as ProblemFilter)}
        >
          {FILTERS.map(({ value, key }) => <option key={value} value={value}>{t(key)}</option>)}
        </select>
      </div>
      <p className="muted smalltext">{t('bankDisclaimer')}</p>
      <div className="problem-list">
        {controller.filteredProblems.map((problem: PracticeProblem) => (
          <button
            key={problem.id}
            className={`problem-card ${problem.id === controller.currentProblem.id ? 'active' : ''}`}
            onClick={() => controller.selectProblem(problem.id)}
            data-testid={`problem-${problem.id}`}
          >
            <span className={`tag ${problem.cat === 'postgrad' ? 'orange' : 'green'}`}>
              {controller.categoryLabel(problem.cat)}
            </span>
            <span className="tag">{problem.diff === 'easy' ? t('levelEasy') : t('levelMid')}</span>
            <div style={{ fontWeight: 750, fontSize: 15, marginTop: 9 }}>{pick(problem.name)}</div>
            <div className="muted smalltext">{pick(problem.desc).slice(0, 70)}</div>
            {controller.solved.has(problem.id) && (
              <div className="smalltext problem-solved">✓ {t('passed')}</div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
