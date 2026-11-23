import { describe, it, expect } from 'vitest';
import { createUser, createUserSession, deleteSessionsExpiredBefore, expireAllUserSessions, expireOtherUserSessions, expireUserSession, getOrCreateUserByEmail, getUser, getUserByCreemCustomerId, getUserByEmail, getAndRefreshUserSession, getUserIdsDeletedBefore, getUserSession, hardDeleteUser, lockUserDeletedBefore, markUserDeleted, restoreDeletedUser, updateUser } from './user';
import { db, transaction } from '~/db';
import { users } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { createExpiredUserSession, createTestUser, createValidUserSession } from '~/test/data-factories/user';
import { faker } from '@faker-js/faker';

describe('createUser', () => {
  it('creates a user', async () => {
    const userInput = {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      newsletter: faker.datatype.boolean(),
      onboarded: faker.datatype.boolean(),
    };

    const user = await createUser(userInput);

    expect(user).toStrictEqual({
      id: expect.any(String),
      email: user.email,
      name: user.name,
      newsletter: user.newsletter,
      onboarded: user.onboarded,
      hasSubscription: false,
      creemCustomerId: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
    });
  });
});

describe('getUser', () => {
  it('returns a user', async () => {
    const userFixture = await createTestUser();
    const user = await getUser(userFixture.id);

    expect(user).toStrictEqual(userFixture);
  });

  it('returns undefined if user does not exist', async () => {
    const user = await getUser(faker.string.uuid());

    expect(user).toBeUndefined();
  });

  it('returns undefined if id is invalid', async () => {
    const user = await getUser('invalid-id');

    expect(user).toBeUndefined();
  });
});

describe('getUserByEmail', () => {
  it('returns a user by email', async () => {
    const userFixture = await createTestUser();
    const user = await getUserByEmail(userFixture.email);

    expect(user).toStrictEqual(userFixture);
  });

  it('returns undefined if user does not exist', async () => {
    const user = await getUserByEmail('nonexistent@example.com');

    expect(user).toBeUndefined();
  });
});

describe('getOrCreateUserByEmail', () => {
  it('returns an existing user', async () => {
    const userFixture = await createTestUser();
    const result = await getOrCreateUserByEmail(userFixture.email);

    expect(result).toStrictEqual({ user: userFixture, created: false });
  });

  it('creates a new user if one does not exist', async () => {
    const email = faker.internet.email();
    const { user, created } = await getOrCreateUserByEmail(email);

    expect(created).toBe(true);
    expect(user).toStrictEqual({
      id: expect.any(String),
      email,
      name: null,
      newsletter: false,
      onboarded: false,
      hasSubscription: false,
      creemCustomerId: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
    });
  });
});

describe('updateUser', () => {
  it('updates single fields of a user', async () => {
    const userFixture = await createTestUser();

    const userInput = {
      email: faker.internet.email(),
    };

    const user = await updateUser(userFixture.id, userInput);

    expect(user).toStrictEqual({
      ...userFixture,
      email: user.email,
      updatedAt: expect.any(Date),
    });
  });
});

describe('getUserByCreemCustomerId', () => {
  it('returns the user holding the customer id', async () => {
    const userFixture = await createTestUser();
    const creemCustomerId = `cust_${faker.string.alphanumeric(21)}`;
    await updateUser(userFixture.id, { creemCustomerId });

    const user = await getUserByCreemCustomerId(creemCustomerId);

    expect(user?.id).toBe(userFixture.id);
  });

  it('returns undefined if no user holds the customer id', async () => {
    const user = await getUserByCreemCustomerId('cust_unknown');

    expect(user).toBeUndefined();
  });
});

describe('createUserSession', () => {
  it('creates a session', async () => {
    const userFixture = await createTestUser();
    const tokenHash = `hashed-code-${Date.now()}`;

    const session = await createUserSession({
      userId: userFixture.id,
      tokenHash,
      userAgent: 'test-agent',
    });

    expect(session).toStrictEqual({
      id: expect.any(String),
      userId: userFixture.id,
      tokenHash,
      userAgent: 'test-agent',
      createdAt: expect.any(Date),
      expiresAt: expect.any(Date),
    });
  });
});

describe('getAndRefreshUserSession', () => {
  it('returns a user session by token hash', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createValidUserSession(userFixture.id);
    const result = await getAndRefreshUserSession(sessionFixture.tokenHash);

    expect(result).toStrictEqual({
      session: {
        id: sessionFixture.id,
        userId: sessionFixture.userId,
        tokenHash: sessionFixture.tokenHash,
        userAgent: sessionFixture.userAgent,
        createdAt: sessionFixture.createdAt,
        expiresAt: expect.any(Date),
      },
      user: userFixture,
      isRefreshed: false,
    });
  });

  it('refreshes a session when it is within the refresh threshold', async () => {
    const userFixture = await createTestUser();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const sessionFixture = await createValidUserSession(
      userFixture.id,
      expiresAt,
    );

    const result = await getAndRefreshUserSession(sessionFixture.tokenHash);

    expect(result).toStrictEqual({
      session: {
        id: sessionFixture.id,
        userId: sessionFixture.userId,
        tokenHash: sessionFixture.tokenHash,
        userAgent: sessionFixture.userAgent,
        createdAt: sessionFixture.createdAt,
        expiresAt: expect.any(Date),
      },
      user: userFixture,
      isRefreshed: true,
    });

    expect(result?.session.expiresAt.getTime())
      .toBeGreaterThan(Date.now() + 89 * 24 * 60 * 60 * 1000);
  });

  it('returns null if no session is found', async () => {
    const result = await getAndRefreshUserSession('non-existent-token-hash');

    expect(result).toBeNull();
  });

  it('returns null if session is expired', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createExpiredUserSession(userFixture.id);

    const result = await getAndRefreshUserSession(sessionFixture.tokenHash);

    expect(result).toBeNull();
  });
});

describe('expireUserSession', () => {
  it('expires the session behind the token hash', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createValidUserSession(userFixture.id);

    const session = await expireUserSession(sessionFixture.tokenHash);

    expect(session?.expiresAt.getTime())
      .toBeLessThanOrEqual(Date.now());
    expect(await getAndRefreshUserSession(sessionFixture.tokenHash))
      .toBeNull();
  });

  it('returns undefined if no session matches', async () => {
    const session = await expireUserSession('non-existent-token-hash');

    expect(session).toBeUndefined();
  });
});

describe('expireOtherUserSessions', () => {
  it('expires every session of the user but the kept one', async () => {
    const userFixture = await createTestUser();
    const otherUser = await createTestUser();
    const kept = await createValidUserSession(userFixture.id);
    const other = await createValidUserSession(userFixture.id);
    const someoneElses = await createValidUserSession(otherUser.id);

    const expired
      = await expireOtherUserSessions(userFixture.id, kept.tokenHash);

    expect(expired.map(({ id }) => id)).toEqual([other.id]);
    expect(await getAndRefreshUserSession(other.tokenHash)).toBeNull();
    expect(await getAndRefreshUserSession(kept.tokenHash)).not.toBeNull();
    expect(await getAndRefreshUserSession(someoneElses.tokenHash))
      .not.toBeNull();
  });
});

// The cutoffs sit days in the past so these tests only ever see their own
// rows — other test files create sessions expiring around now, in parallel.
describe('deleteSessionsExpiredBefore', () => {
  const days = 24 * 60 * 60 * 1000;

  it('deletes sessions that expired before the given date', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createExpiredUserSession(
      userFixture.id,
      new Date(Date.now() - 10 * days),
    );

    const deletedCount = await deleteSessionsExpiredBefore(
      new Date(Date.now() - 5 * days),
    );

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(await getUserSession(sessionFixture.id)).toBeUndefined();
  });

  it('keeps sessions that expired after the given date', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createExpiredUserSession(
      userFixture.id,
      new Date(Date.now() - 6 * days),
    );

    await deleteSessionsExpiredBefore(new Date(Date.now() - 7 * days));

    expect(await getUserSession(sessionFixture.id))
      .toStrictEqual(sessionFixture);
  });
});

describe('markUserDeleted', () => {
  it('stamps the account deleted', async () => {
    const user = await createTestUser();

    const deletedAt = await markUserDeleted(user.id);

    expect(deletedAt).toBeInstanceOf(Date);
    expect((await getUser(user.id))?.deletedAt).toStrictEqual(deletedAt);
  });

  it('leaves an account deleted before alone', async () => {
    const user = await createTestUser();
    const first = await markUserDeleted(user.id);

    expect(await markUserDeleted(user.id)).toBeUndefined();
    expect((await getUser(user.id))?.deletedAt).toStrictEqual(first);
  });
});

describe('restoreDeletedUser', () => {
  it('clears the deletion', async () => {
    const user = await createTestUser();
    await markUserDeleted(user.id);

    expect(await restoreDeletedUser(user.id)).toBe(true);
    expect((await getUser(user.id))?.deletedAt).toBeNull();
  });

  it('says so when there was nothing to restore', async () => {
    const user = await createTestUser();

    expect(await restoreDeletedUser(user.id)).toBe(false);
  });
});

describe('getUserIdsDeletedBefore', () => {
  it('lists the accounts deleted before the date, oldest first', async () => {
    // Recent dates, so no purge running next to this test takes them.
    const now = Date.now();
    const before = new Date(now - 1000);
    const older = await createTestUser();
    const newer = await createTestUser();
    const recent = await createTestUser();
    await db.update(users).set({ deletedAt: new Date(now - 2000) })
      .where(eq(users.id, newer.id));
    await db.update(users).set({ deletedAt: new Date(now - 3000) })
      .where(eq(users.id, older.id));
    await db.update(users).set({ deletedAt: new Date(now) })
      .where(eq(users.id, recent.id));

    const ids = await getUserIdsDeletedBefore(before);

    expect(ids.indexOf(older.id)).toBeGreaterThan(-1);
    expect(ids.indexOf(older.id)).toBeLessThan(ids.indexOf(newer.id));
    expect(ids).not.toContain(recent.id);
  });
});

describe('lockUserDeletedBefore', () => {
  it('returns the account only while it is deleted before the date', async () => {
    const user = await createTestUser();
    const before = new Date();

    expect(await transaction(tx => lockUserDeletedBefore(user.id, before, tx)))
      .toBeUndefined();

    await db.update(users).set({ deletedAt: new Date(Date.now() - 1000) })
      .where(eq(users.id, user.id));

    expect(await transaction(tx => lockUserDeletedBefore(user.id, before, tx)))
      .toMatchObject({ id: user.id });
  });
});

describe('hardDeleteUser', () => {
  it('deletes the user and their sessions', async () => {
    const user = await createTestUser();
    const session = await createValidUserSession(user.id);

    expect(await hardDeleteUser(user.id)).toBe(true);
    expect(await getUser(user.id)).toBeUndefined();
    expect(await getUserSession(session.id)).toBeUndefined();
  });
});

describe('expireAllUserSessions', () => {
  it('expires every session of the user and nobody else\'s', async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const first = await createValidUserSession(user.id);
    const second = await createValidUserSession(user.id);
    const others = await createValidUserSession(other.id);

    const expired = await expireAllUserSessions(user.id);

    expect(expired.map(({ id }) => id).sort())
      .toStrictEqual([first.id, second.id].sort());
    expect((await getUserSession(others.id))!.expiresAt.getTime())
      .toBeGreaterThan(Date.now());
  });
});
