/**
 * Structured execution diagnostics.
 *
 * A Python failure is not a monolithic string: the Pyodide worker extracts the
 * exception type, category and — when it can be determined reliably — the
 * 1-based source line / column of the user's code. The Monaco editor turns
 * these into squiggle markers; the output panel renders the full traceback.
 *
 * Deliberately kept free of any Monaco import so it can be unit-tested without
 * a DOM and so the schema layer stays UI-agnostic.
 */

export type DiagnosticSeverity = 'error' | 'warning';

export type DiagnosticCategory =
  /** The source failed to compile (SyntaxError, IndentationError, …). */
  | 'syntax'
  /** The code ran and raised at runtime (NameError, TypeError, IndexError, …). */
  | 'runtime'
  /** The runner itself failed (e.g. Pyodide could not load / timed out). */
  | 'worker';

export interface ExecutionDiagnostic {
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  /** Short human-readable message (the exception `str`). */
  message: string;
  /** Python exception class name, e.g. `SyntaxError`, `NameError`. */
  errorType?: string;
  /** 1-based line in the user's source, when known. */
  line?: number;
  /** 1-based column in the user's source, when known. */
  column?: number;
  /** Full multi-line traceback text, when available. */
  traceback?: string;
}

/** Sanitise a diagnostic so `line`/`column` are always valid positive ints. */
export function normalizeDiagnostic(input: ExecutionDiagnostic): ExecutionDiagnostic {
  const out: ExecutionDiagnostic = {
    severity: input.severity === 'warning' ? 'warning' : 'error',
    category: input.category,
    message: String(input.message ?? 'Unknown error'),
  };
  if (input.errorType) out.errorType = String(input.errorType);
  if (typeof input.line === 'number' && Number.isInteger(input.line) && input.line > 0) out.line = input.line;
  if (typeof input.column === 'number' && Number.isInteger(input.column) && input.column > 0) out.column = input.column;
  if (input.traceback) out.traceback = String(input.traceback);
  return out;
}

/** Render a diagnostic for the output/feedback panel. */
export function formatDiagnostic(d: ExecutionDiagnostic): string {
  const label = d.errorType ?? d.category;
  const location = d.line ? ` (line ${d.line}${d.column ? `:${d.column}` : ''})` : '';
  const head = `${label}${location}: ${d.message}`;
  return d.traceback ? `${head}\n${d.traceback}` : head;
}

/**
 * An execution failure that carries an optional structured diagnostic. The
 * Pyodide runner throws this; the lab controller turns `.diagnostic` into a
 * Monaco marker while still showing the plain message in the output panel.
 */
export class ExecutionError extends Error {
  diagnostic?: ExecutionDiagnostic;

  constructor(message: string, diagnostic?: ExecutionDiagnostic) {
    super(message);
    this.name = 'ExecutionError';
    if (diagnostic) this.diagnostic = diagnostic;
  }
}
