// @vitest-environment node
/**
 * Real HTTP tests against an ephemeral loopback port. These cover the
 * Gateway's own boundary, not a mocked model: the mock provider is a fixture
 * that returns deterministic text, and every guardrail still runs.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createGateway, type GatewayServer } from './server';
import { parseGatewayConfig, type GatewayConfig } from './config';
import { ProviderError } from './providers/types';

const ORIGIN = 'http://localhost:5173';

function config(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    ...parseGatewayConfig({ ALGOLENS_AI_MOCK: '1' }),
    port: 0,
    ...overrides,
  };
}

const event = {
  schemaVersion: 1 as const,
  step: 2,
  eventType: 'compare' as const,
  visualType: 'array' as const,
  state: { type: 'array', items: [5, 2, 8, 1, 6, 3] },
  message: 'comparing arr[1]=2 with arr[2]=8',
  sourceLocation: { line: 4 },
  variables: [
    { name: 'i', type: 'int', value: 0 },
    { name: 'j', type: 'int', value: 1 },
    { name: 'arr', type: 'list', value: [5, 2, 8, 1, 6, 3] },
  ],
  callStack: [{ name: 'bubble_sort', depth: 0, line: 3, status: 'running' as const }],
  lessonStepId: 'compare',
};

function body(overrides: Record<string, unknown> = {}) {
  return {
    requestId: 'req_test_0001',
    provider: 'mock',
    model: 'mock-tutor',
    level: 2,
    locale: 'zh',
    focus: 'step',
    question: '为什么这里要比较？',
    context: {
      algorithmId: 'bubble-sort',
      lessonId: 'bubble-sort',
      lessonStepId: 'compare',
      lessonStepTitle: '比较相邻元素',
      lessonStepExplanation: '如果左边大于右边，就交换。',
      locale: 'zh',
      stepIndex: 2,
      totalEvents: 6,
      event,
      traceStale: false,
    },
    ...overrides,
  };
}

async function start(gwConfig: GatewayConfig): Promise<{ gw: GatewayServer; base: string }> {
  const gw = createGateway(gwConfig);
  await new Promise<void>((resolve) => gw.server.listen(0, '127.0.0.1', resolve));
  const port = (gw.server.address() as AddressInfo).port;
  return { gw, base: `http://127.0.0.1:${port}` };
}

function headers(extra: Record<string, string> = {}) {
  return {
    origin: ORIGIN,
    'x-algolens-client': 'web',
    'content-type': 'application/json',
    ...extra,
  };
}

let gw: GatewayServer;
let base: string;

beforeAll(async () => {
  ({ gw, base } = await start(config()));
});

afterAll(async () => {
  await gw.close();
});

describe('GET /api/providers', () => {
  it('reports Ollama as unreachable and the mock as explicitly marked', async () => {
    const response = await fetch(`${base}/api/providers`, { headers: headers() });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const json = (await response.json()) as {
      providers: Array<{ id: string; mock: boolean; reachable: boolean }>;
    };
    const ollama = json.providers.find((provider) => provider.id === 'ollama');
    const mock = json.providers.find((provider) => provider.id === 'mock');
    expect(mock).toMatchObject({ mock: true, reachable: true });
    expect(ollama?.mock).toBe(false);
  });
});

describe('request boundary', () => {
  it('refuses a request without the local client header', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify(body()),
    });
    expect(response.status).toBe(401);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('client-header-required');
  });

  it('refuses an origin that is not on the allowlist', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers({ origin: 'http://evil.example' }),
      body: JSON.stringify(body()),
    });
    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('refuses cross-site browser fetches', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers({ 'sec-fetch-site': 'cross-site' }),
      body: JSON.stringify(body()),
    });
    expect(response.status).toBe(403);
  });

  it('requires JSON content type', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers({ 'content-type': 'text/plain' }),
      body: 'hello',
    });
    expect(response.status).toBe(415);
  });

  it('rejects oversized bodies before reading them all', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ question: 'x'.repeat(200_000) })),
    });
    expect(response.status).toBe(413);
  });

  it('rejects any attempt to smuggle a target URL or extra fields', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ baseUrl: 'https://attacker.example/v1', url: 'file:///etc/passwd' })),
    });
    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: { code: string } };
    expect(json.error.code).toBe('invalid-request');
  });

  it('rejects a stepIndex that does not match the real frame', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ context: { ...body().context, stepIndex: 3 } })),
    });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: { hint: string } }).error.hint).toContain('stepIndex');
  });

  it('blocks Level 5 without explicit confirmation', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ level: 5 })),
    });
    expect(response.status).toBe(403);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('level5-confirmation-required');
  });

  it('rejects a provider that is not enabled', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ provider: 'openai' })),
    });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('provider-not-configured');
  });
});

describe('mentor replies', () => {
  it('returns schema-valid JSON with facts drawn from the real frame', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body()),
    });
    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      reply: { level: number; observedFacts: string[]; answerDisclosure: string };
      meta: { mock: boolean; stepIndex: number; guardrails: string[] };
    };
    expect(json.meta.mock).toBe(true);
    expect(json.meta.stepIndex).toBe(2);
    expect(json.reply.observedFacts.join(' ')).toContain('arr = [5,2,8,1,6,3]');
    expect(json.reply.observedFacts.join(' ')).toContain('i = 0');
    expect(json.reply.answerDisclosure).toBe('none');
  });

  it('redacts a full solution at Level 1 even when the model leaks it', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ model: 'mock-leak', level: 1 })),
    });
    const json = (await response.json()) as {
      reply: { explanation: string; answerDisclosure: string };
      meta: { guardrails: string[] };
    };
    expect(response.status).toBe(200);
    expect(json.reply.explanation).not.toContain('def bubble_sort');
    expect(json.reply.explanation).not.toContain('```');
    expect(json.reply.answerDisclosure).toBe('none');
    expect(json.meta.guardrails).toContain('code-redacted');
  });

  it('allows a confirmed Level 5 full answer', async () => {
    const response = await fetch(`${base}/api/mentor`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body({ model: 'mock-leak', level: 5, confirmFullSolution: true })),
    });
    const json = (await response.json()) as { reply: { explanation: string; answerDisclosure: string } };
    expect(response.status).toBe(200);
    expect(json.reply.explanation).toContain('def bubble_sort');
    expect(json.reply.answerDisclosure).toBe('full');
  });
});

describe('rate limit and provider failures', () => {
  it('returns 429 with Retry-After when the limiter is exhausted', async () => {
    const limited = await start(config({ rateLimitPerMinute: 2 }));
    try {
      for (let i = 0; i < 2; i += 1) {
        const ok = await fetch(`${limited.base}/api/mentor`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body()),
        });
        expect(ok.status).toBe(200);
      }
      const blocked = await fetch(`${limited.base}/api/mentor`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body()),
      });
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get('retry-after')).toBeTruthy();
    } finally {
      await limited.gw.close();
    }
  });

  it('maps a cloud auth failure to provider-auth without echoing configuration', async () => {
    const key = 'sk-test-secret-value';
    const fakeProvider = {
      id: 'openai' as const,
      label: 'Fake cloud',
      mock: false,
      defaultModel: 'gpt-4o-mini',
      status: async () => ({
        configured: true,
        reachable: false,
        models: ['gpt-4o-mini'],
        defaultModel: 'gpt-4o-mini',
      }),
      generate: async () => {
        throw new ProviderError('provider-auth', 'The cloud provider rejected the configured credentials.');
      },
    };
    const cloud = await start(
      config({
        openai: { baseUrl: 'https://api.openai.com/v1', apiKey: key, defaultModel: 'gpt-4o-mini' },
      }),
    );
    // Re-create with an injected provider so no real cloud call is attempted.
    await cloud.gw.close();
    const injectedGw = createGateway(
      config({ openai: { baseUrl: 'https://api.openai.com/v1', apiKey: key, defaultModel: 'gpt-4o-mini' } }),
      [fakeProvider],
    );
    await new Promise<void>((resolve) => injectedGw.server.listen(0, '127.0.0.1', resolve));
    const port = (injectedGw.server.address() as AddressInfo).port;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/mentor`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body({ provider: 'openai', model: 'gpt-4o-mini' })),
      });
      const text = await response.text();
      expect(response.status).toBe(502);
      expect(text).toContain('provider-auth');
      expect(text).not.toContain(key);
      expect(text).not.toContain('sk-');
    } finally {
      await injectedGw.close();
    }
  });
});

describe('mock gating', () => {
  it('does not register the mock provider without ALGOLENS_AI_MOCK=1', async () => {
    const real = await start(config({ mock: false }));
    try {
      const response = await fetch(`${real.base}/api/providers`, { headers: headers() });
      const json = (await response.json()) as { providers: Array<{ id: string }> };
      expect(json.providers.map((provider) => provider.id)).not.toContain('mock');
    } finally {
      await real.gw.close();
    }
  });
});
