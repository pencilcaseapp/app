import { beforeEach, describe, expect, it, vi } from 'vitest';
import { href } from 'react-router';
import { requireAuthMiddleware } from './auth';
import { requiredUserSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';

const getAuthenticatedUserMock = vi.fn();
vi.mock('~/services/auth', async () => ({
  getAuthenticatedUser: (...args: unknown[]) =>
    getAuthenticatedUserMock(...args),
}));

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

describe('requireAuthMiddleware', () => {
  it('redirects to signin when no authenticated user exists', async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce(null);
    const request = new Request('http://localhost/doc');
    const context = {
      set: vi.fn(),
    };

    await expect(
      requireAuthMiddleware({ request, context } as never, undefined as never),
    ).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });

    expect(redirectMock).toHaveBeenCalledWith(href('/signin'));
    expect(context.set).not.toHaveBeenCalled();
  });

  it('stores the authenticated user in context', async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce(userFixture);
    const request = new Request('http://localhost/doc');
    const context = {
      set: vi.fn(),
    };

    await requireAuthMiddleware(
      { request, context } as never, undefined as never,
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(context.set).toHaveBeenCalledWith(
      requiredUserSessionContext, userFixture,
    );
  });
});
