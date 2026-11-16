/**
 * One explicit cloud provider: OpenAI's Chat Completions API.
 *
 * This is deliberately *not* a generic "any OpenAI-compatible URL" proxy. The
 * base URL comes from start-up configuration (HTTPS required, loopback allowed
 * only for local testing), and a request can never influence it. Other
 * providers that mimic this shape have not been tested and are not claimed.
 */
import type { GatewayConfig } from '../config';
import { ProviderError, type AIProvider, type GenerateInput, type GenerateResult, type ProviderStatus } from './types';

interface ChatResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
}

export class OpenAiProvider implements AIProvider {
  readonly id = 'openai' as const;
  readonly label = 'OpenAI (cloud)';
  readonly mock = false;

  constructor(private readonly config: GatewayConfig['openai']) {}

  get defaultModel(): string {
    return this.config.defaultModel;
  }

  async status(): Promise<ProviderStatus> {
    if (!this.config.apiKey) {
      return {
        configured: false,
        reachable: false,
        models: [],
        defaultModel: null,
        detail: 'Set ALGOLENS_OPENAI_API_KEY in the Gateway environment to enable this provider.',
      };
    }
    return {
      configured: true,
      // No request is sent from a status endpoint: "configured" is not
      // "verified reachable", and the UI labels it that way.
      reachable: false,
      models: [this.config.defaultModel],
      defaultModel: this.config.defaultModel,
      detail: 'Configured; connectivity is only proven when you send a question.',
    };
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    if (!this.config.apiKey) {
      throw new ProviderError('provider-not-configured', 'The OpenAI provider has no API key configured.');
    }

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: input.signal,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          temperature: 0.2,
          max_tokens: 900,
          response_format: { type: 'json_object' },
        }),
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ProviderError('provider-timeout', 'The cloud request was aborted or timed out.', { retryable: true });
      }
      throw new ProviderError('provider-unreachable', 'The cloud provider could not be reached.', { retryable: true });
    }

    if (response.status === 401 || response.status === 403) {
      throw new ProviderError('provider-auth', 'The cloud provider rejected the configured credentials.', {
        hint: 'Check ALGOLENS_OPENAI_API_KEY in the Gateway environment; it is never sent to the browser.',
      });
    }
    if (response.status === 404) {
      throw new ProviderError('provider-model-not-found', `The cloud provider has no model named "${input.model}".`);
    }
    if (response.status === 429) {
      throw new ProviderError('provider-rate-limit', 'The cloud provider is rate limiting requests.', { retryable: true });
    }
    if (!response.ok) {
      throw new ProviderError('provider-error', `The cloud provider returned HTTP ${response.status}.`, {
        retryable: response.status >= 500,
      });
    }

    let json: ChatResponse;
    try {
      json = (await response.json()) as ChatResponse;
    } catch {
      throw new ProviderError('provider-invalid-response', 'The cloud provider returned a non-JSON body.');
    }
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new ProviderError('provider-invalid-response', 'The cloud provider returned no message content.');
    }
    return { text: content, model: input.model };
  }
}
