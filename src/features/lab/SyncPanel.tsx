import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Stage-1 synchronous observation panel. All three regions are driven by the
 * SAME `event` (and its `source` snapshot) so they can never drift apart when
 * the timeline plays, pauses, rewinds or scrubs.
 *
 *  A) Code position — a lightweight read-only view (no Monaco yet) that
 *     highlights the line recorded in `event.sourceLocation`.
 *  B) Data structure — rendered by the existing VisualStage (not here).
 *  C) Variables watch — the real runtime variables captured at this step.
 *  D) Step explanation — the trace message for this step.
 */
export function SyncPanel({
  event,
  source,
  stale,
}: {
  event: TraceEvent | undefined;
  source: string;
  stale: boolean;
}) {
  const { t } = useI18n();

  const lines = source ? source.split('\n') : [];
  const activeLine = event?.sourceLocation?.line ?? null;

  return (
    <section className="panel pad" data-testid="sync-panel">
      <div className="sectionhead">
        <h2>{t('syncPanel')}</h2>
        <span className={`tag ${stale ? 'orange' : 'green'}`}>{stale ? 'STALE' : 'SYNCED'}</span>
      </div>

      {stale && <p className="muted smalltext sync-warn" data-testid="sync-stale">{t('codeChanged')}</p>}

      <div className="sync-grid">
        <div className="sync-col">
          <h3 className="smalltext muted">{t('codePosition')}</h3>
          {lines.length === 0 ? (
            <div className="empty smalltext" data-testid="code-position-empty">{t('noCode')}</div>
          ) : (
            <pre className="codeview" data-testid="code-position" aria-label="Source code position">
              {lines.map((text, i) => (
                <div key={i} className={`codeline ${activeLine === i + 1 ? 'active' : ''}`}>
                  <span className="lineno">{i + 1}</span>
                  <span className="codetext">{text || ' '}</span>
                </div>
              ))}
            </pre>
          )}
          {activeLine == null && lines.length > 0 && (
            <div className="muted smalltext" data-testid="no-location">{t('noLocation')}</div>
          )}
        </div>

        <div className="sync-col">
          <h3 className="smalltext muted">{t('variablesWatch')}</h3>
          {!event?.variables?.length ? (
            <div className="empty smalltext" data-testid="variables-empty">{t('noVariables')}</div>
          ) : (
            <table className="vartable" data-testid="variables-watch">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('type')}</th>
                  <th>{t('value')}</th>
                </tr>
              </thead>
              <tbody>
                {event.variables.map((variable) => (
                  <tr key={variable.name}>
                    <td className="varname">{variable.name}</td>
                    <td className="vartype">{variable.type}</td>
                    <td className="varvalue">{formatValue(variable.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="sync-explanation">
        <h3 className="smalltext muted">{t('stepExplanation')}</h3>
        <p data-testid="step-explanation">{event?.message || t('noMessage')}</p>
      </div>
    </section>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    return String(value);
  }
}
