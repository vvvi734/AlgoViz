/**
 * Compatibility adapter: converts legacy `frames[{state,message}]` (and the
 * richer Python frames carrying optional `line` / `variables`) into the unified
 * Trace Event Schema v1.
 *
 * It deliberately does NOT fabricate data the runner never produced:
 *  - no `sourceLocation` unless the frame carried a `line` / `column`
 *  - no `variables` unless the frame carried them
 *  - no `callStack` (none of the current runners emit one)
 *  - `eventType` is only ever `step` or `done`; it is never guessed from text
 */
import type { RawCallFrame, RawTraceFrame, RawVariableSnapshot, TraceState } from './types';
import {
  LIMITS,
  TRACE_SCHEMA_VERSION,
  VISUAL_TYPES,
  structureSchema,
  type CallFrame,
  type EventType,
  type JsonValue,
  type TraceDocument,
  type TraceEvent,
  type VariableSnapshot,
  type VisualType,
} from './schema';

/** Map a legacy `state.type` to the declared visual type. Unknown types fall
 *  back to `array` for the denormalised field; `state.type` still drives the
 *  renderer, so unknown structures keep showing their raw-JSON fallback. */
export function inferVisualType(state: TraceState | undefined): VisualType {
  const type = state?.type;
  return VISUAL_TYPES.includes(type as VisualType) ? (type as VisualType) : 'array';
}

/** The only event kinds the adapter will emit. */
export function inferEventType(state: TraceState | undefined): EventType {
  return state?.done ? 'done' : 'step';
}

/** Normalise a loose variable list (used for both `variables` and frame locals). */
function mapVariables(variables: RawVariableSnapshot[] | undefined): VariableSnapshot[] | undefined {
  if (!Array.isArray(variables) || variables.length === 0) return undefined;
  const mapped = variables.slice(0, LIMITS.MAX_VARIABLES).map((variable) => ({
    name: String(variable.name ?? ''),
    type: String(variable.type ?? ''),
    value: variable.value as JsonValue,
    ...(typeof variable.scope === 'string' && variable.scope ? { scope: variable.scope } : {}),
  }));
  return mapped.length ? mapped : undefined;
}

/** Normalise one loose call frame; drop fields the schema won't accept. */
function toCallFrame(frame: RawCallFrame): CallFrame {
  const out: CallFrame = { name: String(frame.name ?? '') };
  if (typeof frame.frameId === 'string' && frame.frameId) out.frameId = frame.frameId;
  if (typeof frame.line === 'number' && Number.isInteger(frame.line) && frame.line > 0) out.line = frame.line;
  if (typeof frame.depth === 'number' && Number.isInteger(frame.depth) && frame.depth >= 0) out.depth = frame.depth;
  const args = mapVariables(frame.arguments);
  if (args) out.arguments = args;
  const locals = mapVariables(frame.locals);
  if (locals) out.locals = locals;
  if (frame.returnValue !== undefined) out.returnValue = frame.returnValue as JsonValue;
  if (frame.status === 'running' || frame.status === 'returning' || frame.status === 'returned') {
    out.status = frame.status;
  }
  return out;
}

function toEvent(frame: RawTraceFrame, index: number): TraceEvent {
  const event: TraceEvent = {
    schemaVersion: TRACE_SCHEMA_VERSION,
    step: index,
    eventType: inferEventType(frame.state),
    visualType: inferVisualType(frame.state),
    // Runners already JSON-normalise their state (JS: JSON round-trip; Python:
    // _snapshot) before it reaches here, so the cast is safe and the schema
    // re-validates it at parse time.
    state: (frame.state ?? {}) as TraceEvent['state'],
    message: String(frame.message ?? '').slice(0, LIMITS.MAX_MESSAGE_CHARS),
  };
  if (typeof frame.line === 'number' && Number.isInteger(frame.line) && frame.line > 0) {
    event.sourceLocation = {
      line: frame.line,
      ...(typeof frame.column === 'number' && frame.column > 0 ? { column: frame.column } : {}),
    };
  }
  const variables = mapVariables(frame.variables);
  if (variables) event.variables = variables;
  if (Array.isArray(frame.callStack) && frame.callStack.length) {
    event.callStack = frame.callStack.slice(0, LIMITS.MAX_CALL_STACK).map(toCallFrame);
  }
  // Stage 3B: pass through only an id the runner actually recorded. No text
  // sniffing, no algorithm-name guessing — no link means no link.
  if (typeof frame.lessonStepId === 'string' && frame.lessonStepId) {
    event.lessonStepId = frame.lessonStepId;
  }
  // Stage 7B/7C: only attach semantics that pass the protocol schema. A malformed
  // structure payload is dropped (legacy view remains), never half-applied.
  if (frame.structure !== undefined) {
    const structure = structureSchema.safeParse(frame.structure);
    if (structure.success) event.structure = structure.data;
  }
  return event;
}

/**
 * Normalise a raw frame stream into a Trace Document. Pass the exact source
 * code that produced the frames so the sync panel can highlight lines and
 * detect that the user has since edited the code.
 */
export function framesToTraceDocument(frames: RawTraceFrame[], source?: string): TraceDocument {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    ...(source !== undefined ? { source } : {}),
    events: frames.slice(0, LIMITS.MAX_EVENTS).map(toEvent),
  };
}
