import { describe, it, expect, vi } from 'vitest';
import { sendAccountDeletedEmail } from './send-account-deleted-email';
import { sendAccountDeletedEmail as send } from '~/services/account';

vi.mock('~/services/account');

describe('sendAccountDeletedEmail', () => {
  it('sends the confirmation of the deletion it was queued for', async () => {
    await sendAccountDeletedEmail.run({
      userId: 'user-id',
      deletedAt: '2026-11-23T17:00:00.000Z',
    });

    expect(send).toHaveBeenCalledWith(
      'user-id',
      new Date('2026-11-23T17:00:00.000Z'),
    );
  });
});
