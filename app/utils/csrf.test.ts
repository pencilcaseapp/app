import { describe, expect, it, vi } from 'vitest';

// `test/setup.ts` stubs out `csrf.validate` for every other suite, so pull in
// the unmocked module to exercise the real signing and verification.
const { commitCsrfToken, cookie, csrf }
  = await vi.importActual<typeof import('./csrf')>('./csrf');

function requestWithCookie(cookieHeader?: string) {
  const request = new Request('http://localhost/');

  // happy-dom drops `cookie` when it is passed to the Request constructor.
  if (cookieHeader) {
    request.headers.set('cookie', cookieHeader);
  }

  return request;
}

function cookieHeaderFrom(setCookieHeader: string) {
  return setCookieHeader.split(';')[0];
}

async function submit(token: string, cookieHeader: string) {
  const formData = new FormData();
  formData.set('csrf', token);

  return csrf.validate(formData, new Headers({ cookie: cookieHeader }));
}

describe('commitCsrfToken', () => {
  it('issues a token when the request has no cookie', async () => {
    const [token, setCookieHeader] = await commitCsrfToken(
      requestWithCookie(),
    );

    expect(token).not.toBe('');
    expect(setCookieHeader).toContain('csrf=');
    await expect(submit(token, cookieHeaderFrom(setCookieHeader!)))
      .resolves.toBeUndefined();
  });

  it('keeps a token the server still accepts', async () => {
    const [token, setCookieHeader] = await commitCsrfToken(
      requestWithCookie(),
    );

    const [nextToken, nextSetCookieHeader] = await commitCsrfToken(
      requestWithCookie(cookieHeaderFrom(setCookieHeader!)),
    );

    expect(nextToken).toBe(token);
    expect(nextSetCookieHeader).toBeNull();
  });

  it('replaces an empty cookie instead of handing it back', async () => {
    const [token, setCookieHeader] = await commitCsrfToken(
      requestWithCookie('csrf='),
    );

    expect(token).not.toBe('');
    expect(setCookieHeader).not.toBeNull();
    await expect(submit(token, cookieHeaderFrom(setCookieHeader!)))
      .resolves.toBeUndefined();
  });

  it('replaces an unsigned token in the cookie', async () => {
    const setCookieHeader = await cookie.serialize('not-a-signed-token');

    const [token, nextSetCookieHeader] = await commitCsrfToken(
      requestWithCookie(cookieHeaderFrom(setCookieHeader)),
    );

    expect(token).not.toBe('not-a-signed-token');
    await expect(submit(token, cookieHeaderFrom(nextSetCookieHeader!)))
      .resolves.toBeUndefined();
  });
});
