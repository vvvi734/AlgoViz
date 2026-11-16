/**
 * Learning-session transfer (Stage 5A) — the browser half of the local MCP
 * bridge. Both directions are plain file exchange:
 *
 *   Agent → Web: import an `.algosession.json`, show a preview, apply only after
 *                the user confirms, and never execute anything.
 *   Web → Agent: export an `.algocontext.json` describing the frame that is on
 *                screen right now. Nothing is re-run and nothing is uploaded.
 */
import { useCallback, useMemo, useState } from 'react';
import type { Lesson } from '../../domain/lessons/types';
import type { LessonCatalog } from '../../domain/lessons/catalog';
import { buildLearningContext, serializeLearningContext } from '../../domain/sessions/context';
import { parseLearningSession } from '../../domain/sessions/session';
import { SESSION_LIMITS, sessionIssue, type LearningSession, type SessionIssue } from '../../domain/sessions/types';
import { useI18n } from '../../i18n/I18nProvider';
import type { LabController } from './useLabController';

export interface SessionPreview {
  session: LearningSession;
  lesson: Lesson;
  /** True when the session carries a Python example to load as inert text. */
  hasSource: boolean;
  algorithmName: { zh: string; en: string };
}

/**
 * A notice is a translation key, never a baked string, so switching language
 * after an import/export re-renders it in the new one.
 */
export interface SessionNotice {
  key: 'sessionExported' | 'sessionExportedSource';
}

/** Facts about the session that was just applied, for the success line. */
export interface AppliedSession {
  lessonId: string;
  stepId?: string;
}

export interface SessionTransferController {
  preview: SessionPreview | null;
  issues: SessionIssue[];
  notice: SessionNotice | null;
  applied: AppliedSession | null;
  busy: boolean;
  /** True when a real frame exists to export. */
  canExport: boolean;
  importFile: (file: File) => void;
  confirm: () => void;
  cancel: () => void;
  /** Returns false when there is nothing real to export. */
  exportContext: (options: { includeSource: boolean }) => boolean;
  dismiss: () => void;
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('file read failed'));
    reader.readAsArrayBuffer(file);
  });
  return new TextDecoder().decode(new Uint8Array(buffer));
}

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so the browser can start the download first.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function useSessionTransfer({
  lab,
  lessons,
}: {
  lab: LabController;
  lessons: LessonCatalog;
}): SessionTransferController {
  const { lang } = useI18n();
  const [preview, setPreview] = useState<SessionPreview | null>(null);
  const [issues, setIssues] = useState<SessionIssue[]>([]);
  const [notice, setNotice] = useState<SessionNotice | null>(null);
  const [applied, setApplied] = useState<AppliedSession | null>(null);
  const [busy, setBusy] = useState(false);

  const currentEvent = lab.events[lab.playback.index];
  const currentLesson = useMemo(() => lessons.byAlgorithm(lab.currentAlgo), [lessons, lab.currentAlgo]);
  const canExport = Boolean(currentEvent);

  const dismiss = useCallback(() => {
    setIssues([]);
    setNotice(null);
    setApplied(null);
  }, []);

  const importFile = useCallback(
    (file: File) => {
      setIssues([]);
      setNotice(null);
      setApplied(null);
      setPreview(null);
      setBusy(true);
      void (async () => {
        try {
          if (file.size > SESSION_LIMITS.fileBytes) {
            setIssues([sessionIssue('session-too-large', { limit: String(SESSION_LIMITS.fileBytes) })]);
            return;
          }
          const text = await readFileText(file);
          const parsed = parseLearningSession(text);
          if (!parsed.ok) {
            setIssues(parsed.errors);
            return;
          }
          const session = parsed.value;

          const algorithm = lab.catalog[session.algorithmId];
          if (!algorithm) {
            setIssues([sessionIssue('algorithm-unknown', { algorithm: session.algorithmId })]);
            return;
          }
          // A pack course must actually be installed in THIS browser, and this is
          // checked before the lesson lookup: MCP cannot install a pack, so the
          // actionable message is "install the pack", not "unknown course".
          const origin = lessons.originOf(session.algorithmId);
          if (session.lessonOrigin.kind === 'pack') {
            if (!origin || origin.kind !== 'pack' || origin.packId !== session.lessonOrigin.packId) {
              setIssues([sessionIssue('origin-pack-missing', { pack: session.lessonOrigin.packId })]);
              return;
            }
          } else if (origin?.kind !== 'builtin') {
            setIssues([sessionIssue('lesson-unknown', { lesson: session.lessonId })]);
            return;
          }
          const lesson = lessons.byId(session.lessonId);
          if (!lesson) {
            setIssues([sessionIssue('lesson-unknown', { lesson: session.lessonId })]);
            return;
          }
          if (lesson.algorithmId !== session.algorithmId) {
            setIssues([
              sessionIssue('lesson-algorithm-mismatch', {
                lesson: session.lessonId,
                lessonAlgorithm: lesson.algorithmId,
                algorithm: session.algorithmId,
              }),
            ]);
            return;
          }
          if (session.selectedStepId && !lesson.steps.some((step) => step.stepId === session.selectedStepId)) {
            setIssues([sessionIssue('step-unknown', { stepId: session.selectedStepId, lessonId: lesson.lessonId })]);
            return;
          }

          setPreview({
            session,
            lesson,
            hasSource: session.source != undefined,
            algorithmName: { zh: algorithm.name[0], en: algorithm.name[1] },
          });
        } catch {
          setIssues([sessionIssue('session-json')]);
        } finally {
          setBusy(false);
        }
      })();
    },
    [lab.catalog, lessons],
  );

  const confirm = useCallback(() => {
    if (!preview) return;
    const appliedSession = lab.openLearningSession({
      algorithmId: preview.session.algorithmId,
      source: preview.session.source,
      input: preview.session.input,
    });
    if (!appliedSession) {
      setIssues([sessionIssue('algorithm-unknown', { algorithm: preview.session.algorithmId })]);
      setPreview(null);
      return;
    }
    setPreview(null);
    setIssues([]);
    setNotice(null);
    setApplied({
      lessonId: preview.lesson.lessonId,
      ...(preview.session.selectedStepId ? { stepId: preview.session.selectedStepId } : {}),
    });
  }, [lab, preview]);

  const exportContext = useCallback(
    (options: { includeSource: boolean }) => {
      const event = lab.events[lab.playback.index];
      if (!event) {
        setIssues([sessionIssue('context-invalid', undefined, 'no frame to export')]);
        setNotice(null);
        return false;
      }
      const result = buildLearningContext({
        locale: lang,
        algorithmId: lab.currentAlgo,
        lessonId: currentLesson?.lessonId,
        lesson: currentLesson,
        event,
        stepIndex: lab.playback.index,
        totalEvents: lab.events.length,
        source: options.includeSource ? lab.editorCode : undefined,
      });
      if (!result.ok) {
        setIssues(result.errors);
        setNotice(null);
        return false;
      }
      downloadText(`${lab.currentAlgo}.algocontext.json`, serializeLearningContext(result.value));
      setIssues([]);
      setApplied(null);
      setNotice({ key: options.includeSource ? 'sessionExportedSource' : 'sessionExported' });
      return true;
    },
    [currentLesson, lab.currentAlgo, lab.editorCode, lab.events, lab.playback.index, lang],
  );

  return {
    preview,
    issues,
    notice,
    applied,
    busy,
    canExport,
    importFile,
    confirm,
    cancel: useCallback(() => setPreview(null), []),
    exportContext,
    dismiss,
  };
}
