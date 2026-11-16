// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OllamaProvider } from './providers/ollama';
import { OpenAiProvider } from './providers/openai';
import { ProviderError } from './providers/types';

const ollamaConfig = {
  baseUrl: 'http://127.0.0.1:11434',
  defaultModel: 'llama3.2',
  timeoutMs: 20_000,
};

const message = { role: 'user' as const, content: 'hello' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OllamaProvider', () => {
  it('probes /api/tags and picks a real downloaded model', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ models: [{ name: 'qwen2.5:3b' }] }), { status: 200 })),
    );
    const provider = new OllamaProvider(ollamaConfig);
    const status = await provider.status();
    expect(status.reachable).toBe(true);
    expect(status.models).toEqual(['qwen2.5:3b']);
    expect(status.defaultModel).toBe('qwen2.5:3b');
  });

  it('reports a dead daemon as unreachable rather than throwing at the UI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    const provider = new OllamaProvider(ollamaConfig);
    const status = await provider.status();
    expect(status.reachable).toBe(false);
    expect(status.defaultModel).toBeNull();
  });

  it('maps a missing model to an actionable hint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'model not found' }), { status: 404 })),
    );
    const provider = new OllamaProvider(ollamaConfig);
    await expect(
      provider.generate({ messages: [message], model: 'not-installed', signal: new AbortController().signal, meta: meta() }),
    ).rejects.toMatchObject({ code: 'provider-model-not-found', hint: 'Run: ollama pull not-installed' });
  });

  it('returns content from /api/chat', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: { content: '{"level":1}' } }), {
            status: 200,
          }),
      ),
    );
    const provider = new OllamaProvider(ollamaConfig);
    const result = await provider.generate({
      messages: [message],
      model: 'llama3.2',
      signal: new AbortController().signal,
      meta: meta(),
    });
    expect(result.text).toContain('"level":1');
  });

  it('maps an abort to provider-timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        throw error;
      }),
    );
    const provider = new OllamaProvider(ollamaConfig);
    await expect(
      provider.generate({ messages: [message], model: 'llama3.2', signal: new AbortController().signal, meta: meta() }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('rejects a body without message.content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ done: true }), { status: 200 })));
    const provider = new OllamaProvider(ollamaConfig);
    await expect(
      provider.generate({ messages: [message], model: 'llama3.2', signal: new AbortController().signal, meta: meta() }),
    ).rejects.toMatchObject({ code: 'provider-invalid-response' });
  });
});

describe('OpenAiProvider', () => {
  it('is configured only when a key exists, and never claims reachability untested', async () => {
    const withoutKey = new OpenAiProvider({ baseUrl: 'https://api.openai.com/v1', apiKey: null, defaultModel: 'gpt-4o-mini' });
    const status = await withoutKey.status();
    expect(status.configured).toBe(false);
    expect(status.reachable).toBe(false);

    const withKey = new OpenAiProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      defaultModel: 'gpt-4o-mini',
    });
    const configured = await withKey.status();
    expect(configured.configured).toBe(true);
    expect(configured.reachable).toBe(false);
  });

  it('maps 429 to retryable rate-limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    const provider = new OpenAiProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      defaultModel: 'gpt-4o-mini',
    });
    await expect(
      provider.generate({ messages: [message], model: 'gpt-4o-mini', signal: new AbortController().signal, meta: meta() }),
    ).rejects.toMatchObject({ code: 'provider-rate-limit', retryable: true });
  });

  it('maps 5xx to a retryable provider error without response details', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('upstream secret internals', { status: 500 })));
    const provider = new OpenAiProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      defaultModel: 'gpt-4o-mini',
    });
    await expect(
      provider.generate({ messages: [message], model: 'gpt-4o-mini', signal: new AbortController().signal, meta: meta() }),
    ).rejects.toMatchObject({ code: 'provider-error', retryable: true });
  });

  it('parses a Chat Completions response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: '{"level":2}' } }] }), {
            status: 200,
          }),
      ),
    );
    const provider = new OpenAiProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      defaultModel: 'gpt-4o-mini',
    });
    const result = await provider.generate({
      messages: [message],
      model: 'gpt-4o-mini',
      signal: new AbortController().signal,
      meta: meta(),
    });
    expect(result.text).toContain('"level":2');
  });
});

function meta() {
  return {
    level: 2,
    locale: 'zh' as const,
    stepIndex: 1,
    totalEvents: 4,
    eventMessage: 'compare',
    variables: [{ name: 'i', type: 'int', value: 0 }],
    callStackNames: ['bubble_sort'],
    traceStale: false,
    sourceIncluded: false,
  };
}
