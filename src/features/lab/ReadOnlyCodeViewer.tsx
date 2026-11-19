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
  const resizeRef = useRef<() => void>(() => {});
  const [loading, setLoading] = useState(isMonacoEnabled());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const { t } = useI18n();

  const latestRef = useRef({ code, language });
  latestRef.current = { code, language };

  useEffect(() => {
    if (!isMonacoEnabled()) return;
    let disposed = false;
    let contentListener: { dispose(): void } | null = null;
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
          fontSize: 14,
          lineHeight: 21,
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          scrollBeyondLastLine: false,
          tabSize: 4,
          insertSpaces: true,
          folding: true,
          wordWrap: 'off',
          overviewRulerLanes: 0,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'auto',
          },
          bracketPairColorization: { enabled: true },
          theme: 'algolens',
          ariaLabel: t('referenceTitle'),
        });

        // The reference panel must grow with the source. Monaco needs an explicit
        // pixel height, so derive it from the model's content height instead of
        // trapping the code in a fixed, scrollable box.
        let lastHeight = 0;
        const syncHeight = () => {
          if (!hostRef.current) return;
          const next = Math.max(180, Math.ceil(instance.getContentHeight()) + 14);
          if (Math.abs(next - lastHeight) < 1) return;
          lastHeight = next;
          hostRef.current.style.height = `${next}px`;
          instance.layout();
        };
        resizeRef.current = syncHeight;
        syncHeight();
        contentListener = instance.onDidContentSizeChange(syncHeight);
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
      contentListener?.dispose();
      editorRef.current?.dispose();
      editorRef.current = null;
      modelRef.current?.dispose();
      modelRef.current = null;
      monacoRef.current = null;
      resizeRef.current = () => {};
    };
    // Create once; sync effects below keep the model current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = modelRef.current;
    if (!monaco || !model || !ready) return;
    const next = toMonacoLanguage(language);
    if (model.getLanguageId() !== next) {
      monaco.editor.setModelLanguage(model, next);
      window.requestAnimationFrame(() => resizeRef.current());
    }
  }, [language, ready]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model || !ready) return;
    if (model.getValue() !== code) model.setValue(code);
    editorRef.current?.setScrollTop(0);
    window.requestAnimationFrame(() => resizeRef.current());
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
