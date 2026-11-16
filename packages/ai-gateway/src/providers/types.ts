/** Provider abstraction: the Gateway knows providers, never API plumbing. */

export type ProviderId = 'ollama' | 'openai' | 'mock';

export type ProviderErrorCode =
  | 'provider-unreachable'
  | 'provider-auth'
  | 'provider-model-not-found'
  | 'provider-rate-limit'
  | 'provider-timeout'
  | 'provider-invalid-response'
  | 'provider-error'
  | 'provider-not-configured';

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly retryable: boolean;
  readonly hint?: string;

  constructor(code: ProviderErrorCode, message: string, options?: { retryable?: boolean; hint?: string }) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.hint = options?.hint;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateInput {
  messages: ChatMessage[];
  model: string;
  signal: AbortSignal;
  /** Already-validated context, available to deterministic test providers. */
  meta: {
    level: number;
    locale: 'zh' | 'en';
    stepIndex: number;
    totalEvents: number;
    eventMessage: string;
    variables: Array<{ name: string; type: string; value: unknown }>;
    callStackNames: string[];
    traceStale: boolean;
    sourceIncluded: boolean;
  };
}

export interface GenerateResult {
  text: string;
  model: string;
}

export interface ProviderStatus {
  configured: boolean;
  reachable: boolean;
  models: string[];
  defaultModel: string | null;
  detail?: string;
}

export interface AIProvider {
  readonly id: ProviderId;
  readonly label: string;
  readonly mock: boolean;
  readonly defaultModel: string;
  status(): Promise<ProviderStatus>;
  generate(input: GenerateInput): Promise<GenerateResult>;
}

/** 5 s cap for status probes so the UI never hangs on a dead service. */
export function probeTimeout(ms = 5_000): AbortSignal {
  return AbortSignal.timeout(ms);
}
