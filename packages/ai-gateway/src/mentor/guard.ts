/**
 * Reply parsing and the *last* line of defence against leaking a full solution
 * at a low level. Prompting alone is not a guarantee; this function is what the
 * tests can hold to account.
 */
import {
  MENTOR_LIMITS,
  mentorReplySchema,
  type MentorLevel,
  type MentorReply,
} from '../../../../src/domain/mentor/schema';

export type Guardrail = 'code-redacted' | 'level-normalised' | 'disclosure-downgraded';

const REDACTED = {
  zh: '［完整参考代码已按当前提示等级隐藏；如需完整解法，请主动请求 Level 5 并确认。］',
  en: '[The full reference code is hidden at this hint level. If you want it, ask for Level 5 and confirm.]',
} as const;

function findJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return text.slice(start, end + 1);
}

/** Parse model text into a MentorReply, or return null (caller maps to an error). */
export function parseMentorReply(raw: string, level: MentorLevel, locale: 'zh' | 'en'): {
  reply: MentorReply;
  guardrails: Guardrail[];
} | null {
  const candidate = findJsonObject(raw);
  if (!candidate) return null;
  let json: unknown;
  try {
    json = JSON.parse(candidate);
  } catch {
    return null;
  }

  // Extra keys are ignored (models add `confidence`, `notes`…), but every known
  // field must satisfy the shared schema and its size limits.
  const parsed = mentorReplySchema.safeParse(json);
  if (!parsed.success) return null;

  const guardrails: Guardrail[] = [];
  let reply: MentorReply = { ...parsed.data };

  if (reply.level !== level) {
    reply.level = level;
    guardrails.push('level-normalised');
  }

  const redacted = redactForLevel(reply, level, locale);
  if (redacted) {
    reply = redacted;
    guardrails.push('code-redacted');
  }

  const contract = level === 5 ? 'full' : level >= 3 ? 'partial' : 'none';
  const rank = { none: 0, partial: 1, full: 2 } as const;
  if (rank[reply.answerDisclosure] > rank[contract]) {
    reply.answerDisclosure = contract;
    guardrails.push('disclosure-downgraded');
  }

  return { reply, guardrails };
}

/** Replace fenced code that a low level must not reveal. */
function redactForLevel(reply: MentorReply, level: MentorLevel, locale: 'zh' | 'en'): MentorReply | null {
  if (level >= 5) return null;

  const fence = /```[a-zA-Z0-9_+-]*\n([\s\S]*?)```/g;
  let changed = false;
  const redactAll = level <= 3;
  const explanation = reply.explanation.replace(fence, (whole, body: string) => {
    const looksLikeImplementation = /\b(def|function|class|public static|#include|=>)\b/.test(body);
    if (redactAll || looksLikeImplementation) {
      changed = true;
      return REDACTED[locale];
    }
    return whole;
  });
  if (!changed) return null;

  return {
    ...reply,
    explanation: explanation.slice(0, MENTOR_LIMITS.explanationChars),
    answerDisclosure: level >= 3 ? 'partial' : 'none',
  };
}
