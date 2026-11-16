import { describe, expect, it } from 'vitest';
import { isMonacoEnabled, toMonacoLanguage } from './loader';

describe('Monaco loader helpers', () => {
  it('maps teaching languages to Monaco language ids', () => {
    expect(toMonacoLanguage('python')).toBe('python');
    expect(toMonacoLanguage('js')).toBe('javascript');
  });

  it('disables Monaco in the test environment (textarea fallback path)', () => {
    expect(isMonacoEnabled()).toBe(false);
  });
});
