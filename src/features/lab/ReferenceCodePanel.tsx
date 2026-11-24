import { useEffect, useMemo, useState } from 'react';
import {
  REFERENCE_LANGUAGE_LABELS,
  REFERENCE_LANGUAGES,
  loadReferenceCode,
  referenceConvenienceNote,
  referenceFileMeta,
  referenceImplementations,
  referenceLanguages,
  type ReferenceImplementation,
  type ReferenceLanguage,
} from '../../domain/reference-code/registry';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';
import { localizeReferenceSource } from '../../domain/reference-code/localization';
import { ReadOnlyCodeViewer } from './ReadOnlyCodeViewer';

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) throw new Error('copy failed');
}

/**
 * Algorithm reference-code section inside the read-only reference-code panel.
 *
 * - Only registered algorithms/languages are shown as available; anything
 *   else says “not collected” instead of falling back to another algorithm.
 * - The source is read-only and one-click copyable; it is not wired to the
 *   Python Trace runner.
 */
export function ReferenceCodePanel({
  algorithmId,
  algorithmName,
  language: controlledLanguage,
  onLanguageChange,
}: {
  algorithmId: string;
  algorithmName: string;
  /**
   * Optional controlled language. The workspace owns it so collapsing the
   * panel (which unmounts Monaco) never forgets the learner's C/C++/Python
   * choice. Standalone content tests omit both props and keep the local state.
   */
  language?: ReferenceLanguage;
  onLanguageChange?: (language: ReferenceLanguage) => void;
}) {
  const { t, lang } = useI18n();
  const { resolved } = useTheme();
  const available = useMemo(() => referenceLanguages(algorithmId), [algorithmId]);
  const [uncontrolledLanguage, setUncontrolledLanguage] = useState<ReferenceLanguage>(
    available[0] ?? 'c',
  );
  const language = controlledLanguage ?? uncontrolledLanguage;
  const changeLanguage = (next: ReferenceLanguage) => {
    if (onLanguageChange) onLanguageChange(next);
    else setUncontrolledLanguage(next);
  };
  const implementations = useMemo(
    () => referenceImplementations(algorithmId, language),
    [algorithmId, language],
  );
  const [implementation, setImplementation] = useState<ReferenceImplementation>('principle');
  const activeImplementation: ReferenceImplementation = implementations.includes(implementation)
    ? implementation
    : (implementations[0] ?? 'principle');
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(available.length > 0);
  const [failed, setFailed] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (available.length === 0) {
      if (controlledLanguage === undefined) setUncontrolledLanguage('c');
      return;
    }
    if (available.includes(language)) return;
    if (onLanguageChange) onLanguageChange(available[0]);
    else setUncontrolledLanguage(available[0]);
  }, [available, controlledLanguage, language, onLanguageChange]);

  useEffect(() => {
    let active = true;
    setSource(null);
    setFailed(false);
    setCopyState('idle');
    if (available.length === 0) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    loadReferenceCode(algorithmId, language, activeImplementation)
      .then((text) => {
        if (!active) return;
        if (text == null) {
          setFailed(true);
          setSource(null);
        } else {
          setSource(text);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [algorithmId, language, activeImplementation, available.length]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const meta = referenceFileMeta(algorithmId, language, activeImplementation);
  const displaySource = useMemo(
    () =>
      source
        ? localizeReferenceSource(source, {
            algorithmId,
            algorithmName,
            language,
            implementation: activeImplementation,
            fileName: meta?.fileName,
            lang,
          })
        : null,
    [source, algorithmId, algorithmName, language, activeImplementation, meta?.fileName, lang],
  );
  const hasAny = available.length > 0;
  const hasImplementationSwitch = implementations.length > 1;
  const teachingNote =
    activeImplementation === 'convenience'
      ? referenceConvenienceNote(algorithmId, language)?.[lang] ?? null
      : null;
  const implementationLabel =
    activeImplementation === 'principle' ? t('referencePrinciple') : t('referenceConvenience');
  const implementationPurpose =
    activeImplementation === 'principle'
      ? t('referencePrinciplePurpose')
      : t('referenceConveniencePurpose');

  return (
    <section
      className="reference-code-panel"
      data-testid="reference-code-panel"
      data-algorithm-id={algorithmId}
      data-language={language}
      data-implementation={activeImplementation}
      data-comment-language={lang}
    >
      <header className="reference-code-head">
        <div>
          <h3 data-testid="reference-code-title">
            {t('referenceTitle')} · {algorithmName}
          </h3>
          <p className="reference-code-hint">{t('referenceHint')}</p>
        </div>
        <span className="tag">{t('referenceReadOnly')}</span>
      </header>

      {!hasAny ? (
        <p className="reference-code-empty" data-testid="reference-code-unavailable">
          {t('referenceUnavailable')}
        </p>
      ) : (
        <>
          <div className="reference-code-toolbar">
            <div
              className="reference-language-tabs"
              role="tablist"
              aria-label={t('referenceTitle')}
            >
              {REFERENCE_LANGUAGES.map((item) => {
                const exists = available.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    className={`reference-language-tab${language === item ? ' active' : ''}`}
                    aria-selected={language === item}
                    disabled={!exists}
                    data-testid={`reference-lang-${item}`}
                    title={exists ? REFERENCE_LANGUAGE_LABELS[item] : t('referenceLanguageUnavailable')}
                    onClick={() => changeLanguage(item)}
                  >
                    {REFERENCE_LANGUAGE_LABELS[item]}
                    {!exists ? (
                      <span className="reference-language-missing">
                        {t('referenceLanguageUnavailable')}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {hasImplementationSwitch ? (
              <div
                className="reference-implementation-tabs"
                role="tablist"
                aria-label={t('referenceImplementationLabel')}
                data-testid="reference-implementation-tabs"
              >
                {implementations.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    className={`reference-language-tab reference-implementation-tab${
                      activeImplementation === item ? ' active' : ''
                    }`}
                    aria-selected={activeImplementation === item}
                    data-testid={`reference-impl-${item}`}
                    onClick={() => setImplementation(item)}
                  >
                    {item === 'principle' ? t('referencePrinciple') : t('referenceConvenience')}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="reference-file-row">
              {meta ? (
                <code className="reference-file-name" data-testid="reference-file-name">
                  {meta.fileName}
                </code>
              ) : null}
              <button
                type="button"
                className="btn small reference-copy"
                data-testid="reference-copy"
                disabled={!displaySource || loading}
                onClick={() => {
                  if (!displaySource) return;
                  copyText(displaySource)
                    .then(() => setCopyState('copied'))
                    .catch(() => setCopyState('failed'));
                }}
              >
                {copyState === 'copied'
                  ? t('referenceCopied')
                  : copyState === 'failed'
                    ? t('referenceCopyFailed')
                    : t('referenceCopy')}
              </button>
            </div>
          </div>

          <p className="reference-purpose" data-testid="reference-purpose">
            <b>{implementationLabel}</b>
            <span>{implementationPurpose}</span>
          </p>

          {loading ? (
            <p className="reference-code-loading" data-testid="reference-code-loading">
              {t('referenceLoading')}
            </p>
          ) : failed ? (
            <p className="reference-code-error" data-testid="reference-code-error">
              {t('referenceLoadFailed')}
            </p>
          ) : displaySource ? (
            <ReadOnlyCodeViewer code={displaySource} language={language} theme={resolved} />
          ) : (
            <p className="reference-code-empty">{t('referenceEmptyCode')}</p>
          )}

          {teachingNote ? (
            <footer className="reference-source" data-testid="reference-source">
              <b>{t('referenceTeachingNoteLabel')}</b>
              <span>{teachingNote}</span>
            </footer>
          ) : null}
        </>
      )}
    </section>
  );
}
