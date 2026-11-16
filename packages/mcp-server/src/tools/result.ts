/**
 * Tool result helpers. Every tool answers with JSON text so a host Agent can
 * read it without guessing, and failures carry a stable machine code plus a
 * sentence a human can act on.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function jsonResult(payload: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}

export function toolError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ok: false, code, message, ...(details ? { details } : {}) }, null, 2),
      },
    ],
  };
}

/** The one sentence every course answer repeats: nothing was executed. */
export const REALITY_NOTE =
  'This result comes from AlgoLens teaching data or a file the user exported; the MCP server never ran Python and never invented frames.';
