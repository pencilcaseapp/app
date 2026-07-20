import { describe, it, expect } from 'vitest';
import { createUser, createUserSession, getOrCreateUserByEmail, getUser, getUserByEmail, getUserBySessionTokenHash, updateUser } from './user';
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

describe('getUserBySessionTokenHash', () => {
  it('returns a user by session token hash', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createValidUserSession(userFixture.id);
    const user = await getUserBySessionTokenHash(sessionFixture.tokenHash);

    expect(user).toStrictEqual(userFixture);
  });

  it('returns undefined if no session is found', async () => {
    const user = await getUserBySessionTokenHash('non-existent-token-hash');

    expect(user).toBeUndefined();
  });

  it('returns undefined if session is expired', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createExpiredUserSession(userFixture.id);

    const user = await getUserBySessionTokenHash(sessionFixture.tokenHash);

    expect(user).toBeUndefined();
  });
});
