import { describe, it, expect } from 'vitest';
import { withSearchParams } from './url';

describe('withSearchParams', () => {
  it('returns the path with search params', () => {
    const path = '/path';
    const searchParams = { key: 'value' };

    expect(withSearchParams(path, searchParams)).toBe('/path?key=value');
  });
});
