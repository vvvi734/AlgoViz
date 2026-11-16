import { describe, expect, it } from 'vitest';
import {
  ExecutionError,
  formatDiagnostic,
  normalizeDiagnostic,
  type ExecutionDiagnostic,
} from './diagnostic';

describe('ExecutionDiagnostic', () => {
  it('sanitises invalid line / column into a valid shape', () => {
    const input: ExecutionDiagnostic = {
      severity: 'error',
      category: 'runtime',
      message: 'boom',
      line: 3.7,
      column: -2,
    };
    const out = normalizeDiagnostic(input);
    expect(out.line).toBeUndefined();
    expect(out.column).toBeUndefined();
    expect(out.category).toBe('runtime');
    expect(out.message).toBe('boom');
  });

  it('keeps valid positive line / column', () => {
    const out = normalizeDiagnostic({
      severity: 'error', category: 'syntax', message: 'x', line: 8, column: 4,
    });
    expect(out.line).toBe(8);
    expect(out.column).toBe(4);
  });

  it('formats a diagnostic with location and traceback', () => {
    const text = formatDiagnostic({
      severity: 'error', category: 'runtime', errorType: 'IndexError',
      message: 'list index out of range', line: 5,
    });
    expect(text).toContain('IndexError');
    expect(text).toContain('line 5');
    expect(text).toContain('list index out of range');
  });

  it('formats a worker-level diagnostic without a fabricated location', () => {
    const text = formatDiagnostic({ severity: 'error', category: 'worker', message: 'timeout' });
    expect(text).toBe('worker: timeout');
    expect(text).not.toContain('line');
  });

  it('ExecutionError carries an optional diagnostic and a plain message', () => {
    const plain = new ExecutionError('nope');
    expect(plain.name).toBe('ExecutionError');
    expect(plain.message).toBe('nope');
    expect(plain.diagnostic).toBeUndefined();

    const withDiag = new ExecutionError('nope', {
      severity: 'error', category: 'syntax', message: 'bad syntax', line: 2,
    });
    expect(withDiag.diagnostic?.line).toBe(2);
  });
});
