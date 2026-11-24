import { beforeEach, describe, expect, it } from 'vitest';
import { keepFolderMiddleware } from './folder';

function navigate(from: string, to: string, method = 'GET') {
  window.history.replaceState(null, '', from);
  const request = new Request(`http://localhost${to}`, { method });

  return () => keepFolderMiddleware(
    { request } as never,
    undefined as never,
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('keepFolderMiddleware', () => {
  it('takes the folder of the tab along to the next page', () => {
    const middleware = navigate(
      '/doc/a?folder=shared',
      '/doc/b/settings/account?tab=1',
    );

    let response: unknown;
    try {
      middleware();
    }
    catch (error) {
      response = error;
    }

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).headers.get('location'))
      .toBe('/doc/b/settings/account?tab=1&folder=shared');
  });

  it('leaves a page that names a folder alone', () => {
    expect(navigate('/doc/a?folder=shared', '/doc/a?folder=all')())
      .toBeUndefined();
  });

  it('leaves the page alone when the tab names no folder', () => {
    expect(navigate('/doc/a', '/doc/b')()).toBeUndefined();
    expect(navigate('/doc/a?folder=nope', '/doc/b')()).toBeUndefined();
  });

  it('leaves submissions alone', () => {
    expect(navigate('/doc/a?folder=deleted', '/doc/a', 'POST')())
      .toBeUndefined();
  });
});
