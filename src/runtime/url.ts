/** Rejects non-HTTP(S) URLs and plaintext HTTP to remote hosts. */
export function validateHttpUrl(value: string, base: string): URL {
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only HTTP(S) URLs are permitted');
  const isLocal = ['localhost', '127.0.0.1', window.location.hostname].includes(url.hostname);
  if (url.protocol === 'http:' && !isLocal) throw new Error('Use HTTPS for remote endpoints');
  return url;
}
