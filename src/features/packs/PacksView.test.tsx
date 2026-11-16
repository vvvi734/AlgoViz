import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { bubbleSortLesson } from '../../domain/lessons/bubbleSort';
import { createLessonCatalog } from '../../domain/lessons/catalog';
import { packError } from '../../domain/packs/errors';
import type { InstalledPack, PackPreview } from '../../domain/packs/types';
import { PacksView } from './PacksView';
import type { PacksController } from './usePacksController';

afterEach(() => {
  localStorage.clear();
});

function installedPack(): InstalledPack {
  return {
    manifest: {
      packFormatVersion: 1,
      packId: 'fixture-pack',
      version: '1.0.0',
      name: { zh: '样例知识包', en: 'Fixture pack' },
      description: { zh: '样例说明', en: 'Fixture description' },
      author: 'AlgoLens tests',
      license: 'MIT',
      requiredTraceSchema: 1,
      lessons: ['lessons/pack-course.json'],
    },
    installedAt: 1_700_000_000_000,
    lessons: [{ ...bubbleSortLesson, lessonId: 'pack-course', algorithmId: 'binary' }],
    examples: [
      {
        lessonId: 'pack-course',
        path: 'examples/binary.py',
        language: 'python',
        code: "trace({'type': 'array', 'values': [1]}, 'frame', lesson_step='init')\n",
      },
    ],
  };
}

function preview(): PackPreview {
  const pack = installedPack();
  return {
    manifest: pack.manifest,
    lessons: pack.lessons,
    examples: pack.examples,
    totals: { files: 4, bytes: 1200, lessonCount: 1, pythonExamples: 1 },
    replaces: null,
  };
}

function controller(overrides: Partial<PacksController> = {}): PacksController {
  return {
    packs: [],
    catalog: createLessonCatalog([]),
    loading: false,
    busy: false,
    preview: null,
    error: null,
    result: null,
    pendingUninstall: null,
    storageKind: 'indexeddb',
    importFile: vi.fn(),
    confirmInstall: vi.fn(),
    cancelPreview: vi.fn(),
    requestUninstall: vi.fn(),
    cancelUninstall: vi.fn(),
    confirmUninstall: vi.fn(),
    dismissError: vi.fn(),
    ...overrides,
  };
}

const renderView = (overrides: Partial<PacksController> = {}, onOpenCourse = vi.fn()) =>
  render(
    <I18nProvider>
      <PacksView controller={controller(overrides)} onOpenCourse={onOpenCourse} />
    </I18nProvider>,
  );

describe('PacksView', () => {
  it('shows the empty state and the local-only hint', () => {
    renderView();
    expect(screen.getByTestId('packs-view')).toBeTruthy();
    expect(screen.getByTestId('pack-empty')).toBeTruthy();
  });

  it('explains that storage is unavailable instead of inviting an install', () => {
    renderView({ storageKind: 'unavailable' });
    expect(screen.getByTestId('pack-storage-unavailable')).toBeTruthy();
    expect((screen.getByTestId('pack-pick-file') as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders an import failure in words, with the offending path', () => {
    renderView({ error: packError('unsafe-path', { path: '../evil.json' }) });
    const banner = screen.getByTestId('pack-error');
    expect(banner.textContent).toContain('../evil.json');
    expect(banner.textContent).not.toContain('packErr.');
  });

  it('passes the picked file to the controller', () => {
    const importFile = vi.fn();
    renderView({ importFile });
    const input = screen.getByTestId('pack-file-input') as HTMLInputElement;
    const file = new File(['zip'], 'demo.algopack', { type: 'application/octet-stream' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(importFile).toHaveBeenCalledWith(file);
  });

  it('previews the pack before installing and can be cancelled', () => {
    const confirmInstall = vi.fn();
    const cancelPreview = vi.fn();
    renderView({ preview: preview(), confirmInstall, cancelPreview });

    const card = screen.getByTestId('pack-preview');
    expect(within(card).getByTestId('pack-preview-name').textContent).toContain('样例知识包');
    expect(card.textContent).toContain('MIT');
    expect(screen.getByTestId('pack-preview-lesson-pack-course')).toBeTruthy();

    fireEvent.click(screen.getByTestId('pack-preview-confirm'));
    expect(confirmInstall).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('pack-preview-cancel'));
    expect(cancelPreview).toHaveBeenCalledTimes(1);
  });

  it('warns about replacement and execution risk', () => {
    renderView({ preview: { ...preview(), replaces: { version: '0.9.0' } } });
    expect(screen.getByTestId('pack-preview-replace').textContent).toContain('0.9.0');
    expect(screen.getByTestId('pack-preview-risk').textContent).toContain('Pyodide');
  });

  it('lists an installed pack and opens its course', () => {
    const onOpenCourse = vi.fn();
    renderView({ packs: [installedPack()] }, onOpenCourse);

    const card = screen.getByTestId('pack-card-fixture-pack');
    expect(card.textContent).toContain('样例知识包');
    expect(card.textContent).toContain('v1.0.0');
    fireEvent.click(screen.getByTestId('pack-open-binary'));
    expect(onOpenCourse).toHaveBeenCalledWith('binary');
  });

  it('asks for confirmation before uninstalling', () => {
    const requestUninstall = vi.fn();
    const confirmUninstall = vi.fn();
    renderView({ packs: [installedPack()], requestUninstall, confirmUninstall });

    fireEvent.click(screen.getByTestId('pack-uninstall-fixture-pack'));
    expect(requestUninstall).toHaveBeenCalledWith('fixture-pack');
  });

  it('confirms an uninstall only after the second click', () => {
    const confirmUninstall = vi.fn();
    const cancelUninstall = vi.fn();
    renderView({ packs: [installedPack()], pendingUninstall: 'fixture-pack', confirmUninstall, cancelUninstall });

    fireEvent.click(screen.getByTestId('pack-uninstall-yes-fixture-pack'));
    expect(confirmUninstall).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('pack-uninstall-no-fixture-pack'));
    expect(cancelUninstall).toHaveBeenCalledTimes(1);
  });

  it('reports a successful install', () => {
    renderView({ result: { kind: 'installed', packName: { zh: '样例知识包', en: 'Fixture pack' } } });
    expect(screen.getByTestId('pack-result').textContent).toContain('样例知识包');
  });
});
