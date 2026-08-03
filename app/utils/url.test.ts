import { describe, it, expect } from 'vitest';
import { getNormalizedReturnUrl, withSearchParams } from './url';
import { href } from 'react-router';

describe('withSearchParams', () => {
  it('returns the path with search params', () => {
    const path = '/path';
    const searchParams = { key: 'value' };

    expect(withSearchParams(path, searchParams)).toBe('/path?key=value');
  });
});

describe('getNormalizedReturnUrl', () => {
  it('returns a safe relative path unchanged', () => {
    expect(getNormalizedReturnUrl('/doc/123')).toBe('/doc/123');
  });

  it('falls back to startpage for unsafe values', () => {
    expect(getNormalizedReturnUrl('//evil.com')).toBe(href('/'));
    expect(getNormalizedReturnUrl('https://evil.com')).toBe(href('/'));
    expect(getNormalizedReturnUrl('javascript:alert(1)')).toBe(href('/'));
    expect(getNormalizedReturnUrl()).toBe(href('/'));
  });
});
