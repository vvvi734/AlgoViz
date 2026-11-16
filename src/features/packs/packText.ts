/**
 * Localized rendering of structured pack errors.
 *
 * Domain code returns `{ code, params }`; this is the only place that turns it
 * into prose, so a new error code can never surface as "unknown error".
 */
import type { PackError } from '../../domain/packs/errors';

export type Translate = (key: string) => string;

export function packErrorText(error: PackError, t: Translate): string {
  const template = t(`packErr.${error.code}`);
  if (!error.params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => error.params?.[key] ?? match);
}

/** Interpolate a plain message with params (pack names, versions). */
export function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match);
}
