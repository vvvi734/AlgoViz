import { resolveScope } from './SyncPanel';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

const VISIBLE_LIMIT = 4;

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  } catch {
    return String(value);
  }
}

/** Names that occur as identifiers in the current operation copy. */
function relatedNames(text: string, names: readonly string[]): Set<string> {
  const found = new Set<string>();
  for (const name of names) {
    if (!name) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`);
    if (pattern.test(text)) found.add(name);
  }
  return found;
}

/**
 * Compact variables watch for the learning rail. It reads the same
 * `resolveScope` result as the advanced panel used to read, so playback, rewind
 * and frame jumps cannot create a second variable source of truth.
 */
export function VariableWatch({
  event,
  selectedFrameId,
  relatedText = '',
}: {
  event: TraceEvent | undefined;
  selectedFrameId: string | null;
  relatedText?: string;
}) {
  const { t } = useI18n();
  const { rows = [], scopeLabel } = resolveScope(event, selectedFrameId);
  const ordered = [...rows];
  if (relatedText && ordered.length > 0) {
    const related = relatedNames(relatedText, ordered.map((row) => row.name));
    ordered.sort((a, b) => Number(related.has(b.name)) - Number(related.has(a.name)));
  }
  const visible = ordered.slice(0, VISIBLE_LIMIT);
  const rest = ordered.slice(VISIBLE_LIMIT);

  return (
    <div className="key-vars" data-testid="key-vars">
      {scopeLabel ? (
        <div className="key-vars-scope" data-testid="variables-scope">
          {scopeLabel}
        </div>
      ) : null}
      {visible.length === 0 ? (
        <div className="key-vars-empty" data-testid="variables-empty">{t('noVariables')}</div>
      ) : (
        <>
          <table className="vartable key-vars-table" data-testid="variables-watch">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('value')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((variable, index) => (
                <tr key={`${variable.name}-${index}`}>
                  <td className="varname">{variable.name}</td>
                  <td className="varvalue">{formatValue(variable.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rest.length > 0 ? (
            <details className="key-vars-more">
              <summary>{t('moreVariables').replace('{count}', String(rest.length))}</summary>
              <table className="vartable key-vars-table">
                <tbody>
                  {rest.map((variable, index) => (
                    <tr key={`${variable.name}-more-${index}`}>
                      <td className="varname">{variable.name}</td>
                      <td className="varvalue">{formatValue(variable.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
