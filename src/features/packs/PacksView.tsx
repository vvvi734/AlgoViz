/**
 * Knowledge pack management view (Stage 4).
 *
 * Read-only with respect to the lab: it lists installed packs, explains every
 * import failure in Chinese and English, and gates installation behind an
 * explicit preview + confirm step.
 */
import { useRef } from 'react';
import { localizedName } from '../../domain/algorithms/examples';
import { useI18n } from '../../i18n/I18nProvider';
import { PACK_LIMITS } from '../../domain/packs/types';
import type { PacksController } from './usePacksController';
import { fill, packErrorText } from './packText';

export function PacksView({
  controller,
  onOpenCourse,
}: {
  controller: PacksController;
  onOpenCourse: (algorithmId: string) => void;
}) {
  const { t, lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const { preview, pendingUninstall } = controller;

  const pick = () => fileRef.current?.click();

  return (
    <div className="workspace packsview" data-testid="packs-view">
      <div className="maincol">
        <section className="panel pad">
          <div className="sectionhead">
            <div>
              <div className="eyebrow">{t('packs')}</div>
              <h2>{t('packsTitle')}</h2>
            </div>
            <span className="tag">.algopack</span>
          </div>
          <p className="muted">{t('packsIntro')}</p>

          <div className="packactions">
            <input
              ref={fileRef}
              type="file"
              accept=".algopack"
              className="packfileinput"
              data-testid="pack-file-input"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (file) controller.importFile(file);
              }}
            />
            <button
              type="button"
              className="btn primary"
              data-testid="pack-pick-file"
              onClick={pick}
              disabled={controller.busy || controller.storageKind === 'unavailable'}
            >
              {t('packsPick')}
            </button>
            <span className="muted smalltext">
              {t('packsPickHint')} ≤ {(PACK_LIMITS.archiveBytes / (1024 * 1024)).toFixed(0)} MiB
            </span>
          </div>

          {controller.storageKind === 'unavailable' && (
            <div className="packbanner error" data-testid="pack-storage-unavailable">
              {t('packsStorageUnavailable')}
            </div>
          )}

          {controller.busy && (
            <div className="packbanner" data-testid="pack-busy">{t('packsBusy')}</div>
          )}

          {controller.error && (
            <div className="packbanner error" data-testid="pack-error" role="alert">
              <span>{packErrorText(controller.error, t)}</span>
              <button type="button" className="linkbtn" onClick={controller.dismissError}>
                ×
              </button>
            </div>
          )}

          {controller.result && (
            <div className="packbanner ok" data-testid="pack-result">
              {fill(
                controller.result.kind === 'installed' ? t('packsOkInstalled') : t('packsOkUninstalled'),
                { name: controller.result.packName[lang] },
              )}
            </div>
          )}

          <p className="muted smalltext packnote">{t('packsStorageNote')}</p>
        </section>

        {preview && (
          <section className="panel pad packpreview" data-testid="pack-preview">
            <div className="sectionhead">
              <div>
                <div className="eyebrow">{t('packsPreviewTitle')}</div>
                <h2 data-testid="pack-preview-name">{preview.manifest.name[lang]}</h2>
              </div>
              <span className="tag" data-testid="pack-preview-version">v{preview.manifest.version}</span>
            </div>
            <p className="muted smalltext">{t('packsPreviewIntro')}</p>

            <div className="packmeta">
              <span>{t('packsAuthor')}: <b>{preview.manifest.author}</b></span>
              <span>{t('packsLicense')}: <b>{preview.manifest.license}</b></span>
              <span>{t('packsLessonsCount')}: <b>{preview.totals.lessonCount}</b></span>
              <span>{t('packsExamplesCount')}: <b>{preview.totals.pythonExamples}</b></span>
            </div>

            <h4 className="lesson-subhead">{t('packsPreviewLessons')}</h4>
            <ul className="packlessonlist" data-testid="pack-preview-lessons">
              {preview.lessons.map((lesson) => (
                <li key={lesson.lessonId} data-testid={`pack-preview-lesson-${lesson.lessonId}`}>
                  <b>{lesson.title[lang]}</b>
                  <span className="muted smalltext"> · {localizedName(lesson.algorithmId, lang)} ({lesson.algorithmId})</span>
                </li>
              ))}
            </ul>

            {preview.examples.length > 0 && (
              <p className="muted smalltext" data-testid="pack-preview-examples">
                {t('packsPreviewExamples')}: {preview.examples.map((example) => example.path).join(', ')}
              </p>
            )}

            {preview.replaces && (
              <div className="packbanner warn" data-testid="pack-preview-replace">
                {fill(t('packsPreviewReplace'), { version: preview.replaces.version })}
              </div>
            )}

            <div className="packbanner warn" data-testid="pack-preview-risk">{t('packsPreviewRisk')}</div>

            <div className="packactions">
              <button
                type="button"
                className="btn primary"
                data-testid="pack-preview-confirm"
                onClick={controller.confirmInstall}
                disabled={controller.busy}
              >
                {t('packsConfirm')}
              </button>
              <button
                type="button"
                className="btn"
                data-testid="pack-preview-cancel"
                onClick={controller.cancelPreview}
                disabled={controller.busy}
              >
                {t('packsCancel')}
              </button>
            </div>
          </section>
        )}

        <section className="panel pad">
          <h3 className="lesson-subhead">{t('packsInstalled')}</h3>
          {controller.packs.length === 0 ? (
            <div className="empty smalltext" data-testid="pack-empty">{t('packsEmpty')}</div>
          ) : (
            <ul className="packlist">
              {controller.packs.map((pack) => (
                <li
                  key={pack.manifest.packId}
                  className="packcard"
                  data-testid={`pack-card-${pack.manifest.packId}`}
                >
                  <div className="sectionhead">
                    <div>
                      <h3>{pack.manifest.name[lang]}</h3>
                      <p className="muted smalltext">{pack.manifest.description[lang]}</p>
                    </div>
                    <span className="tag" data-testid={`pack-version-${pack.manifest.packId}`}>
                      v{pack.manifest.version}
                    </span>
                  </div>
                  <div className="packmeta">
                    <span>{t('packsAuthor')}: <b>{pack.manifest.author}</b></span>
                    <span>{t('packsLicense')}: <b>{pack.manifest.license}</b></span>
                    <span>{t('packsLessonsCount')}: <b>{pack.lessons.length}</b></span>
                    {pack.examples.length > 0 && (
                      <span>{t('packsExamplesCount')}: <b>{pack.examples.length}</b></span>
                    )}
                  </div>
                  <ul className="packlessonlist">
                    {pack.lessons.map((lesson) => (
                      <li key={lesson.lessonId} data-testid={`pack-lesson-${lesson.lessonId}`}>
                        <b>{lesson.title[lang]}</b>
                        <span className="muted smalltext"> · {localizedName(lesson.algorithmId, lang)}</span>
                        <button
                          type="button"
                          className="linkbtn"
                          data-testid={`pack-open-${lesson.algorithmId}`}
                          onClick={() => onOpenCourse(lesson.algorithmId)}
                        >
                          {t('packsOpenCourse')}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {pendingUninstall === pack.manifest.packId ? (
                    <div className="packconfirm" data-testid={`pack-uninstall-confirm-${pack.manifest.packId}`}>
                      <p className="smalltext">
                        {fill(t('packsUninstallConfirm'), { name: pack.manifest.name[lang] })}
                      </p>
                      <div className="packactions">
                        <button
                          type="button"
                          className="btn danger"
                          data-testid={`pack-uninstall-yes-${pack.manifest.packId}`}
                          onClick={controller.confirmUninstall}
                          disabled={controller.busy}
                        >
                          {t('packsUninstallYes')}
                        </button>
                        <button
                          type="button"
                          className="btn"
                          data-testid={`pack-uninstall-no-${pack.manifest.packId}`}
                          onClick={controller.cancelUninstall}
                        >
                          {t('packsUninstallNo')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="packactions">
                      <button
                        type="button"
                        className="btn danger"
                        data-testid={`pack-uninstall-${pack.manifest.packId}`}
                        onClick={() => controller.requestUninstall(pack.manifest.packId)}
                        disabled={controller.busy}
                      >
                        {t('packsUninstall')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
