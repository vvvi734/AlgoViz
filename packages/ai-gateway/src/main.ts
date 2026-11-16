/**
 * Entry point for the local AI Gateway (stdio-free; loopback HTTP only).
 */
import { parseGatewayConfig, GATEWAY_VERSION } from './config';
import { startGateway } from './server';

const USAGE = [
  'AlgoLens AI Gateway (loopback only).',
  '',
  'Environment:',
  '  ALGOLENS_AI_PORT            default 8787',
  '  ALGOLENS_AI_ORIGINS         extra allowed origins (comma separated)',
  '  ALGOLENS_OLLAMA_URL          default http://127.0.0.1:11434',
  '  ALGOLENS_OLLAMA_MODEL        default llama3.2',
  '  ALGOLENS_OPENAI_API_KEY      enables the cloud provider (never sent to the browser)',
  '  ALGOLENS_OPENAI_BASE_URL     default https://api.openai.com/v1',
  '  ALGOLENS_OPENAI_MODEL        default gpt-4o-mini',
  '  ALGOLENS_AI_TIMEOUT_MS       default 30000',
  '  ALGOLENS_AI_RATE_LIMIT       requests per minute, default 20',
  '  ALGOLENS_AI_MOCK=1           test-only deterministic provider',
  '',
  'Endpoints: GET /api/health, GET /api/providers, POST /api/mentor.',
].join('\n');

async function main(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stderr.write(`${USAGE}\n`);
    return;
  }
  const config = parseGatewayConfig(process.env);
  const gateway = await startGateway(config);
  process.stderr.write(`[algolens-ai] version ${GATEWAY_VERSION}; providers: ${gateway.providers.map((p) => p.id).join(', ')}\n`);

  const shutdown = () => {
    void gateway.close().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  process.stderr.write(`[algolens-ai] fatal: ${(error as Error).message}\n`);
  process.exit(1);
});
