/**
 * Browser client for the same-origin local Gateway.
 *
 * There is intentionally no user-entered URL and no API key here: the page talks
 * to `/api/providers` and `/api/mentor`, which Vite proxies in development and a
 * same-origin deployment proxies in production. On a static host those paths do
 * not exist, and the panel shows an offline state instead of falling back to a
 * direct (and unsafe) cloud call.
 */
import {
  mentorEnvelopeSchema,
  providersResponseSchema,
  type MentorContext,
  type MentorEnvelope,
  type MentorLevel,
  type ProvidersResponse,
} from '../../domain/mentor/schema';

export const MENTOR_ENDPOINT = '/api/mentor';
export const MENTOR_PROVIDERS_ENDPOINT = '/api/providers';
export const MENTOR_CLIENT_HEADER = 'x-algolens-client';
export const MENTOR_CLIENT_VALUE = 'web';

export type MentorFocus = 'step' | 'variables' | 'callstack' | 'custom';

export interface MentorRequestInput {
  provider: string;
  model?: string;
  level: MentorLevel;
  locale: 'zh' | 'en';
  question?: string;
  focus: MentorFocus;
  context: MentorContext;
  confirmFullSolution?: boolean;
  requestId: string;
}

export class MentorClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly hint?: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'MentorClientError';
  }
}

export function newMentorRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `web-${crypto.randomUUID()}`;
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readError(response: Response): Promise<MentorClientError> {
  let code = `http-${response.status}`;
  let message = `Gateway returned HTTP ${response.status}.`;
  let hint: string | undefined;
  let retryable = response.status >= 500 || response.status === 429;
  try {
    const json = (await response.json()) as {
      error?: { code?: unknown; message?: unknown; hint?: unknown; retryable?: unknown };
    };
    if (typeof json.error?.code === 'string') code = json.error.code;
    if (typeof json.error?.message === 'string') message = json.error.message;
    if (typeof json.error?.hint === 'string') hint = json.error.hint;
    if (typeof json.error?.retryable === 'boolean') retryable = json.error.retryable;
  } catch {
    // Keep the HTTP-level message; never render an unknown body.
  }
  return new MentorClientError(code, message, hint, retryable);
}

function networkError(): MentorClientError {
  return new MentorClientError(
    'gateway-unreachable',
    'The local AI Gateway is not running (or the page is hosted statically without one).',
    'Start the Gateway, then reload this page. The algorithm lab keeps working without AI.',
  );
}

export async function fetchMentorProviders(signal?: AbortSignal): Promise<ProvidersResponse> {
  let response: Response;
  try {
    response = await fetch(MENTOR_PROVIDERS_ENDPOINT, {
      method: 'GET',
      headers: { [MENTOR_CLIENT_HEADER]: MENTOR_CLIENT_VALUE },
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw new MentorClientError('aborted', 'Request aborted.');
    throw networkError();
  }
  if (!response.ok) throw await readError(response);

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new MentorClientError('invalid-gateway-response', 'The Gateway providers response was not JSON.');
  }
  const parsed = providersResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new MentorClientError('invalid-gateway-response', 'The Gateway providers response failed validation.');
  }
  return parsed.data;
}

export async function askMentor(input: MentorRequestInput, signal: AbortSignal): Promise<MentorEnvelope> {
  const body: Record<string, unknown> = {
    requestId: input.requestId,
    provider: input.provider,
    level: input.level,
    locale: input.locale,
    focus: input.focus,
    context: input.context,
  };
  if (input.model) body.model = input.model;
  if (input.question?.trim()) body.question = input.question.trim();
  if (input.confirmFullSolution) body.confirmFullSolution = true;

  let response: Response;
  try {
    response = await fetch(MENTOR_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [MENTOR_CLIENT_HEADER]: MENTOR_CLIENT_VALUE,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw new MentorClientError('aborted', 'Request aborted.');
    throw networkError();
  }
  if (!response.ok) throw await readError(response);

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new MentorClientError('invalid-gateway-response', 'The Gateway response was not JSON.');
  }
  const parsed = mentorEnvelopeSchema.safeParse(json);
  if (!parsed.success) {
    throw new MentorClientError(
      'invalid-gateway-response',
      'The Gateway reply failed schema validation, so it was not shown.',
    );
  }
  return parsed.data;
}
