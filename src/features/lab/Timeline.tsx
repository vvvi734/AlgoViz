import { useRef } from 'react';
import type { Playback } from './usePlayback';
import type { TraceEvent } from '../../domain/trace/schema';
import { localizeTraceMessage } from '../../domain/lessons/localizeMessage';
import { useI18n } from '../../i18n/I18nProvider';

export function Timeline({ events, playback }: { events: TraceEvent[]; playback: Playback }) {
  const { t, lang } = useI18n();
  const last = Math.max(0, events.length - 1);
  const message = localizeTraceMessage(events[playback.index]?.message ?? '', lang);
  // Keep the range's React value tracker in sync with the controlled index.
  // After a new trace resets the DOM value programmatically, React's tracker can
  // still hold the previous frame; a later drag back to that same number would
  // then be ignored by onChange. onInput bypasses that stale comparison, and the
  // ref keeps both events from seeking twice.
  const lastScrubValue = useRef(playback.index);
  lastScrubValue.current = playback.index;
  const seekFromScrub = (event: { currentTarget: HTMLInputElement }) => {
    const value = Number(event.currentTarget.value);
    if (value === lastScrubValue.current) return;
    lastScrubValue.current = value;
    playback.seek(value);
  };
  return (
    <div className="stage-playback">
      <div className="stage-foot">
        <span className="step-number" data-testid="step-number">
          {t('step')} {events.length ? playback.index + 1 : 0}
        </span>
        <span className="muted" data-testid="step-desc">
          {message || t('ready')}
        </span>
      </div>
      <input
        className="scrub"
        type="range"
        min={0}
        max={last}
        value={playback.index}
        aria-label={t('timelineLabel')}
        data-testid="scrub"
        onChange={seekFromScrub}
        onInput={seekFromScrub}
      />
      <div className="controls">
        <button
          className="btn small"
          onClick={playback.restart}
          title={t('playerResetShortcut')}
          aria-label={t('playerResetShortcut')}
          aria-keyshortcuts="ArrowUp"
          data-testid="restart-btn"
        >⟲</button>
        <button
          className="btn small"
          onClick={playback.prev}
          disabled={playback.index <= 0}
          title={t('playerPreviousShortcut')}
          aria-label={t('playerPreviousShortcut')}
          aria-keyshortcuts="ArrowLeft"
          data-testid="prev-btn"
        >◀</button>
        <button
          className="btn primary"
          onClick={playback.toggle}
          disabled={events.length <= 1}
          title={playback.playing ? t('playerPauseShortcut') : t('playerPlayShortcut')}
          aria-label={playback.playing ? t('playerPauseShortcut') : t('playerPlayShortcut')}
          aria-keyshortcuts="Space"
          data-testid="play-btn"
        >
          {playback.playing ? t('pause') : t('play')}
        </button>
        <button
          className="btn small"
          onClick={playback.next}
          disabled={playback.index >= last}
          title={t('playerNextShortcut')}
          aria-label={t('playerNextShortcut')}
          aria-keyshortcuts="ArrowRight"
          data-testid="next-btn"
        >▶|</button>
        <span className="muted smalltext">{t('speed')}</span>
        <input
          className="speed"
          type="range"
          min={1}
          max={5}
          value={playback.speed}
          aria-label={t('playerSpeed')}
          data-testid="speed"
          onChange={(event) => playback.setSpeed(Number(event.target.value))}
        />
      </div>
      <div className="timeline">
        <span data-testid="progress">{playback.progress}</span>
        <span className="timeline-hint">{t('timelineHint')}</span>
      </div>
      <div
        className="keyboard-hint"
        role="group"
        aria-label={t('playerShortcutsLabel')}
        data-testid="keyboard-hint"
      >
        <span className="keyboard-hint-icon" aria-hidden="true">⌨</span>
        <span className="keyboard-hint-item"><kbd>←</kbd>{t('playerPrevious')}</span>
        <span className="keyboard-hint-item"><kbd>→</kbd>{t('playerNext')}</span>
        <span className="keyboard-hint-item"><kbd>↑</kbd>{t('playerShortcutReset')}</span>
        <span className="keyboard-hint-item"><kbd>↓</kbd>{t('playerShortcutLast')}</span>
        <span className="keyboard-hint-item"><kbd>Space</kbd>{t('playerShortcutPlayPause')}</span>
      </div>
    </div>
  );
}
