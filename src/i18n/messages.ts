import { LEGACY_MESSAGES } from './messages.generated';
import type { Lang, MessageDictionary } from './types';

/** Strings added by the v0.2 refactor and the Stage-1 trace/sync work. */
const EXTRA: MessageDictionary = {
  zh: {
    themeLabel: '主题',
    themeLight: '☀ 亮色',
    themeDark: '☾ 深色',
    themeSystem: '⌘ 跟随系统',
    themeHint: '跟随系统会读取操作系统外观，并在系统切换时实时更新。',
    footer: 'AlgoLens · React + TypeScript + Vite · Python 与 JavaScript 算法在浏览器本地运行，无服务器',
    syncPanel: '同步观察',
    codePosition: '代码位置',
    variablesWatch: '变量观察',
    stepExplanation: '步骤说明',
    noLocation: '当前步骤未提供源码定位信息',
    noVariables: '当前演示未提供变量追踪',
    noMessage: '无步骤说明',
    codeChanged: '代码已修改，行高亮基于上次运行的源码快照；请重新运行以更新。',
    noCode: '请运行代码以查看源码位置',
    runSamples: '运行并查看输出',
    markDone: '标记完成',
    unmarkDone: '取消完成',
    name: '名称',
    type: '类型',
    value: '值',
    scope: '作用域',
    saveSaved: '已保存',
    saveSaving: '保存中…',
    saveError: '保存失败',
    saveDirty: '未保存修改',
    confirmRestore: '确认恢复？',
    noEditorLocation: '当前算法未提供代码位置追踪',
    editorLoading: '编辑器加载中…',
    editorFallback: '编辑器加载失败，已回退为纯文本输入',
  },
  en: {
    themeLabel: 'Theme',
    themeLight: '☀ Light',
    themeDark: '☾ Dark',
    themeSystem: '⌘ System',
    themeHint: 'System follows your OS appearance and reacts to changes live.',
    footer: 'AlgoLens · React + TypeScript + Vite · Python and JavaScript algorithms run locally in the browser, no server',
    syncPanel: 'Sync view',
    codePosition: 'Code position',
    variablesWatch: 'Variables',
    stepExplanation: 'Step explanation',
    noLocation: 'No source location for this step',
    noVariables: 'No variable tracking for this demo',
    noMessage: 'No step description',
    codeChanged: 'Code edited; highlighting uses the last run snapshot. Re-run to refresh.',
    noCode: 'Run the code to see its source position',
    runSamples: 'Run & inspect output',
    markDone: 'Mark done',
    unmarkDone: 'Unmark',
    name: 'Name',
    type: 'Type',
    value: 'Value',
    scope: 'Scope',
    saveSaved: 'Saved',
    saveSaving: 'Saving…',
    saveError: 'Save failed',
    saveDirty: 'Unsaved changes',
    confirmRestore: 'Confirm restore?',
    noEditorLocation: 'No code-position tracking for this demo',
    editorLoading: 'Loading editor…',
    editorFallback: 'Editor failed to load; fell back to plain text',
  },
};

export const MESSAGES: MessageDictionary = {
  zh: { ...LEGACY_MESSAGES.zh, ...EXTRA.zh },
  en: { ...LEGACY_MESSAGES.en, ...EXTRA.en },
};

export function translate(lang: Lang, key: string): string {
  return MESSAGES[lang][key] ?? MESSAGES.zh[key] ?? key;
}
