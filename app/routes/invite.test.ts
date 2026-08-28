import { href, RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';

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

const redeemInviteCodeMock = vi.fn();
vi.mock('~/services/subscription', () => ({
  redeemInviteCode: (...args: unknown[]) => redeemInviteCodeMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('redeems the code from the url and redirects to the startpage',
  async () => {
    const context = new RouterContextProvider();
    context.set(userSessionContext, userFixture);

    await renderRoute('/invite/:code', {
      params: { code: 'super-secret' },
      context,
    });

    expect(redeemInviteCodeMock)
      .toHaveBeenCalledWith(userFixture, 'super-secret');
    expect(redirectMock).toHaveBeenCalledWith(href('/'));
  });
