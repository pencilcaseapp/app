import { describe, it, expect } from 'vitest';
import { createUser, createUserSession, deleteSessionsExpiredBefore, getOrCreateUserByEmail, getUser, getUserByEmail, getAndRefreshUserSession, getUserSession, updateUser } from './user';
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
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
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
    const user = await getOrCreateUserByEmail(userFixture.email);

    expect(user).toStrictEqual(userFixture);
  });

  it('creates a new user if one does not exist', async () => {
    const email = faker.internet.email();
    const user = await getOrCreateUserByEmail(email);

    expect(user).toStrictEqual({
      id: expect.any(String),
      email,
      name: null,
      newsletter: false,
      onboarded: false,
      hasSubscription: false,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
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
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
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
      .toBeGreaterThan(expiresAt.getTime());
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
