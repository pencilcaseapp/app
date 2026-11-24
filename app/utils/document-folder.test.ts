import { describe, expect, it } from 'vitest';
import { getFolderSearchParam } from './document-folder';

describe('getFolderSearchParam', () => {
  it('reads the folder a URL names', () => {
    expect(getFolderSearchParam('http://localhost/doc/a?folder=shared'))
      .toBe('shared');
    expect(getFolderSearchParam('http://localhost/doc/a?folder=deleted'))
      .toBe('deleted');
  });

  it('ignores a missing or unknown folder', () => {
    expect(getFolderSearchParam('http://localhost/doc/a')).toBeUndefined();
    expect(getFolderSearchParam('http://localhost/doc/a?folder=trash'))
      .toBeUndefined();
  });
});
