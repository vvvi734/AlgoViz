/**
 * `inspect_learning_context` — reads a `.algocontext.json` the user exported,
 * validates it with the browser's own schemas, and returns the real frame.
 *
 * Boundaries: only a bare file name inside the configured directory, only a
 * regular file (no symlinks), only up to CONTEXT_LIMITS.fileBytes, and the
 * embedded event must satisfy the Trace Schema.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { parseLearningContext } from '../../../../src/domain/sessions/context';
import { CONTEXT_LIMITS, describeSessionIssues } from '../../../../src/domain/sessions/types';
import type { McpConfig } from '../config';
import { findCourse, findCourseByAlgorithm, loadCourseIndex } from '../catalog';
import { readBoundedTextFile } from '../fsSafe';
import { jsonResult, toolError } from './result';

export function registerContextTools(server: McpServer, config: McpConfig): void {
  server.registerTool(
    'inspect_learning_context',
    {
      title: 'Inspect an exported learning context',
      description:
        'Read and validate an .algocontext.json file the user exported from AlgoLens Web, and return the real frame ' +
        '(teaching step, message, variables, call stack) so the host Agent can explain what the user is actually seeing.',
      inputSchema: {
        file: z
          .string()
          .min(1)
          .max(160)
          .describe('Bare file name inside the configured context directory (no paths).'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      if (!config.contextDir) {
        return toolError(
          'context-dir-not-configured',
          'No context input directory is configured, so no file can be read.',
          { howToConfigure: 'Start the server with --context-dir <absolute directory> or set ALGOLENS_CONTEXT_DIR.' },
        );
      }

      const read = readBoundedTextFile(config.contextDir.path, args.file, CONTEXT_LIMITS.fileBytes);
      if (!read.ok) {
        const hint =
          read.issue.code === 'unsafe-name' || read.issue.code === 'escaped-directory'
            ? 'Pass only the file name; move the export into the configured directory instead of pointing elsewhere.'
            : read.issue.code === 'symlink'
              ? 'Symbolic links are refused: copy the file itself into the configured directory.'
              : read.issue.code === 'too-large'
                ? `Only files up to ${CONTEXT_LIMITS.fileBytes} bytes are read.`
                : 'Check that the file exists in the configured context directory.';
        return toolError(read.issue.code, read.issue.message, { hint, directory: config.contextDir.path });
      }

      const parsed = parseLearningContext(read.value.text);
      if (!parsed.ok) {
        return toolError(parsed.errors[0].code, describeSessionIssues(parsed.errors), {
          issues: parsed.errors,
          hint: 'Export the context again from AlgoLens Web; do not edit it by hand.',
        });
      }

      const context = parsed.value;
      const index = loadCourseIndex(config.packDir?.path ?? null);
      const course = context.lessonId
        ? findCourse(index, context.lessonId)
        : findCourseByAlgorithm(index, context.algorithmId);
      const stepKnown =
        context.lessonStepId != undefined && course
          ? course.lesson.steps.some((step) => step.stepId === context.lessonStepId)
          : undefined;

      const frames = context.event.callStack ?? [];
      return jsonResult({
        ok: true,
        file: args.file,
        bytes: read.value.bytes,
        contextFormatVersion: context.contextFormatVersion,
        traceSchemaVersion: context.traceSchemaVersion,
        exportedAt: context.exportedAt,
        locale: context.locale,
        algorithmId: context.algorithmId,
        lessonId: context.lessonId ?? null,
        stepIndex: context.stepIndex,
        totalEvents: context.totalEvents,
        frame: {
          message: context.event.message,
          eventType: context.event.eventType,
          visualType: context.event.visualType,
          sourceLine: context.event.sourceLocation?.line ?? null,
          variables: context.event.variables ?? [],
          callStack: frames.map((frame) => ({
            name: frame.name,
            frameId: frame.frameId ?? null,
            depth: frame.depth ?? null,
            line: frame.line ?? null,
            status: frame.status ?? null,
            returnValue: frame.returnValue ?? null,
          })),
        },
        teaching: context.lessonStepId
          ? {
              lessonStepId: context.lessonStepId,
              stepTitle: context.lessonStep?.title ?? null,
              stepExplanation: context.lessonStep?.explanation ?? null,
              tip: context.lessonStep?.tip ?? null,
              belongsToCourse: stepKnown === true,
            }
          : null,
        course: course
          ? {
              found: true,
              lessonId: course.lesson.lessonId,
              title: course.lesson.title,
              source: course.origin.kind === 'builtin' ? 'builtin' : 'pack',
              lessonStepIds: course.lesson.steps.map((step) => step.stepId),
            }
          : { found: false },
        sourceIncluded: context.source != undefined,
        ...(context.source != undefined ? { sourceChars: context.source.length } : {}),
        note:
          'This is the frame the browser actually exported. Nothing was re-executed. Variables and call stack are the real snapshots ' +
          'from that frame; any AI explanation built on top of them is inference, not execution.',
      });
    },
  );
}
