import { describe, expect, it } from 'vitest';
import { hrefWithTrailingSlash } from './href';

describe('hrefWithTrailingSlash', () => {
  it('appends a trailing slash to the href', () => {
    expect(hrefWithTrailingSlash('/legal-notice')).toBe('/legal-notice/');
  });
});
