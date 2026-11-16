/**
 * `list_available_packs` — what the *server* can see, and an explicit statement
 * about what it cannot.
 *
 * Packs installed in the browser are kept in IndexedDB; a stdio process has no
 * access to them. Reporting them as available would be a lie, so this tool only
 * ever lists `.algopack` files from the configured directory.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config';
import { loadCourseIndex } from '../catalog';
import { jsonResult, toolError } from './result';

const BROWSER_NOTE =
  'Packs installed in AlgoLens Web live in the browser IndexedDB and are NOT readable by this local server. ' +
  'Files listed here are .algopack files from the configured directory only.';

export function registerPackTools(server: McpServer, config: McpConfig): void {
  server.registerTool(
    'list_available_packs',
    {
      title: 'List knowledge packs visible to this server',
      description:
        'List .algopack knowledge packs from the directory the user configured (ALGOLENS_PACK_DIR / --pack-dir). ' +
        'Each pack is re-validated with the same rules the browser uses. Browser-installed packs are not visible.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      if (!config.packDir) {
        return jsonResult({
          ok: true,
          configured: false,
          packs: [],
          browserIndexedDbVisible: false,
          note: BROWSER_NOTE,
          howToConfigure:
            'Start the server with --pack-dir <absolute directory> or set ALGOLENS_PACK_DIR to a directory containing .algopack files.',
        });
      }

      const index = loadCourseIndex(config.packDir.path);
      if (index.packDirIssue) {
        return toolError('pack-directory-unavailable', index.packDirIssue.message, {
          code: index.packDirIssue.code,
          directory: config.packDir.path,
        });
      }

      const packs = index.packs.map((pack) => ({
        packId: pack.packId,
        version: pack.version,
        name: pack.name,
        description: pack.description,
        author: pack.author,
        license: pack.license,
        file: pack.file,
        lessons: pack.lessons.map((lesson) => ({
          lessonId: lesson.lessonId,
          algorithmId: lesson.algorithmId,
          title: lesson.title,
          stepCount: lesson.steps.length,
        })),
        pythonExamples: pack.examples.length,
        decompressedBytes: pack.bytes,
      }));

      return jsonResult({
        ok: true,
        configured: true,
        directory: { path: config.packDir.path, origin: config.packDir.source },
        count: packs.length,
        packs,
        browserIndexedDbVisible: false,
        ...(index.skipped.length ? { skipped: index.skipped } : {}),
        note: BROWSER_NOTE,
      });
    },
  );
}
