/**
 * Server factory — one place registers every tool and prompt, so the stdio
 * entry point and the protocol tests exercise exactly the same server.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from './config';
import { registerContextTools } from './tools/context';
import { registerLessonTools } from './tools/lessons';
import { registerPackTools } from './tools/packs';
import { registerSessionTools } from './tools/sessions';
import { registerTeachingPrompt } from './prompts/teachAlgorithm';

export const SERVER_INFO = { name: 'algolens-mcp', version: '0.6.0-phase5a' } as const;

export function createAlgoLensServer(config: McpConfig): McpServer {
  const server = new McpServer(SERVER_INFO);
  registerLessonTools(server, config);
  registerPackTools(server, config);
  registerSessionTools(server, config);
  registerContextTools(server, config);
  registerTeachingPrompt(server, config);
  return server;
}
