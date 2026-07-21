import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware, sessionMiddleware } from './auth';
import { optionalUserSessionContext, sessionCookieHeaderContext, userSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';

const getAuthSessionMock = vi.fn();
vi.mock('~/services/auth', async () => {
  const actual = await vi.importActual<typeof import('~/services/auth')>('~/services/auth');
  return {
    ...actual,
    getAuthSession: (...args: unknown[]) =>
      getAuthSessionMock(...args),
  };
});

const redirectMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authMiddleware', () => {
  it('redirects to signin when no authenticated user exists', async () => {
    const request = new Request('http://localhost/doc/123?foo=bar');
    const context = {
      get: vi.fn(() => null),
      set: vi.fn(),
    };

    await expect(
      authMiddleware({ request, context } as never, undefined as never),
    ).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });

    expect(redirectMock).toHaveBeenCalledWith('/signin?returnUrl=%2Fdoc%2F123%3Ffoo%3Dbar');
    expect(context.set).not.toHaveBeenCalled();
  });

  it('stores the authenticated user in context', async () => {
    const request = new Request('http://localhost/doc');
    const context = {
      get: vi.fn(() => userFixture),
      set: vi.fn(),
    };

    await authMiddleware(
      { request, context } as never, undefined as never,
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(context.set).toHaveBeenCalledWith(
      userSessionContext, userFixture,
    );
  });
});

describe('sessionMiddleware', () => {
  it('stores null user and no session cookie when unauthenticated', async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    const context = {
      set: vi.fn(),
    };

    await sessionMiddleware({
      request: new Request('http://localhost/doc'),
      context,
    } as never, undefined as never);

    expect(context.set).toHaveBeenCalledWith(optionalUserSessionContext, null);
    expect(context.set).toHaveBeenCalledWith(sessionCookieHeaderContext, null);
  });

  it('stores optional user and refreshed session cookie', async () => {
    getAuthSessionMock.mockResolvedValueOnce({
      user: userFixture,
      cookieHeader: 'session=updated-cookie',
    });
    const context = {
      set: vi.fn(),
    };

    await sessionMiddleware({
      request: new Request('http://localhost/doc'),
      context,
    } as never, undefined as never);

    expect(context.set).toHaveBeenCalledWith(optionalUserSessionContext, userFixture);
    expect(context.set).toHaveBeenCalledWith(sessionCookieHeaderContext, 'session=updated-cookie');
  });
});
