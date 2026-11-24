import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { SearchPresetPickers, type SearchPickerKind } from './SearchPickers';

const ALL_PICKER_IDS = ['block-search-picker', 'bplus-picker', 'key-tree-picker'] as const;

function renderPickers(activePicker: SearchPickerKind) {
  return render(
    <I18nProvider>
      <SearchPresetPickers
        activePicker={activePicker}
        inputJson="{}"
        blockActual={null}
        bplusActual={null}
        keyActual={null}
        onSelectBlock={vi.fn()}
        onSelectBplus={vi.fn()}
        onSelectKey={vi.fn()}
      />
    </I18nProvider>,
  );
}

describe('SearchPresetPickers page ownership', () => {
  it.each([
    ['block', 'block-search-picker', '分块查找官方示例'],
    ['bplus', 'bplus-picker', 'B+ 树官方示例'],
    ['key', 'key-tree-picker', '键树官方示例'],
  ] as const)('only renders the %s lesson picker', (activePicker, activeId, title) => {
    renderPickers(activePicker);

    for (const id of ALL_PICKER_IDS) {
      if (id === activeId) {
        expect(screen.getByTestId(id)).toBeTruthy();
      } else {
        expect(screen.queryByTestId(id)).toBeNull();
      }
    }
    expect(screen.getByText(title)).toBeTruthy();
  });
});
