import { useI18n } from '../i18n/I18nProvider';
import {
  glossaryForAlgorithm,
  glossaryForConcept,
  type TerminologyEntry,
} from '../i18n/terminology';
import '../styles/terminology.css';

/**
 * Visible Chinese terminology note.
 *
 * It is intentionally rendered as a short block rather than a hover tooltip:
 * phone and keyboard readers can discover the full English name and Chinese
 * meaning without hunting for a pointer. English mode shows nothing because the
 * surrounding lesson is already English.
 */
export function TermGlossary({
  algorithmId,
  conceptId,
}: {
  algorithmId?: string | null;
  conceptId?: string | null;
}) {
  const { t, lang } = useI18n();
  if (lang !== 'zh') return null;

  const entries: TerminologyEntry[] = algorithmId
    ? glossaryForAlgorithm(algorithmId)
    : glossaryForConcept(conceptId);

  if (entries.length === 0) return null;

  return (
    <aside
      className="term-glossary"
      data-testid="term-glossary"
      aria-label={t('terminologyTitle')}
      data-algorithm-id={algorithmId ?? undefined}
      data-concept-id={conceptId ?? undefined}
    >
      <div className="term-glossary-head">
        <span className="term-glossary-title">{t('terminologyTitle')}</span>
        <span className="term-glossary-hint">{t('terminologyHint')}</span>
      </div>
      <ul className="term-glossary-list">
        {entries.map((entry) => (
          <li key={entry.id} data-term-id={entry.id}>
            <span className="term-glossary-label">{entry.labelZh}</span>
            {entry.noteZh ? (
              <span className="term-glossary-note">{entry.noteZh}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
