import { LEGACY_MESSAGES } from './messages.generated';
import type { Lang, MessageDictionary } from './types';

/** Strings added by the v0.2 refactor (three-state theme + corrected footer). */
const EXTRA: MessageDictionary = {
  zh: {
    themeLabel: '主题',
    themeLight: '☀ 亮色',
    themeDark: '☾ 深色',
    themeSystem: '⌘ 跟随系统',
    themeHint: '跟随系统会读取操作系统外观，并在系统切换时实时更新。',
    footer: 'AlgoLens · React + TypeScript + Vite · 动画与练习本地运行；AI、C/C++ 执行服务需自行部署',
  },
  en: {
    themeLabel: 'Theme',
    themeLight: '☀ Light',
    themeDark: '☾ Dark',
    themeSystem: '⌘ System',
    themeHint: 'System follows your OS appearance and reacts to changes live.',
    footer: 'AlgoLens · React + TypeScript + Vite · animations and practice run locally; AI and C/C++ runners must be deployed separately',
  },
};

export const MESSAGES: MessageDictionary = {
  zh: { ...LEGACY_MESSAGES.zh, ...EXTRA.zh },
  en: { ...LEGACY_MESSAGES.en, ...EXTRA.en },
};

export function translate(lang: Lang, key: string): string {
  return MESSAGES[lang][key] ?? MESSAGES.zh[key] ?? key;
}
