import { logWindow } from '../../domain/visualization/model';
import type { AlgorithmEntry } from '../../domain/algorithms/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

export function ConceptPanel({
  entry,
  events,
  index,
  onSeek,
}: {
  entry: AlgorithmEntry | undefined;
  events: TraceEvent[];
  index: number;
  onSeek: (index: number) => void;
}) {
  const { t, pick } = useI18n();
  return (
    <section className="panel pad">
      <div className="sectionhead"><h2>{t('concept')}</h2><span>✧</span></div>
      <div className="info">
        <h3>{entry ? pick(entry.name) : '—'}</h3>
        <p>{entry ? pick(entry.desc) : ''}</p>
      </div>
      <div className="statgrid">
        <div className="stat"><b>{entry?.time ?? '—'}</b><span>{t('timeCost')}</span></div>
        <div className="stat"><b>{entry?.space ?? '—'}</b><span>{t('spaceCost')}</span></div>
      </div>
      <h3 className="smalltext muted">{t('stepLog')}</h3>
      <ol className="steps">
        {logWindow(events, index).map(({ item, index: absolute, current }) => (
          <li key={absolute} className={current ? 'current' : ''} onClick={() => onSeek(absolute)}>
            {item.message || `Step ${absolute + 1}`}
          </li>
        ))}
      </ol>
    </section>
  );
}
