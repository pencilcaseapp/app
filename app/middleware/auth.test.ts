import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware } from './auth';
import { userSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';

const getAuthenticatedUserMock = vi.fn();
vi.mock('~/services/auth', async () => {
  const actual = await vi.importActual<typeof import('~/services/auth')>('~/services/auth');
  return {
    ...actual,
    getAuthenticatedUser: (...args: unknown[]) =>
      getAuthenticatedUserMock(...args),
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
    getAuthenticatedUserMock.mockResolvedValueOnce(null);
    const request = new Request('http://localhost/doc/123?foo=bar');
    const context = {
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
    getAuthenticatedUserMock.mockResolvedValueOnce(userFixture);
    const request = new Request('http://localhost/doc');
    const context = {
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
