import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate } from './messages';
import type { Lang } from './types';
import { safeGet, safeSet } from '../runtime/storage';

const LANG_STORAGE_KEY = 'algolens-lang';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  /** Inline bilingual helper used by prose that is not in the dictionary. */
  b: (zh: string, en: string) => string;
  pick: (pair: string[]) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLang(): Lang {
  return safeGet(LANG_STORAGE_KEY) === 'en' ? 'en' : 'zh';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    safeSet(LANG_STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    setLang,
    toggleLang: () => setLang(lang === 'zh' ? 'en' : 'zh'),
    t: (key: string) => translate(lang, key),
    b: (zh: string, en: string) => (lang === 'zh' ? zh : en),
    pick: (pair: string[]) => pair[lang === 'zh' ? 0 : 1] ?? pair[0] ?? '',
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
