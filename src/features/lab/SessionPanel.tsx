/**
 * Stage 5A session strip: import an Agent-authored `.algosession.json` and
 * export the current `.algocontext.json`.
 *
 * The two rules this UI must never break:
 *  - importing shows a preview first; nothing is applied or run before confirm;
 *  - exporting only ever serialises the frame already on screen.
 */
import { useRef, useState } from 'react';
import type { LessonCatalog } from '../../domain/lessons/catalog';
import { CONTEXT_LIMITS, SESSION_LIMITS, type SessionIssue } from '../../domain/sessions/types';
import { useI18n } from '../../i18n/I18nProvider';
import type { SessionTransferController } from './useSessionTransfer';

function issueText(t: (key: string) => string, issue: SessionIssue): string {
  const template = t(`sessionErr.${issue.code}`);
  const params = issue.params ?? {};
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function SessionPanel({
  session,
  lessons,
}: {
  session: SessionTransferController;
  /** Used to localise the applied lesson/step names after a language switch. */
  lessons: LessonCatalog;
}) {
  const { t, lang } = useI18n();
  const [includeSource, setIncludeSource] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = () => fileRef.current?.click();

  const appliedLesson = session.applied ? lessons.byId(session.applied.lessonId) : undefined;
  const appliedStep =
    appliedLesson && session.applied?.stepId
      ? appliedLesson.steps.find((step) => step.stepId === session.applied?.stepId)
      : undefined;
  const previewStep = session.preview?.session.selectedStepId
    ? session.preview.lesson.steps.find((step) => step.stepId === session.preview?.session.selectedStepId)
    : undefined;

  return (
    <section className="panel pad sessionpanel" data-testid="session-panel">
      <div className="sectionhead">
        <div>
          <div className="eyebrow">{t('sessionEyebrow')}</div>
          <h2>{t('sessionPanel')}</h2>
        </div>
        <span className="tag">.algosession.json</span>
      </div>

      <div className="sessionactions">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="packfileinput"
          data-testid="session-file-input"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) session.importFile(file);
          }}
        />
        <button type="button" className="btn small" data-testid="session-pick" onClick={pick} disabled={session.busy}>
          {t('sessionPick')}
        </button>
        <span className="muted smalltext">
          {t('sessionPickHint')} ≤ {(SESSION_LIMITS.fileBytes / 1024).toFixed(0)} KiB
        </span>
      </div>

      <div className="sessionactions">
        <button
          type="button"
          className="btn small"
          data-testid="session-export"
          disabled={!session.canExport}
          title={session.canExport ? t('sessionExportHint') : t('sessionExportNoFrame')}
          onClick={() => session.exportContext({ includeSource })}
        >
          {t('sessionExport')}
        </button>
        <label className="sessiontoggle">
          <input
            type="checkbox"
            data-testid="session-export-source"
            checked={includeSource}
            onChange={(event) => setIncludeSource(event.currentTarget.checked)}
          />
          {t('sessionExportSource')}
        </label>
        <span className="muted smalltext">
          ≤ {(CONTEXT_LIMITS.fileBytes / 1024).toFixed(0)} KiB · {t('sessionNoUpload')}
        </span>
      </div>
      <p className="muted smalltext sessionwarn" data-testid="session-export-warn">
        {t('sessionExportWarn')}
      </p>

      {session.issues.length > 0 && (
        <ul className="sessionissues" data-testid="session-issues">
          {session.issues.map((issue, index) => (
            <li key={`${issue.code}-${index}`} data-testid={`session-issue-${issue.code}`}>{issueText(t, issue)}</li>
          ))}
        </ul>
      )}

      {session.preview && (
        <div className="sessionpreview" data-testid="session-preview">
          <div className="sectionhead">
            <h3>{t('sessionPreviewTitle')}</h3>
            <span className="tag">{session.preview.session.lessonOrigin.kind === 'pack'
              ? session.preview.session.lessonOrigin.packId
              : t('sessionPreviewBuiltin')}</span>
          </div>
          <ul className="sessionfacts">
            <li data-testid="session-preview-algorithm">
              {t('sessionPreviewAlgorithm').replace('{algorithm}', session.preview.algorithmName[lang])}
            </li>
            <li data-testid="session-preview-lesson">
              {t('sessionPreviewLesson').replace('{lesson}', session.preview.lesson.title[lang])}
            </li>
            {previewStep && (
              <li data-testid="session-preview-step">
                {t('sessionPreviewStep').replace('{step}', previewStep.title[lang])}
              </li>
            )}
          </ul>
          <p className={`smalltext${session.preview.hasSource ? ' sessionwarn' : ' muted'}`} data-testid="session-preview-source">
            {session.preview.hasSource ? t('sessionPreviewSource') : t('sessionPreviewNoSource')}
          </p>
          <div className="sessionactions">
            <button
              type="button"
              className="btn small primary"
              data-testid="session-preview-apply"
              onClick={session.confirm}
            >
              {t('sessionConfirm')}
            </button>
            <button type="button" className="btn small" data-testid="session-preview-cancel" onClick={session.cancel}>
              {t('sessionCancel')}
            </button>
          </div>
        </div>
      )}

      {session.applied && appliedLesson && (
        <div className="sessionok" data-testid="session-applied">
          <div>{t('sessionApplied').replace('{lesson}', appliedLesson.title[lang])}</div>
          {appliedStep && (
            <div className="smalltext muted" data-testid="session-applied-step">
              {t('sessionAppliedStep').replace('{step}', appliedStep.title[lang])}
            </div>
          )}
          <div className="smalltext muted" data-testid="session-applied-run">{t('sessionAppliedRun')}</div>
        </div>
      )}

      {session.notice && (
        <div className="sessionok" data-testid="session-notice">{t(session.notice.key)}</div>
      )}
    </section>
  );
}
