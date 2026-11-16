import type { CallFrame, TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Stage-1 synchronous observation panel, upgraded in Stage 3 to be scope-aware.
 * All regions are driven by the SAME `event` (and its `source` snapshot) so
 * they can never drift apart when the timeline plays, pauses, rewinds or scrubs.
 *
 *  A) Code position — highlights the line recorded in `event.sourceLocation`.
 *  B) Variables watch — for recursion traces this shows the selected call
 *     frame's locals (or the active frame when none is selected); for legacy
 *     traces it falls back to the flat `event.variables`.
 *  C) Step explanation — the trace message for this step.
 */

interface ResolvedVariables {
  rows: TraceEvent['variables'];
  scopeLabel: string | null;
  frameId: string | null;
}

/** Pure resolution of which variable scope to display for the current event. */
export function resolveScope(
  event: TraceEvent | undefined,
  selectedFrameId: string | null,
): ResolvedVariables {
  const stack = event?.callStack;
  if (!stack || stack.length === 0) {
    // Legacy (Stage-1) path: no call stack, show the flat variables unchanged.
    return { rows: event?.variables ?? [], scopeLabel: null, frameId: null };
  }
  const active = stack[stack.length - 1];
  const selected = selectedFrameId != null
    ? stack.find((frame) => frame.frameId === selectedFrameId)
    : undefined;
  const frame: CallFrame | undefined = selected ?? active;
  const rows = frame?.locals ?? event?.variables ?? [];
  return {
    rows,
    scopeLabel: frame
      ? `${frame.name}${frame.depth != null ? ` · 深度 ${frame.depth}` : ''}`
      : 'global',
    frameId: frame?.frameId ?? null,
  };
}

export function SyncPanel({
  event,
  source,
  stale,
  selectedFrameId,
}: {
  event: TraceEvent | undefined;
  source: string;
  stale: boolean;
  selectedFrameId: string | null;
}) {
  const { t } = useI18n();

  const lines = source ? source.split('\n') : [];
  const activeLine = event?.sourceLocation?.line ?? null;
  const { rows, scopeLabel, frameId } = resolveScope(event, selectedFrameId);

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
          {scopeLabel && (
            <div className="scope-label" data-testid="variables-scope">
              {t('scope')}: {scopeLabel}
            </div>
          )}
          {!rows?.length ? (
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
                {rows.map((variable, index) => (
                  <tr key={`${frameId ?? 'global'}-${variable.name}-${index}`}>
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
