/**
 * The local Gateway HTTP server.
 *
 * Security model in one place:
 *  - binds 127.0.0.1 only (config has no public host option);
 *  - every request must carry `x-algolens-client: web` (a custom header, so a
 *    cross-site page cannot send a "simple" request) and an allowed Origin;
 *  - body size, response size, timeout, rate limit;
 *  - provider target URLs come from start-up config only;
 *  - no filesystem, shell or browser control exists on this surface.
 */
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { GATEWAY_VERSION, type GatewayConfig } from './config';
import { buildMentorMessages } from './mentor/prompt';
import { parseMentorReply } from './mentor/guard';
import { mentorRequestSchema } from './request';
import { OllamaProvider } from './providers/ollama';
import { OpenAiProvider } from './providers/openai';
import { MockProvider } from './providers/mock';
import { ProviderError, type AIProvider } from './providers/types';
import {
  MENTOR_LIMITS,
  providerStatusSchema,
  type MentorLevel,
  type ProvidersResponse,
} from '../../../src/domain/mentor/schema';

const CLIENT_HEADER = 'x-algolens-client';
const CLIENT_HEADER_VALUE = 'web';

export interface GatewayServer {
  server: Server;
  providers: AIProvider[];
  close: () => Promise<void>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly hint?: string,
    readonly retryable = false,
  ) {
    super(message);
  }
}

function corsHeaders(origin: string | undefined, allowed: readonly string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': `content-type, ${CLIENT_HEADER}`,
    'access-control-max-age': '600',
    vary: 'Origin',
  };
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
  headers: Record<string, string> = {},
  maxBytes?: number,
): void {
  const body = JSON.stringify(payload);
  if (maxBytes && Buffer.byteLength(body, 'utf8') > maxBytes) {
    const fallback = JSON.stringify({
      ok: false,
      error: { code: 'response-too-large', message: 'The response exceeded the configured size limit.' },
    });
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8', ...headers });
    res.end(fallback);
    return;
  }
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

async function readBody(req: IncomingMessage, limit: number): Promise<string> {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > limit) {
    throw new HttpError(413, 'request-too-large', `Request body exceeds ${limit} bytes.`);
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    total += buffer.length;
    if (total > limit) {
      throw new HttpError(413, 'request-too-large', `Request body exceeds ${limit} bytes.`);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function checkAnonymousAccess(req: IncomingMessage, config: GatewayConfig): void {
  const origin = req.headers.origin;
  if (origin && !config.allowedOrigins.includes(origin)) {
    throw new HttpError(403, 'origin-not-allowed', 'This origin is not allowed to call the local AI Gateway.');
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    throw new HttpError(403, 'cross-site-request', 'Cross-site browser requests are refused.');
  }
  const client = req.headers[CLIENT_HEADER];
  if (client !== CLIENT_HEADER_VALUE) {
    throw new HttpError(
      401,
      'client-header-required',
      `Requests must include the ${CLIENT_HEADER}: ${CLIENT_HEADER_VALUE} header (the web panel sets it).`,
    );
  }
}

/** Per-socket token bucket; enough for a human, hostile for a script. */
class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly perMinute: number) {}

  check(key: string, now = Date.now()): { allowed: boolean; retryAfter: number } {
    const window = 60_000;
    const recent = (this.hits.get(key) ?? []).filter((stamp) => now - stamp < window);
    if (recent.length >= this.perMinute) {
      const oldest = recent[0] ?? now;
      const retryAfter = Math.ceil((window - (now - oldest)) / 1000);
      this.hits.set(key, recent);
      return { allowed: false, retryAfter };
    }
    recent.push(now);
    this.hits.set(key, recent);
    return { allowed: true, retryAfter: 0 };
  }
}

function statusOf(error: unknown): { status: number; code: string; message: string; hint?: string; retryable: boolean } {
  if (error instanceof ProviderError) {
    const map: Record<string, number> = {
      'provider-unreachable': 503,
      'provider-auth': 502,
      'provider-model-not-found': 404,
      'provider-rate-limit': 429,
      'provider-timeout': 504,
      'provider-invalid-response': 502,
      'provider-not-configured': 400,
      'provider-error': 502,
    };
    return {
      status: map[error.code] ?? 502,
      code: error.code,
      message: error.message,
      hint: error.hint,
      retryable: error.retryable,
    };
  }
  return { status: 502, code: 'provider-error', message: 'The provider failed in an unexpected way.', retryable: false };
}

export function createGateway(config: GatewayConfig, injected?: AIProvider[]): GatewayServer {
  const providers: AIProvider[] =
    injected ?? [new OllamaProvider(config.ollama), new OpenAiProvider(config.openai), ...(config.mock ? [new MockProvider()] : [])];
  const byId = new Map(providers.map((provider) => [provider.id, provider]));
  const limiter = new RateLimiter(config.rateLimitPerMinute);

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const origin = req.headers.origin;
    const cors = corsHeaders(origin, config.allowedOrigins);
    const started = Date.now();
    let requestId: string = randomUUID();
    let providerId = 'unknown';
    let level = 0;

    try {
      if (req.method === 'OPTIONS') {
        if (origin && !config.allowedOrigins.includes(origin)) {
          throw new HttpError(403, 'origin-not-allowed', 'This origin is not allowed to call the local AI Gateway.');
        }
        res.writeHead(204, { ...cors, 'cache-control': 'no-store' });
        res.end();
        return;
      }

      const url = new URL(req.url ?? '/', `http://${config.host}:${config.port}`);

      if (req.method === 'GET' && url.pathname === '/api/health') {
        // Liveness only: no providers, no configuration, no user data. This is
        // what a process supervisor / Playwright waits on.
        sendJson(res, 200, { ok: true, service: 'algolens-ai-gateway', version: GATEWAY_VERSION }, cors);
        return;
      }

      checkAnonymousAccess(req, config);


      if (req.method === 'GET' && url.pathname === '/api/providers') {
        const statuses = await Promise.all(
          providers.map(async (provider) => {
            const status = await provider.status();
            return providerStatusSchema.parse({
              id: provider.id,
              label: provider.label,
              configured: status.configured,
              reachable: status.reachable,
              models: status.models.slice(0, 40),
              defaultModel: status.defaultModel,
              ...(status.detail ? { detail: status.detail.slice(0, 240) } : {}),
              mock: provider.mock,
            });
          }),
        );
        const payload: ProvidersResponse = {
          ok: true,
          gatewayVersion: GATEWAY_VERSION,
          providers: statuses,
        };
        sendJson(res, 200, payload, cors);
        return;
      }

      if (req.method !== 'POST' || url.pathname !== '/api/mentor') {
        throw new HttpError(404, 'not-found', 'Only GET /api/health, GET /api/providers and POST /api/mentor exist.');
      }

      const contentType = req.headers['content-type'] ?? '';
      if (!contentType.toLowerCase().startsWith('application/json')) {
        throw new HttpError(415, 'unsupported-media-type', 'Send application/json.');
      }

      const key = req.socket.remoteAddress ?? 'local';
      const rate = limiter.check(key);
      if (!rate.allowed) {
        res.setHeader('retry-after', String(rate.retryAfter));
        throw new HttpError(429, 'rate-limited', 'Too many Gateway requests; wait a moment.', undefined, true);
      }

      const raw = await readBody(req, config.maxBodyBytes);
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new HttpError(400, 'invalid-json', 'Request body is not valid JSON.');
      }

      const parsed = mentorRequestSchema.safeParse(json);
      if (!parsed.success) {
        const issues = parsed.error.issues.slice(0, 4).map((issue) => ({
          path: issue.path.join('.') || '(root)',
          message: issue.message,
        }));
        throw new HttpError(400, 'invalid-request', 'The request failed schema validation.', JSON.stringify(issues));
      }

      const request = parsed.data;
      requestId = request.requestId ?? requestId;
      providerId = request.provider;
      level = request.level;

      if (request.level === 5 && request.confirmFullSolution !== true) {
        throw new HttpError(
          403,
          'level5-confirmation-required',
          'Level 5 reveals a full solution and requires confirmFullSolution: true.',
        );
      }

      const provider = byId.get(request.provider);
      if (!provider || (provider.id === 'mock' && !config.mock)) {
        throw new HttpError(400, 'provider-not-configured', `Provider "${request.provider}" is not enabled.`);
      }

      const model = request.model ?? provider.defaultModel;
      if (!model) {
        throw new HttpError(400, 'model-required', 'Choose a model: this provider has no default.');
      }

      const locale = request.locale;
      const messages = buildMentorMessages({
        context: { ...request.context, locale },
        level: request.level,
        ...(request.question ? { question: request.question } : {}),
        focus: request.focus,
        confirmFullSolution: request.confirmFullSolution === true,
      });

      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), config.requestTimeoutMs);
      const onClose = () => abort.abort();
      req.once('close', onClose);
      let result;
      try {
        result = await provider.generate({
          messages,
          model,
          signal: abort.signal,
          meta: {
            level: request.level,
            locale,
            stepIndex: request.context.stepIndex,
            totalEvents: request.context.totalEvents,
            eventMessage: request.context.event.message,
            variables: (request.context.event.variables ?? []).map((variable) => ({
              name: variable.name,
              type: variable.type,
              value: variable.value,
            })),
            callStackNames: (request.context.event.callStack ?? []).map((frame) => frame.name),
            traceStale: request.context.traceStale,
            sourceIncluded: request.context.source !== undefined,
          },
        });
      } finally {
        clearTimeout(timeout);
        req.removeListener('close', onClose);
      }

      const parsedReply = parseMentorReply(result.text, request.level as MentorLevel, locale);
      if (!parsedReply) {
        throw new HttpError(
          502,
          'invalid-model-response',
          'The model did not return a valid mentor JSON object. Retry, or choose another model.',
        );
      }

      // `parseMentorReply` is the guardrail: it validates the schema, pins the
      // level, redacts low-level code and downgrades disclosure.
      const envelope = {
        ok: true as const,
        reply: parsedReply.reply,
        meta: {
          requestId,
          provider: provider.id,
          model,
          level: request.level,
          stepIndex: request.context.stepIndex,
          totalEvents: request.context.totalEvents,
          traceStale: request.context.traceStale,
          sourceIncluded: request.context.source !== undefined,
          latencyMs: Date.now() - started,
          guardrails: parsedReply.guardrails,
          mock: provider.mock,
        },
        disclaimer:
          locale === 'zh'
            ? '以上是模型对当前真实执行帧的解释，不是执行结果；帧数据来自浏览器实际运行。'
            : 'This is the model’s explanation of the real frame on screen, not an execution result; the frame came from the browser run.',
      };

      // Defence in depth: the reply schema caps every field, and the whole body
      // is still bounded.
      sendJson(res, 200, envelope, cors, config.maxResponseBytes);
      log({
        requestId,
        provider: provider.id,
        model,
        level: request.level,
        status: 200,
        ms: Date.now() - started,
      });
    } catch (error) {
      const providerFailure = error instanceof ProviderError ? statusOf(error) : null;
      const http =
        error instanceof HttpError
          ? error
          : providerFailure
            ? new HttpError(
                providerFailure.status,
                providerFailure.code,
                providerFailure.message,
                providerFailure.hint,
                providerFailure.retryable,
              )
            : new HttpError(500, 'gateway-error', 'The Gateway failed to handle this request.');
      const failure = {
        ok: false as const,
        requestId,
        error: {
          code: http.code,
          message: http.message,
          ...(http.hint ? { hint: http.hint } : {}),
          retryable: http.retryable,
        },
      };
      if (!res.headersSent) sendJson(res, http.status, failure, cors, config.maxResponseBytes);
      log({ requestId, provider: providerId, level, status: http.status, ms: Date.now() - started, code: http.code });
    }
  };

  const server = createServer((req, res) => {
    void handler(req, res);
  });
  server.on('clientError', (_error, socket) => {
    socket.destroy();
  });

  return {
    server,
    providers,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

function log(entry: {
  requestId: string;
  provider: string;
  model?: string;
  level?: number;
  status: number;
  ms: number;
  code?: string;
}): void {
  // Never logs bodies, keys, model output or headers.
  const level = entry.level ? ` level=${entry.level}` : '';
  const model = entry.model ? ` model=${entry.model}` : '';
  process.stderr.write(
    `[algolens-ai] ${entry.requestId} provider=${entry.provider}${model}${level} status=${entry.status} ${entry.ms}ms` +
      `${entry.code ? ` code=${entry.code}` : ''}\n`,
  );
}

export function startGateway(config: GatewayConfig): Promise<GatewayServer> {
  const gateway = createGateway(config);
  return new Promise((resolve, reject) => {
    gateway.server.once('error', reject);
    gateway.server.listen(config.port, config.host, () => {
      process.stderr.write(`[algolens-ai] listening on http://${config.host}:${config.port}\n`);
      resolve(gateway);
    });
  });
}

export { MENTOR_LIMITS };
