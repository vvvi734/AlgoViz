import { useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import type { ResolvedTheme } from '../../theme/resolve';
import { isMonacoEnabled, loadMonaco, toMonacoLanguage, type Monaco } from '../../runtime/monaco/loader';
import { applyAlgoLensTheme } from '../../runtime/monaco/themes';
import { useI18n } from '../../i18n/I18nProvider';
import type { ReferenceLanguage } from '../../domain/reference-code/registry';

/**
 * Read-only Monaco viewer for the three-language reference code.
 *
 * Deliberately separate from the runnable Python editor: there is no onChange,
 * no run/save action and no diagnostics. In jsdom the same component falls back
 * to a selectable `<pre>` with visible line numbers.
 */
export function ReadOnlyCodeViewer({
  code,
  language,
  theme,
}: {
  code: string;
  language: ReferenceLanguage;
  theme: ResolvedTheme;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<editor.ITextModel | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [loading, setLoading] = useState(isMonacoEnabled());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const { t } = useI18n();

  const latestRef = useRef({ code, language });
  latestRef.current = { code, language };

  useEffect(() => {
    if (!isMonacoEnabled()) return;
    let disposed = false;
    loadMonaco()
      .then((monaco) => {
        if (disposed || !hostRef.current) return;
        monacoRef.current = monaco;
        applyAlgoLensTheme(monaco, theme);

        const model = monaco.editor.createModel(
          latestRef.current.code,
          toMonacoLanguage(latestRef.current.language),
        );
        const instance = monaco.editor.create(hostRef.current, {
          model,
          automaticLayout: true,
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          scrollBeyondLastLine: false,
          tabSize: 4,
          insertSpaces: true,
          folding: true,
          wordWrap: 'off',
          bracketPairColorization: { enabled: true },
          theme: 'algolens',
          ariaLabel: t('referenceTitle'),
        });
        editorRef.current = instance;
        modelRef.current = model;
        setLoading(false);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
      modelRef.current?.dispose();
      modelRef.current = null;
      monacoRef.current = null;
    };
    // Create once; sync effects below keep the model current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = modelRef.current;
    if (!monaco || !model || !ready) return;
    const next = toMonacoLanguage(language);
    if (model.getLanguageId() !== next) monaco.editor.setModelLanguage(model, next);
  }, [language, ready]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model || !ready) return;
    if (model.getValue() !== code) model.setValue(code);
    editorRef.current?.setScrollTop(0);
  }, [code, ready]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    const timer = window.setTimeout(() => applyAlgoLensTheme(monaco, theme), 0);
    return () => window.clearTimeout(timer);
  }, [theme, ready]);

  if (!isMonacoEnabled() || failed) {
    const lines = code.replace(/\n$/, '').split('\n');
    return (
      <div className="reference-code-viewer" data-testid="reference-code-viewer" data-readonly="true">
        {failed ? <div className="note">{t('referenceLoadFailed')}</div> : null}
        <pre className="reference-code-fallback" data-testid="reference-code-fallback">
          <code>
            {lines.map((line, index) => (
              <span className="reference-code-line" key={`${index}-${line}`}>
                <span className="reference-code-line-no" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{line || ' '}</span>
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <div className="reference-code-viewer" data-testid="reference-code-viewer" data-readonly="true">
      {loading ? (
        <div className="reference-code-loading muted smalltext" aria-live="polite">
          {t('referenceLoading')}
        </div>
      ) : null}
      <div ref={hostRef} className="reference-code-host" data-testid="reference-code-host" />
    </div>
  );
}
