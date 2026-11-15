import { MAX_FRAMES, MESSAGE_LIMIT, type TraceFrame, type TraceState } from './types';

/**
 * The collector used by the legacy JS Worker. Kept as a pure module so both
 * the Worker and the regression tests exercise exactly the same semantics.
 */
export function createTraceCollector(): {
  frames: TraceFrame[];
  trace: (state: TraceState, message?: string) => void;
} {
  const frames: TraceFrame[] = [];
  const trace = (state: TraceState, message = ''): void => {
    if (frames.length >= MAX_FRAMES) throw new Error('Too many trace steps (limit: 500)');
    const snapshot = JSON.parse(JSON.stringify(state)) as TraceState;
    frames.push({ state: snapshot, message: String(message).slice(0, MESSAGE_LIMIT) });
  };
  return { frames, trace };
}
