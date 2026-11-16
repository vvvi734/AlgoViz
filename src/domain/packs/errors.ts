/**
 * Structured pack errors.
 *
 * The domain layer never produces user-facing prose: it returns a stable `code`
 * plus the parameters needed to explain the failure. The UI maps codes to
 * bilingual strings (`packErr.<code>` in the i18n dictionary), so an error can
 * never degrade into "unknown error" — and tests can assert on codes instead of
 * matched text.
 */
export const PACK_ERROR_CODES = [
  // container / resources
  'not-a-zip',
  'empty-archive',
  'too-many-entries',
  'file-too-large',
  'total-too-large',
  'compression-ratio',
  'unsafe-path',
  'duplicate-path',
  'path-too-long',
  'unsupported-file',
  'unsupported-method',
  'encrypted-entry',
  'size-mismatch',
  'not-text',
  // manifest
  'missing-manifest',
  'manifest-json',
  'manifest-invalid',
  'format-version',
  'pack-id',
  'version',
  'trace-schema',
  // lessons
  'missing-lesson-file',
  'lesson-json',
  'lesson-invalid',
  'lesson-duplicate',
  'algorithm-unknown',
  'algorithm-builtin-conflict',
  'algorithm-pack-conflict',
  // examples / licence
  'example-missing',
  'example-invalid',
  'missing-license',
  // installation
  'already-installed',
  'version-conflict',
  'storage-unavailable',
  'storage-quota',
  'storage-failed',
  'file-read-failed',
] as const;

export type PackErrorCode = (typeof PACK_ERROR_CODES)[number];

export interface PackError {
  code: PackErrorCode;
  /** Values interpolated into the localized message (`{name}`, `{size}`…). */
  params?: Record<string, string>;
}

export type PackResult<T> = { ok: true; value: T } | { ok: false; errors: PackError[] };

export function packError(code: PackErrorCode, params?: Record<string, string>): PackError {
  return params ? { code, params } : { code };
}

export function fail(code: PackErrorCode, params?: Record<string, string>): PackResult<never> {
  return { ok: false, errors: [packError(code, params)] };
}

export function failWith(errors: PackError[]): PackResult<never> {
  return { ok: false, errors };
}

/** Compact one-line summary, used in logs and CLI output (not shown as UI copy). */
export function describeErrors(errors: readonly PackError[]): string {
  return errors
    .map((error) => {
      const params = error.params
        ? ` (${Object.entries(error.params).map(([key, value]) => `${key}=${value}`).join(', ')})`
        : '';
      return `${error.code}${params}`;
    })
    .join('; ');
}

export function isPackErrorCode(value: string): value is PackErrorCode {
  return (PACK_ERROR_CODES as readonly string[]).includes(value);
}
