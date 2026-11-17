import { useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import type { CodeLanguage } from '../../domain/algorithms/types';
import type { ResolvedTheme } from '../../theme/resolve';
import type { ExecutionDiagnostic } from '../../domain/trace/diagnostic';
import { normalizeDiagnostic } from '../../domain/trace/diagnostic';
import { isMonacoEnabled, loadMonaco, toMonacoLanguage, type Monaco } from '../../runtime/monaco/loader';
import { applyAlgoLensTheme } from '../../runtime/monaco/themes';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Controlled Monaco wrapper.
 *
 * - Lazy-loads the editor so it never bloats the first paint.
 * - A single instance is reused for the lifetime of the component; changing
 *   language / theme / highlight / markers never re-creates it (which keeps the
 *   undo stack and timeline intact).
 * - In jsdom (unit tests) or when loading fails, it renders an identical
 *   textarea fallback so the rest of the UI keeps working.
 */
export function MonacoEditor({
  value,
  language,
  theme,
  highlightLine,
  diagnostics,
  onChange,
}: {
  value: string;
  language: CodeLanguage;
  theme: ResolvedTheme;
  highlightLine: number | null;
  diagnostics: ExecutionDiagnostic[];
  onChange: (value: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [loading, setLoading] = useState(isMonacoEnabled());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const { t } = useI18n();

  // Keep the latest callback without recreating the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // The editor loads asynchronously. If a preset/language changes while Monaco
  // is still loading, the create step must use the newest props, and the sync
  // effects below re-run once `ready` flips so a stale model can never stick.
  const latestRef = useRef({ value, language });
  latestRef.current = { value, language };

  // Create the editor exactly once.
  useEffect(() => {
    if (!isMonacoEnabled()) return;
    let disposed = false;
    loadMonaco()
      .then((monaco) => {
        if (disposed || !hostRef.current) return;
        monacoRef.current = monaco;
        applyAlgoLensTheme(monaco, theme);

        const model = monaco.editor.createModel(latestRef.current.value, toMonacoLanguage(latestRef.current.language));
        const instance = monaco.editor.create(hostRef.current, {
          model,
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          tabSize: latestRef.current.language === 'python' ? 4 : 2,
          insertSpaces: true,
          folding: true,
          autoIndent: 'full',
          wordWrap: 'off',
          bracketPairColorization: { enabled: true },
          theme: 'algolens',
        });
        editorRef.current = instance;
        decorationsRef.current = instance.createDecorationsCollection([]);
        instance.onDidChangeModelContent(() => onChangeRef.current(model.getValue()));
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
      decorationsRef.current = null;
      monacoRef.current = null;
    };
    // Intentionally create only once — the effects below keep it in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch language without replacing the model (preserves undo history).
  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    const next = toMonacoLanguage(language);
    if (model.getLanguageId() !== next) monaco.editor.setModelLanguage(model, next);
    editorRef.current?.updateOptions({ tabSize: language === 'python' ? 4 : 2 });
  }, [language, ready]);

  // Apply external value changes (algorithm switch / restore / language swap).
  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    if (model.getValue() !== value) model.setValue(value);
  }, [value, ready]);

  // Re-apply the theme from the CURRENT tokens. Deferred one macrotask so the
  // ThemeProvider (an ancestor, whose effect runs after this child) has already
  // written `data-theme` before we read the variables it controls.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    const timer = window.setTimeout(() => applyAlgoLensTheme(monaco, theme), 0);
    return () => window.clearTimeout(timer);
  }, [theme, ready]);

  // Sync the execution-line highlight and the diagnostic markers.
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel();
    if (!model) return;

    if (decorationsRef.current) {
      if (highlightLine != null && highlightLine >= 1) {
        decorationsRef.current.set([
          {
            range: new monaco.Range(highlightLine, 1, highlightLine, 1),
            options: {
              isWholeLine: true,
              className: 'algolens-active-line',
              linesDecorationsClassName: 'algolens-active-line-gutter',
            },
          },
        ]);
        // Only scroll when the line is off-screen; never yank the user's cursor.
        editor.revealLineInCenterIfOutsideViewport(highlightLine);
      } else {
        decorationsRef.current.clear();
      }
    }

    const markers = diagnostics
      .map(normalizeDiagnostic)
      .filter((d) => d.line != null)
      .map((d) => ({
        severity: monaco.MarkerSeverity.Error,
        message: d.message,
        startLineNumber: d.line as number,
        startColumn: d.column ?? 1,
        endLineNumber: d.line as number,
        endColumn: (d.column ?? 1) + 1,
      }));
    monaco.editor.setModelMarkers(model, 'algolens', markers);
  }, [highlightLine, diagnostics, ready]);

  if (!isMonacoEnabled() || failed) {
    return (
      <>
        {failed && <div className="note" data-testid="editor-fallback">{t('editorFallback')}</div>}
        <textarea
          className="codearea"
          spellCheck={false}
          aria-label="Algorithm code editor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          data-testid="code-editor"
        />
      </>
    );
  }

  return (
    <div className="monaco-wrap">
      {loading && (
        <div className="monaco-loading muted smalltext" data-testid="monaco-loading" aria-live="polite">
          {t('editorLoading')}
        </div>
      )}
      <div ref={hostRef} className="monaco-host" data-testid="monaco-host" />
    </div>
  );
}
