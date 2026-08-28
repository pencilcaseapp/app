import { getConfig } from '~/config';
import { updateUser, type User } from '~/repos/user';

const config = getConfig();

/**
 * Grants the pro features to a user coming in through an invite link. One
 * shared code stands in for the paid subscription until it exists, so a
 * wrong code is not an error — the caller sends them on either way.
 */
export async function redeemInviteCode(user: User, code: string) {
  if (code !== config.invite.code || user.hasSubscription) {
    return;
  }

  await updateUser(user.id, { hasSubscription: true });
}
