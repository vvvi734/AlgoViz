import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MonacoEditor } from './MonacoEditor';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { ResolvedTheme } from '../../theme/resolve';

const baseProps = {
  value: 'arr = list(input)',
  language: 'python' as const,
  theme: 'dark' as ResolvedTheme,
  highlightLine: null as number | null,
  diagnostics: [],
  onChange: () => {},
};

function renderEditor(props: Partial<typeof baseProps> = {}) {
  return render(
    <I18nProvider>
      <MonacoEditor {...baseProps} {...props} />
    </I18nProvider>,
  );
}

describe('MonacoEditor (jsdom fallback)', () => {
  it('renders a textarea fallback in the test environment', () => {
    renderEditor();
    const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;
    expect(editor).toBeTruthy();
    expect(editor.value).toBe('arr = list(input)');
  });

  it('propagates edits through the fallback', () => {
    const onChange = vi.fn();
    renderEditor({ onChange });
    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'x = 1' } });
    expect(onChange).toHaveBeenCalledWith('x = 1');
  });

  it('re-renders the fallback value when the prop changes', () => {
    const { rerender } = renderEditor();
    rerender(
      <I18nProvider>
        <MonacoEditor {...baseProps} value="print('hi')" />
      </I18nProvider>,
    );
    expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toBe("print('hi')");
  });
});
