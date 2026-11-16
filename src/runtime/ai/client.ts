import type { Lang } from '../../i18n/types';
import { validateHttpUrl } from '../url';

export const AI_API_STORAGE_KEY = 'algolens-api';
export const DEFAULT_AI_API = '/api/ai';
export const AI_TIMEOUT_MS = 15000;

export type AiAction = 'tutor' | 'review_code' | 'generate_algorithm';

export interface GeneratedAlgorithm {
  title: string;
  code: string;
  input: unknown;
  type: string;
}

export type AiReply =
  | { kind: 'text'; reply: string }
  | { kind: 'generated'; algorithm: GeneratedAlgorithm };

export interface AiRequest {
  url: string;
  action: AiAction;
  payload: Record<string, unknown>;
  language: Lang;
}

/**
 * The browser only talks to a user-deployed backend proxy. No provider API key
 * is ever stored in the frontend. The response shape is validated before use.
 */
export async function askAi({ url, action, payload, language }: AiRequest): Promise<AiReply> {
  const endpoint = validateHttpUrl(url, window.location.href);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, language }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as Record<string, unknown>;

  if (action === 'generate_algorithm') {
    if (
      typeof data.code !== 'string' || data.code.length > 25000 ||
      typeof data.title !== 'string' || !('input' in data)
    ) {
      throw new Error('Invalid generation response');
    }
    return {
      kind: 'generated',
      algorithm: {
        title: data.title.slice(0, 70),
        code: data.code,
        input: data.input,
        type: typeof data.type === 'string' ? data.type : 'array',
      },
    };
  }
  const reply = typeof data.reply === 'string' ? data.reply.slice(0, 8000) : '';
  return { kind: 'text', reply };
}
