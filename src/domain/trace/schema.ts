/**
 * Trace Event Schema v1 — the unified, versioned execution-trace protocol.
 *
 * Every teaching-language runner (JavaScript, Python via Pyodide) emits frames
 * that an adapter normalises into `TraceEvent`s; this module is the single
 * runtime validator that guarantees the events the playback / sync panels
 * consume are well-formed. Invalid events are rejected with readable errors and
 * never crash the page.
 *
 * Design goals (Issue 05):
 *  - explicit `schemaVersion` so the protocol can evolve without silent breakage
 *  - JSON-serialisable values only (no functions, cycles, `undefined`, `NaN`)
 *  - hard limits on event count / frame size / variable payloads to bound memory
 *  - callStack is *specified* here but is not animated yet (future recursion work)
 */
import { z } from 'zod';

/** Protocol version. Bump this only with a deliberate breaking change. */
export const TRACE_SCHEMA_VERSION = 1 as const;

/** Visual structures supported by the first-batch visual model. */
export const VISUAL_TYPES = ['array', 'stack', 'queue', 'linked', 'tree', 'graph'] as const;
export type VisualType = (typeof VISUAL_TYPES)[number];

/**
 * Event kinds. The adapter only ever emits `step` (a plain progression) or
 * `done` (terminal). `compare` / `swap` / `visit` / `mark` / `init` are declared
 * for future, richer adapters but are NOT inferred from message text or
 * algorithm names (guessing would fabricate data).
 */
export const EVENT_TYPES = ['init', 'step', 'compare', 'swap', 'visit', 'mark', 'done'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Stage 7B structural operations. These are RECORDED by the runner, never
 * inferred from `message`, the algorithm id, or a change in array length.
 * `init`/`done` describe the container lifecycle; the rest are real operations.
 */
export const STRUCTURE_KINDS = ['stack', 'queue'] as const;
export type StructureKind = (typeof STRUCTURE_KINDS)[number];

export const STRUCTURE_OPERATIONS = [
  'init', 'push', 'pop', 'peek', 'enqueue', 'dequeue', 'front', 'done',
] as const;
export type StructureOperation = (typeof STRUCTURE_OPERATIONS)[number];

const STRUCTURE_OPERATIONS_BY_KIND: Record<StructureKind, readonly StructureOperation[]> = {
  stack: ['init', 'push', 'pop', 'peek', 'done'],
  queue: ['init', 'enqueue', 'dequeue', 'front', 'done'],
};

/** Bounded payloads. Kept in one place so tests can assert them. */
export const LIMITS = {
  MAX_EVENTS: 500,
  MAX_MESSAGE_CHARS: 240,
  MAX_VARIABLES: 50,
  MAX_CALL_STACK: 64,
  MAX_STATE_JSON_BYTES: 8192,
  MAX_VARIABLE_VALUE_JSON_BYTES: 2048,
  MAX_EVENT_JSON_BYTES: 16384,
  MAX_TOTAL_JSON_BYTES: 2_000_000,
  MAX_SOURCE_CHARS: 40_000,
  MAX_NAME_CHARS: 64,
} as const;

/** Recursive JSON value — the only values allowed inside a trace. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Zod counterpart of {@link JsonValue}. Exported so formats that *embed* trace
 * values (learning sessions, exported contexts) validate the same JSON subset
 * instead of re-inventing one.
 */
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)]),
);

/** One element of a stack/queue snapshot. `id` is stable for the element's lifetime. */
export const structureItemSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'structure element value too large',
  ),
});
export type StructureItem = z.infer<typeof structureItemSchema>;

/**
 * Additive Stage 7B structure semantics. `items` is the container AFTER the
 * operation (bottom→top for a stack, front→rear for a queue). `targetId`
 * identifies the element involved; for `pop`/`dequeue` it may refer to
 * `removed`, which is why the removed element is also snapshotted explicitly.
 *
 * The field is optional on `TraceEvent`, so every Stage 1–7A event still
 * validates. An event without this field is rendered by the legacy node view,
 * never by guessing an operation from text.
 */
export const structureSnapshotSchema = z
  .object({
    kind: z.enum(STRUCTURE_KINDS),
    operation: z.enum(STRUCTURE_OPERATIONS),
    items: z.array(structureItemSchema).max(40),
    targetId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
    removed: structureItemSchema.optional(),
  })
  .superRefine((snapshot, ctx) => {
    const ids = new Set<string>();
    snapshot.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'id'],
          message: `duplicate structure element id "${item.id}"`,
        });
      }
      ids.add(item.id);
    });
    if (!STRUCTURE_OPERATIONS_BY_KIND[snapshot.kind].includes(snapshot.operation)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operation'],
        message: `operation "${snapshot.operation}" is not valid for ${snapshot.kind}`,
      });
    }
    if (snapshot.operation === 'pop' || snapshot.operation === 'dequeue') {
      if (!snapshot.removed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['removed'],
          message: `${snapshot.operation} must record the removed element`,
        });
      }
      if (snapshot.targetId && snapshot.removed && snapshot.targetId !== snapshot.removed.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetId'],
          message: 'targetId must identify the removed element',
        });
      }
    }
  });
export type StructureSnapshot = z.infer<typeof structureSnapshotSchema>;

/** One variable snapshot captured at a step. `type` is a free-form label. */
export const variableSnapshotSchema = z.object({
  name: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  type: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'variable value too large',
  ),
  scope: z.string().max(LIMITS.MAX_NAME_CHARS).optional(),
});
export type VariableSnapshot = z.infer<typeof variableSnapshotSchema>;

/** Source position. `line` is 1-based and required; `column` is optional. */
export const sourceLocationSchema = z.object({
  line: z.number().int().positive(),
  column: z.number().int().positive().optional(),
});
export type SourceLocation = z.infer<typeof sourceLocationSchema>;

/**
 * Lifecycle status of a call frame. A frame is `running` from entry until its
 * function is about to return; the runner flips it to `returning` for the
 * return event (so the panel can show the real return value) and then removes
 * it from the stack. `returned` is reserved for future async/awaited frames.
 */
export const CALL_FRAME_STATUS = ['running', 'returning', 'returned'] as const;
export type CallFrameStatus = (typeof CALL_FRAME_STATUS)[number];

/**
 * A call-stack frame. Stage 1 only carried `name` / `line`; Stage 3 extends it
 * backwards-compatibly with the fields a real recursion trace needs. Every new
 * field is optional, so legacy `{name, line}` frames and events without a
 * callStack keep validating unchanged.
 *
 * Invariants the runner must uphold (enforced at capture, not by Zod alone):
 *  - distinct frames get distinct `frameId`s, even for the same function name
 *  - `locals`/`arguments` are deep JSON snapshots (never live object refs)
 *  - `returnValue` is set only for `returning`/`returned` frames
 */
export const callFrameSchema = z.object({
  /** Function name. Required for every frame (kept for Stage-1 compatibility). */
  name: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  /** Stable unique id for THIS invocation (same function recursing → new id). */
  frameId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
  /** 1-based source line the frame currently executes (legacy field). */
  line: z.number().int().positive().optional(),
  /** Recursion depth (0 = outermost call). */
  depth: z.number().int().nonnegative().optional(),
  /** Call-argument snapshot. */
  arguments: z.array(variableSnapshotSchema).max(LIMITS.MAX_VARIABLES).optional(),
  /** This frame's local-variable snapshot (independent per depth). */
  locals: z.array(variableSnapshotSchema).max(LIMITS.MAX_VARIABLES).optional(),
  /** Real return value once the frame starts returning. */
  returnValue: jsonValueSchema
    .refine(
      (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
      'return value too large',
    )
    .optional(),
  status: z.enum(CALL_FRAME_STATUS).optional(),
});
export type CallFrame = z.infer<typeof callFrameSchema>;

export const traceEventSchema = z.object({
  schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
  /** 0-based position within the trace. */
  step: z.number().int().nonnegative(),
  eventType: z.enum(EVENT_TYPES),
  visualType: z.enum(VISUAL_TYPES),
  /** Visual state payload; the renderer reads `state.type` as the source of truth. */
  state: z.record(jsonValueSchema).refine(
    (state) => JSON.stringify(state).length <= LIMITS.MAX_STATE_JSON_BYTES,
    'state too large',
  ),
  message: z.string().max(LIMITS.MAX_MESSAGE_CHARS),
  sourceLocation: sourceLocationSchema.optional(),
  variables: z.array(variableSnapshotSchema).max(LIMITS.MAX_VARIABLES).optional(),
  callStack: z.array(callFrameSchema).max(LIMITS.MAX_CALL_STACK).optional(),
  /**
   * Stage 3B: teaching stage this frame belongs to, as recorded by the runner
   * (Python `trace(..., lesson_step="compare")`). Never inferred from message
   * text. Optional and additive, so every Stage-1/2/3 event still validates.
   */
  lessonStepId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
  /**
   * Stage 7B: optional, validated stack/queue semantics recorded by the runner.
   * Absent on all legacy traces; absence means "render the legacy node view".
   */
  structure: structureSnapshotSchema.optional(),
});
export type TraceEvent = z.infer<typeof traceEventSchema>;

export const traceDocumentSchema = z.object({
  schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
  /** Source-code snapshot that produced these events (for source-consistency). */
  source: z.string().max(LIMITS.MAX_SOURCE_CHARS).optional(),
  events: z.array(traceEventSchema).min(1).max(LIMITS.MAX_EVENTS),
});
export type TraceDocument = z.infer<typeof traceDocumentSchema>;

export type ValidationResult =
  | { ok: true; document: TraceDocument }
  | { ok: false; errors: string[] };

/** Flatten a Zod issue into a human-readable message. */
function describeIssues(issues: z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

/**
 * Validate a raw trace document. Returns structured errors instead of throwing,
 * so an invalid (or malicious) trace can never take down the page.
 */
export function parseTraceDocument(value: unknown): ValidationResult {
  const parsed = traceDocumentSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, errors: describeIssues(parsed.error.issues) };
  }
  if (JSON.stringify(parsed.data).length > LIMITS.MAX_TOTAL_JSON_BYTES) {
    return { ok: false, errors: ['(root): total trace payload exceeds size limit'] };
  }
  return { ok: true, document: parsed.data };
}
