import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { db } from '~/db';
import {
  createTestEmailChangeRequest,
  createExpiredEmailChangeRequest,
  createUsedEmailChangeRequest,
} from '~/test/data-factories/email-change-request';
import { createTestUser } from '~/test/data-factories/user';
import { getCanonicalEmail } from '~/utils/email';
import {
  canRequestEmailChange,
  createEmailChangeRequest,
  deleteEmailChangeRequestsExpiredBefore,
  expireAllValidEmailChangeRequests,
  expireEmailChangeRequest,
  getValidEmailChangeRequest,
  markEmailChangeRequestAsUsed,
  recordFailedEmailChangeRequestAttempt,
} from './email-change-request';

describe('createEmailChangeRequest', () => {
  it('creates a request that expires after fifteen minutes', async () => {
    const user = await createTestUser();
    const email = faker.internet.email().toLowerCase();

    const request = await createEmailChangeRequest({
      userId: user.id,
      email,
      canonicalEmail: getCanonicalEmail(email),
      codeHash: 'hashed-code',
    });

    expect(request).toStrictEqual({
      id: expect.any(String),
      userId: user.id,
      email,
      canonicalEmail: getCanonicalEmail(email),
      codeHash: 'hashed-code',
      attempts: 0,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      expiresAt: expect.any(Date),
      usedAt: null,
    });
    expect(request.expiresAt.getTime())
      .toBe(request.createdAt.getTime() + 15 * 60 * 1000);
  });
});

describe('getValidEmailChangeRequest', () => {
  it('returns a valid request', async () => {
    const user = await createTestUser();
    const request = await createTestEmailChangeRequest(user.id);

    expect(await getValidEmailChangeRequest(request.id))
      .toStrictEqual(request);
  });

  it('returns undefined for an expired request', async () => {
    const user = await createTestUser();
    const request = await createExpiredEmailChangeRequest(user.id);

    expect(await getValidEmailChangeRequest(request.id)).toBeUndefined();
  });

  it('returns undefined for a used request', async () => {
    const user = await createTestUser();
    const request = await createUsedEmailChangeRequest(user.id);

    expect(await getValidEmailChangeRequest(request.id)).toBeUndefined();
  });

  it('returns undefined for an invalid id', async () => {
    expect(await getValidEmailChangeRequest('invalid-id')).toBeUndefined();
  });
});

describe('expireEmailChangeRequest', () => {
  it('expires the request immediately', async () => {
    const user = await createTestUser();
    const request = await createTestEmailChangeRequest(user.id);

    const expired = await expireEmailChangeRequest(request.id);

    expect(expired.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(await getValidEmailChangeRequest(request.id)).toBeUndefined();
  });
});

describe('expireAllValidEmailChangeRequests', () => {
  it('expires the pending requests of the user only', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();
    const first = await createTestEmailChangeRequest(user.id);
    const second = await createTestEmailChangeRequest(user.id);
    const other = await createTestEmailChangeRequest(otherUser.id);

    await expireAllValidEmailChangeRequests(user.id);

    expect(await getValidEmailChangeRequest(first.id)).toBeUndefined();
    expect(await getValidEmailChangeRequest(second.id)).toBeUndefined();
    expect(await getValidEmailChangeRequest(other.id)).toStrictEqual(other);
  });
});

describe('recordFailedEmailChangeRequestAttempt', () => {
  it('increments the attempts', async () => {
    const user = await createTestUser();
    const request = await createTestEmailChangeRequest(user.id);

    await recordFailedEmailChangeRequestAttempt(request.id);
    const failed = await recordFailedEmailChangeRequestAttempt(request.id);

    expect(failed?.attempts).toBe(2);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await recordFailedEmailChangeRequestAttempt('invalid-id'))
      .toBeUndefined();
  });
});

describe('markEmailChangeRequestAsUsed', () => {
  it('stamps the request as used', async () => {
    const user = await createTestUser();
    const request = await createTestEmailChangeRequest(user.id);

    const used = await markEmailChangeRequestAsUsed(request.id);

    expect(used.usedAt).toEqual(expect.any(Date));
    expect(await getValidEmailChangeRequest(request.id)).toBeUndefined();
  });
});

describe('canRequestEmailChange', () => {
  it('allows up to three requests per user in fifteen minutes', async () => {
    const user = await createTestUser();
    const email = faker.internet.email().toLowerCase();

    for (let i = 0; i < 2; i++) {
      await createTestEmailChangeRequest(user.id);
    }
    expect(await canRequestEmailChange(user.id, getCanonicalEmail(email)))
      .toBe(true);

    await createTestEmailChangeRequest(user.id);
    expect(await canRequestEmailChange(user.id, getCanonicalEmail(email)))
      .toBe(false);
  });

  it('counts the requests of other users to the same mailbox', async () => {
    const user = await createTestUser();
    const email = faker.internet.email().toLowerCase();

    for (let i = 0; i < 3; i++) {
      const attacker = await createTestUser();
      await createTestEmailChangeRequest(attacker.id, { email });
    }

    expect(await canRequestEmailChange(user.id, getCanonicalEmail(email)))
      .toBe(false);
  });

  it('ignores requests older than fifteen minutes', async () => {
    const user = await createTestUser();
    const email = faker.internet.email().toLowerCase();

    for (let i = 0; i < 3; i++) {
      await createTestEmailChangeRequest(user.id, {
        createdAt: new Date(Date.now() - 16 * 60 * 1000),
      });
    }

    expect(await canRequestEmailChange(user.id, getCanonicalEmail(email)))
      .toBe(true);
  });
});

describe('deleteEmailChangeRequestsExpiredBefore', () => {
  it('deletes the requests that expired before the date', async () => {
    const user = await createTestUser();
    const old = await createExpiredEmailChangeRequest(
      user.id, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    );
    const recent = await createExpiredEmailChangeRequest(user.id);
    const valid = await createTestEmailChangeRequest(user.id);

    const deletedCount = await deleteEmailChangeRequestsExpiredBefore(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    const remaining = await db.query.emailChangeRequests.findMany({
      where: { userId: user.id },
    });

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(remaining.map(({ id }) => id).sort())
      .toEqual([recent.id, valid.id].sort());
    expect(remaining.map(({ id }) => id)).not.toContain(old.id);
  });
});
