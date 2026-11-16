/**
 * Ollama provider (local daemon, official HTTP API).
 *
 * Docs: https://docs.ollama.com/api — `GET /api/tags`, `POST /api/chat`.
 * `format: 'json'` asks the model for a JSON object; the Gateway still validates
 * it, because not every local model honours that hint.
 */
import type { GatewayConfig } from '../config';
import { ProviderError, probeTimeout, type AIProvider, type GenerateInput, type GenerateResult, type ProviderStatus } from './types';

interface TagsResponse {
  models?: Array<{ name?: unknown; model?: unknown }>;
}

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama' as const;
  readonly label = 'Ollama (local)';
  readonly mock = false;

  constructor(private readonly config: GatewayConfig['ollama']) {}

  get defaultModel(): string {
    return this.config.defaultModel;
  }

  async status(): Promise<ProviderStatus> {
    try {
      const models = await this.listModels();
      return {
        configured: true,
        reachable: true,
        models,
        defaultModel: models.includes(this.config.defaultModel) ? this.config.defaultModel : (models[0] ?? null),
        detail: models.length ? undefined : 'Ollama is running but has no downloaded models.',
      };
    } catch (error) {
      const message =
        error instanceof ProviderError && error.code === 'provider-unreachable'
          ? 'Ollama is not answering on the configured loopback address.'
          : 'Ollama status could not be read.';
      return {
        configured: true,
        reachable: false,
        models: [],
        defaultModel: null,
        detail: message,
      };
    }
  }

  async listModels(): Promise<string[]> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: probeTimeout(),
        headers: { accept: 'application/json' },
      });
    } catch {
      throw new ProviderError('provider-unreachable', 'Ollama is not reachable.', {
        retryable: true,
        hint: 'Start Ollama (`ollama serve`) and check ALGOLENS_OLLAMA_URL.',
      });
    }
    if (!response.ok) {
      throw new ProviderError('provider-error', `Ollama returned HTTP ${response.status}.`, { retryable: true });
    }
    let json: TagsResponse;
    try {
      json = (await response.json()) as TagsResponse;
    } catch {
      throw new ProviderError('provider-invalid-response', 'Ollama model list was not valid JSON.');
    }
    if (!Array.isArray(json.models)) {
      throw new ProviderError('provider-invalid-response', 'Ollama model list had an unexpected shape.');
    }
    return json.models
      .map((entry) => (typeof entry.name === 'string' ? entry.name : typeof entry.model === 'string' ? entry.model : ''))
      .filter((name) => name.length > 0)
      .slice(0, 40);
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        signal: input.signal,
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          stream: false,
          format: 'json',
          options: { temperature: 0.2, num_predict: 900 },
        }),
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ProviderError('provider-timeout', 'The Ollama request was aborted or timed out.', {
          retryable: true,
          hint: 'Try a smaller model or raise ALGOLENS_OLLAMA_TIMEOUT_MS.',
        });
      }
      throw new ProviderError('provider-unreachable', 'Ollama is not reachable.', {
        retryable: true,
        hint: 'Start Ollama (`ollama serve`) and check ALGOLENS_OLLAMA_URL.',
      });
    }

    if (response.status === 404) {
      throw new ProviderError('provider-model-not-found', `Ollama does not have the model "${input.model}".`, {
        hint: `Run: ollama pull ${input.model}`,
      });
    }
    if (response.status === 429) {
      throw new ProviderError('provider-rate-limit', 'Ollama is rate limiting requests.', { retryable: true });
    }
    if (!response.ok) {
      throw new ProviderError('provider-error', `Ollama returned HTTP ${response.status}.`, { retryable: true });
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new ProviderError('provider-invalid-response', 'Ollama returned a non-JSON body.');
    }
    const content = (json as { message?: { content?: unknown } })?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new ProviderError('provider-invalid-response', 'Ollama returned no message content.');
    }
    return { text: content, model: input.model };
  }
}
