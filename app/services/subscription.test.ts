// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redeemInviteCode } from './subscription';
import { userFixture } from '~/test/fixtures/user';

const updateUserMock = vi.fn();
vi.mock('~/repos/user', () => ({
  updateUser: (...args: unknown[]) => updateUserMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('redeemInviteCode', () => {
  it('gives the user a subscription for a valid code', async () => {
    await redeemInviteCode(userFixture, 'super-secret');

    expect(updateUserMock).toHaveBeenCalledWith(userFixture.id, {
      hasSubscription: true,
    });
  });

  it('does nothing for an invalid code', async () => {
    await redeemInviteCode(userFixture, 'not-the-code');

    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('does nothing when the user already has a subscription', async () => {
    await redeemInviteCode(
      { ...userFixture, hasSubscription: true },
      'super-secret',
    );

    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
