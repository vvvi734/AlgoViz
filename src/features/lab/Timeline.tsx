import type { Playback } from './usePlayback';
import type { TraceFrame } from '../../domain/trace/types';
import { useI18n } from '../../i18n/I18nProvider';

export function Timeline({ frames, playback }: { frames: TraceFrame[]; playback: Playback }) {
  const { t } = useI18n();
  const last = Math.max(0, frames.length - 1);
  return (
    <>
      <div className="stage-foot">
        <span className="step-number" data-testid="step-number">
          {t('step')} {frames.length ? playback.index + 1 : 0}
        </span>
        <span className="muted" data-testid="step-desc">
          {frames[playback.index]?.message || t('ready')}
        </span>
      </div>
      <input
        className="scrub"
        type="range"
        min={0}
        max={last}
        value={playback.index}
        aria-label="Timeline"
        data-testid="scrub"
        onChange={(event) => playback.seek(Number(event.target.value))}
      />
      <div className="controls">
        <button className="btn small" onClick={playback.restart} title="Reset" aria-label="Reset">⟲</button>
        <button
          className="btn small"
          onClick={playback.prev}
          disabled={playback.index <= 0}
          title="Previous"
          aria-label="Previous"
          data-testid="prev-btn"
        >◀</button>
        <button
          className="btn primary"
          onClick={playback.toggle}
          disabled={frames.length <= 1}
          data-testid="play-btn"
        >
          {playback.playing ? t('pause') : t('play')}
        </button>
        <button
          className="btn small"
          onClick={playback.next}
          disabled={playback.index >= last}
          title="Next"
          aria-label="Next"
          data-testid="next-btn"
        >▶|</button>
        <span className="muted smalltext">{t('speed')}</span>
        <input
          className="speed"
          type="range"
          min={1}
          max={5}
          value={playback.speed}
          aria-label="Speed"
          onChange={(event) => playback.setSpeed(Number(event.target.value))}
        />
      </div>
      <div className="timeline">
        <span data-testid="progress">{playback.progress}</span>
        <span>{t('timelineHint')}</span>
      </div>
    </>
  );
}
