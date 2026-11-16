/**
 * Gateway configuration. Every target address is decided here, at start-up,
 * never by a request body: this is the SSRF boundary.
 */
export const GATEWAY_VERSION = '0.7.0-phase6a';

export interface GatewayConfig {
  port: number;
  /** Always loopback; there is no option to expose this publicly. */
  host: '127.0.0.1';
  allowedOrigins: string[];
  maxBodyBytes: number;
  maxResponseBytes: number;
  requestTimeoutMs: number;
  rateLimitPerMinute: number;
  ollama: {
    baseUrl: string;
    defaultModel: string;
    timeoutMs: number;
  };
  openai: {
    baseUrl: string;
    apiKey: string | null;
    defaultModel: string;
  };
  /** Deterministic provider for E2E only; requires ALGOLENS_AI_MOCK=1. */
  mock: boolean;
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export function isLoopbackUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (url.protocol === 'http:' || url.protocol === 'https:') && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function intFromEnv(raw: string | undefined, fallback: number, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return fallback;
  return value;
}

function trimTrailingSlash(raw: string): string {
  return raw.replace(/\/+$/, '');
}

export function parseGatewayConfig(env: NodeJS.ProcessEnv): GatewayConfig {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];
  const extraOrigins = (env.ALGOLENS_AI_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])].filter((origin) => {
    try {
      const url = new URL(origin);
      return url.origin === origin && isLoopbackUrl(origin);
    } catch {
      return false;
    }
  });

  const ollamaUrl = env.ALGOLENS_OLLAMA_URL?.trim() || 'http://127.0.0.1:11434';
  if (!isLoopbackUrl(ollamaUrl)) {
    throw new Error(
      'ALGOLENS_OLLAMA_URL must point at this machine (http://127.0.0.1 or http://localhost); ' +
        'remote Ollama is out of scope for this MVP.',
    );
  }

  const openaiBase = trimTrailingSlash(env.ALGOLENS_OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1');
  let parsedOpenai: URL;
  try {
    parsedOpenai = new URL(openaiBase);
  } catch {
    throw new Error('ALGOLENS_OPENAI_BASE_URL is not a valid URL');
  }
  const openaiHostAllowed =
    parsedOpenai.protocol === 'https:' || isLoopbackUrl(openaiBase);
  if (!openaiHostAllowed) {
    throw new Error('ALGOLENS_OPENAI_BASE_URL must use HTTPS (plain HTTP is only allowed for localhost)');
  }

  const maxBody = intFromEnv(env.ALGOLENS_AI_MAX_BODY_BYTES, 96 * 1024, 8 * 1024, 1024 * 1024);
  const timeout = intFromEnv(env.ALGOLENS_AI_TIMEOUT_MS, 30_000, 1_000, 120_000);

  return {
    port: intFromEnv(env.ALGOLENS_AI_PORT, 8787, 1024, 65535),
    host: '127.0.0.1',
    allowedOrigins,
    maxBodyBytes: maxBody,
    maxResponseBytes: 256 * 1024,
    requestTimeoutMs: timeout,
    rateLimitPerMinute: intFromEnv(env.ALGOLENS_AI_RATE_LIMIT, 20, 1, 200),
    ollama: {
      baseUrl: trimTrailingSlash(ollamaUrl),
      defaultModel: (env.ALGOLENS_OLLAMA_MODEL?.trim() || 'llama3.2').slice(0, 80),
      timeoutMs: Math.min(timeout, intFromEnv(env.ALGOLENS_OLLAMA_TIMEOUT_MS, 20_000, 1_000, 120_000)),
    },
    openai: {
      baseUrl: openaiBase,
      apiKey: env.ALGOLENS_OPENAI_API_KEY?.trim() || null,
      defaultModel: (env.ALGOLENS_OPENAI_MODEL?.trim() || 'gpt-4o-mini').slice(0, 80),
    },
    mock: env.ALGOLENS_AI_MOCK === '1',
  };
}
