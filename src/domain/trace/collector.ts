import { MAX_FRAMES, MESSAGE_LIMIT, type RawTraceFrame, type TraceState } from './types';

/**
 * The collector used by the legacy JS Worker. Kept as a pure module so both
 * the Worker and the regression tests exercise exactly the same semantics.
 *
 * An optional third argument carries the validated `structure` payload that
 * Python passes as a keyword; existing two-argument calls are unchanged.
 */
export function createTraceCollector(): {
  frames: RawTraceFrame[];
  trace: (state: TraceState, message?: string, structure?: unknown) => void;
} {
  const frames: RawTraceFrame[] = [];
  const trace = (state: TraceState, message = '', structure?: unknown): void => {
    if (frames.length >= MAX_FRAMES) throw new Error('Too many trace steps (limit: 500)');
    const snapshot = JSON.parse(JSON.stringify(state)) as TraceState;
    const frame: RawTraceFrame = {
      state: snapshot,
      message: String(message).slice(0, MESSAGE_LIMIT),
    };
    if (structure !== undefined) frame.structure = JSON.parse(JSON.stringify(structure));
    frames.push(frame);
  };
  return { frames, trace };
}
