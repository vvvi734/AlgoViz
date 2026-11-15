import { describe, expect, it } from 'vitest';
import { MESSAGES, translate } from './messages';

describe('i18n dictionaries', () => {
  it('has the same keys in Chinese and English', () => {
    const zh = Object.keys(MESSAGES.zh).sort();
    const en = Object.keys(MESSAGES.en).sort();
    expect(en).toEqual(zh);
  });

  it('has no empty strings', () => {
    for (const dictionary of Object.values(MESSAGES)) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), key).not.toBe('');
      }
    }
  });

  it('covers all three theme modes', () => {
    for (const key of ['themeLabel', 'themeLight', 'themeDark', 'themeSystem', 'themeHint']) {
      expect(MESSAGES.zh[key]).toBeTruthy();
      expect(MESSAGES.en[key]).toBeTruthy();
    }
  });

  it('does not claim to be a vanilla HTML prototype in the footer', () => {
    expect(MESSAGES.zh.footer).toContain('React');
    expect(MESSAGES.en.footer).toContain('React');
  });

  it('falls back to Chinese, then to the key itself', () => {
    expect(translate('en', 'play')).toBe('▶ Play');
    expect(translate('zh', 'play')).toBe('▶ 播放');
    expect(translate('en', 'missing.key')).toBe('missing.key');
  });
});
