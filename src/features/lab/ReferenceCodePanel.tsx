import { useEffect, useMemo, useState } from 'react';
import {
  REFERENCE_LANGUAGE_LABELS,
  REFERENCE_LANGUAGES,
  REFERENCE_LICENSE,
  REFERENCE_SOURCE_NOTES,
  loadReferenceCode,
  referenceFileMeta,
  referenceLanguages,
  type ReferenceLanguage,
} from '../../domain/reference-code/registry';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';
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
 * Algorithm reference-code section inside the advanced panel.
 *
 * - Only registered algorithms/languages are shown as available; anything
 *   else says “not collected” instead of falling back to another algorithm.
 * - The source is read-only and one-click copyable; it is not wired to the
 *   Python Trace runner.
 */
export function ReferenceCodePanel({
  algorithmId,
  algorithmName,
}: {
  algorithmId: string;
  algorithmName: string;
}) {
  const { t, lang } = useI18n();
  const { resolved } = useTheme();
  const available = useMemo(() => referenceLanguages(algorithmId), [algorithmId]);
  const [language, setLanguage] = useState<ReferenceLanguage>(available[0] ?? 'c');
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(available.length > 0);
  const [failed, setFailed] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (available.length === 0) {
      setLanguage('c');
      return;
    }
    setLanguage((current) => (available.includes(current) ? current : available[0]));
  }, [available]);

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
    loadReferenceCode(algorithmId, language)
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
  }, [algorithmId, language, available.length]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const meta = referenceFileMeta(algorithmId, language);
  const hasAny = available.length > 0;

  return (
    <section
      className="reference-code-panel"
      data-testid="reference-code-panel"
      data-algorithm-id={algorithmId}
      data-language={language}
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
                    onClick={() => setLanguage(item)}
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

            <div className="reference-file-row">
              {meta ? (
                <code className="reference-file-name" data-testid="reference-file-name">
                  {meta.fileName}
                </code>
              ) : null}
              <span className="reference-license">{REFERENCE_LICENSE}</span>
              <button
                type="button"
                className="btn small reference-copy"
                data-testid="reference-copy"
                disabled={!source || loading}
                onClick={() => {
                  if (!source) return;
                  copyText(source)
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

          {loading ? (
            <p className="reference-code-loading" data-testid="reference-code-loading">
              {t('referenceLoading')}
            </p>
          ) : failed ? (
            <p className="reference-code-error" data-testid="reference-code-error">
              {t('referenceLoadFailed')}
            </p>
          ) : source ? (
            <ReadOnlyCodeViewer code={source} language={language} theme={resolved} />
          ) : (
            <p className="reference-code-empty">{t('referenceEmptyCode')}</p>
          )}

          <footer className="reference-source" data-testid="reference-source">
            <b>{t('referenceSourceLabel')}</b>
            <span>{REFERENCE_SOURCE_NOTES[language][lang]}</span>
            <span className="reference-license">MIT License · AlgoViz contributors</span>
          </footer>
        </>
      )}
    </section>
  );
}
