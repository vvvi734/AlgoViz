import type { CallFrame, TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Stage-3 recursion call-stack panel. It renders the call stack snapshot that a
 * trace event carries, so the call / return lifecycle, per-depth locals and the
 * current active frame are all driven by the SAME `event` as the timeline,
 * Monaco highlight and the variables watch — never a second source of truth.
 *
 * Frames are drawn with the newest (deepest) call on top; the top frame is the
 * active one and is highlighted. Clicking any frame selects it, which makes the
 * variables watch (SyncPanel) show that frame's scope.
 */
export function CallStackPanel({
  event,
  selectedFrameId,
  onSelectFrame,
}: {
  event: TraceEvent | undefined;
  selectedFrameId: string | null;
  onSelectFrame: (frameId: string | null) => void;
}) {
  const { t } = useI18n();
  const stack = event?.callStack;

  if (!stack || stack.length === 0) {
    return (
      <section className="panel pad" data-testid="call-stack-panel">
        <div className="sectionhead"><h2>{t('callStack')}</h2><span>▥</span></div>
        <div className="empty smalltext" data-testid="call-stack-empty">{t('noCallStack')}</div>
      </section>
    );
  }

  // Newest (deepest) frame first; the first rendered frame is the active one.
  const ordered = [...stack].reverse();
  const activeFrameId = ordered[0]?.frameId;

  return (
    <section className="panel pad" data-testid="call-stack-panel">
      <div className="sectionhead">
        <h2>{t('callStack')}</h2>
        <span className="tag green">{t('depth')} {stack.length}</span>
      </div>
      <ol className="callstack" data-testid="call-stack">
        {ordered.map((frame) => (
          <CallFrameRow
            key={frame.frameId ?? `${frame.name}-${frame.depth ?? 0}`}
            frame={frame}
            active={frame.frameId === activeFrameId}
            selected={frame.frameId != null && frame.frameId === selectedFrameId}
            onClick={() =>
              onSelectFrame(frame.frameId === selectedFrameId ? null : (frame.frameId ?? null))
            }
          />
        ))}
      </ol>
      <p className="muted smalltext callstack-hint">{t('frameSelectHint')}</p>
    </section>
  );
}

function CallFrameRow({
  frame,
  active,
  selected,
  onClick,
}: {
  frame: CallFrame;
  active: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const returning = frame.status === 'returning';
  return (
    <li
      className={`callframe${active ? ' active' : ''}${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      data-testid={`call-frame-${frame.frameId ?? frame.name}`}
    >
      <div className="callframe-head">
        <span className="callframe-depth">{frame.depth ?? 0}</span>
        <span className="callframe-name">{frame.name}</span>
        {frame.status && frame.status !== 'running' && (
          <span className={`tag ${returning ? 'orange' : ''}`}>{t('returning')}</span>
        )}
        {active && <span className="tag green">{t('activeFrame')}</span>}
        {frame.returnValue !== undefined && (
          <span className="callframe-return">{t('returnValue')}: {formatValue(frame.returnValue)}</span>
        )}
      </div>
      {!!frame.arguments?.length && (
        <div className="callframe-line muted" data-testid={`call-frame-args-${frame.frameId ?? frame.name}`}>
          {t('args')}: {frame.arguments.map((a) => `${a.name} = ${formatValue(a.value)}`).join(', ')}
        </div>
      )}
      {!!frame.locals?.length && (
        <div className="callframe-line" data-testid={`call-frame-locals-${frame.frameId ?? frame.name}`}>
          {frame.locals.map((v) => `${v.name} = ${formatValue(v.value)}`).join(' · ')}
        </div>
      )}
    </li>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  } catch {
    return String(value);
  }
}
