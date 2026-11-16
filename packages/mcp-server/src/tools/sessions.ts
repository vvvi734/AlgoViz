/**
 * `create_learning_session` — writes a validated `.algosession.json` into the
 * directory the user configured, and tells the user how to import it.
 *
 * It does not execute anything, does not touch the browser and cannot write
 * outside the configured directory (see fsSafe.ts).
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { exampleFor } from '../../../../src/domain/algorithms/examples';
import { jsonValueSchema } from '../../../../src/domain/trace/schema';
import { buildLearningSession, serializeLearningSession, utf8Bytes } from '../../../../src/domain/sessions/session';
import { SESSION_LIMITS, describeSessionIssues } from '../../../../src/domain/sessions/types';
import type { McpConfig } from '../config';
import { findCourse, loadCourseIndex } from '../catalog';
import { writeNewTextFile } from '../fsSafe';
import { jsonResult, toolError } from './result';

const localeSchema = z.enum(['zh', 'en']);

export function registerSessionTools(server: McpServer, config: McpConfig): void {
  server.registerTool(
    'create_learning_session',
    {
      title: 'Create an AlgoLens learning session file',
      description:
        'Write a strictly validated .algosession.json for one course, optionally with a teaching step and a Python example ' +
        '(stored as inert text). The user imports it in AlgoLens Web and presses Run themselves — nothing is executed here.',
      inputSchema: {
        lessonId: z.string().min(1).max(80).describe('Course id from list_lessons.'),
        locale: localeSchema.optional().describe('Language of the session (default zh).'),
        selectedStepId: z
          .string()
          .min(1)
          .max(64)
          .optional()
          .describe('Teaching step to surface on import (must exist in the course).'),
        includePythonExample: z
          .boolean()
          .optional()
          .describe('Include the course Python example as inert text (default false).'),
        sessionName: z.string().min(1).max(120).optional().describe('Human-readable name for the session.'),
        input: jsonValueSchema
          .optional()
          .describe('Optional sample input (plain JSON) for the algorithm, e.g. [3,1,2].'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (args) => {
      if (!config.sessionDir) {
        return toolError(
          'session-dir-not-configured',
          'No session output directory is configured, so nothing was written.',
          {
            howToConfigure:
              'Start the server with --session-dir <absolute directory> or set ALGOLENS_SESSION_DIR.',
          },
        );
      }

      const index = loadCourseIndex(config.packDir?.path ?? null);
      const entry = findCourse(index, args.lessonId);
      if (!entry) {
        return toolError('lesson-unknown', `No course with lessonId "${args.lessonId}".`, {
          availableLessonIds: index.entries.map((item) => item.lesson.lessonId),
        });
      }

      const locale = args.locale ?? 'zh';
      const lesson = entry.lesson;
      const warnings: string[] = [];

      let source: string | undefined;
      if (args.includePythonExample) {
        const packExample = entry.pack?.examples.find((example) => example.lessonId === lesson.lessonId);
        const candidate = packExample?.code ?? exampleFor(lesson.algorithmId, 'python');
        if (!candidate) {
          warnings.push('This course has no Python example; the session was created without one.');
        } else if (candidate.length > SESSION_LIMITS.sourceChars) {
          return toolError(
            'source-too-large',
            `The Python example is longer than the session limit (${SESSION_LIMITS.sourceChars} characters). ` +
              'Create the session without includePythonExample and load the example in the web app instead.',
          );
        } else {
          source = candidate;
        }
      }

      const input =
        args.input !== undefined
          ? args.input
          : entry.pack?.examples.find((example) => example.lessonId === lesson.lessonId)?.input;

      const built = buildLearningSession({
        lesson,
        locale,
        origin: entry.origin,
        ...(args.selectedStepId ? { selectedStepId: args.selectedStepId } : {}),
        ...(source != undefined ? { source } : {}),
        ...(input !== undefined ? { input } : {}),
        ...(args.sessionName ? { sessionName: args.sessionName } : {}),
      });
      if (!built.ok) {
        const first = built.errors[0];
        return toolError(first.code, describeSessionIssues(built.errors), {
          issues: built.errors,
          howToFix: 'Call list_lessons / get_lesson to check the lesson and step ids, then retry.',
        });
      }

      const text = serializeLearningSession(built.value);
      const written = writeNewTextFile(
        config.sessionDir.path,
        `${lesson.lessonId}.algosession.json`,
        text,
      );
      if (!written.ok) {
        return toolError(written.issue.code, written.issue.message, {
          directory: config.sessionDir.path,
          ...(written.issue.target ? { file: written.issue.target } : {}),
        });
      }

      return jsonResult({
        ok: true,
        created: true,
        executed: false,
        file: written.value.path,
        filename: written.value.path.split(/[\\/]/).pop(),
        bytes: written.value.bytes,
        utf8Bytes: utf8Bytes(text),
        lessonId: lesson.lessonId,
        algorithmId: lesson.algorithmId,
        locale,
        selectedStepId: built.value.selectedStepId ?? null,
        sessionName: built.value.sessionName ?? null,
        hasPythonSource: built.value.source != undefined,
        lessonOrigin: built.value.lessonOrigin,
        importInstructions: [
          'Open AlgoLens Web (npm run dev → http://localhost:5173).',
          'In the lab, find the "Agent learning session" panel and press "Import .algosession.json".',
          `Select the file ${written.value.path}`,
          'Review the preview, press "Apply session", then press "Run & visualise" to generate a real trace.',
        ],
        ...(warnings.length ? { warnings } : {}),
        note:
          'The Python example, when included, is inert text. Importing never runs it, and the MCP server does not open or control the browser.',
      });
    },
  );
}
