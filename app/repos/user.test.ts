import { describe, it, expect } from 'vitest';
import { createUser, getUser, getUserByEmail, updateUser } from './user';
import { createUserFixture } from '~/test/fixtures/user';
import { faker } from '@faker-js/faker';

describe('createUser', () => {
  it('creates a user', async () => {
    const userInput = {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      newsletter: faker.datatype.boolean(),
    };

    const user = await createUser(userInput);

    expect(user).toStrictEqual({
      id: expect.any(String),
      email: user.email,
      name: user.name,
      newsletter: user.newsletter,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});

describe('getUser', () => {
  it('returns a user', async () => {
    const userFixture = await createUserFixture();
    const user = await getUser(userFixture.id);

    expect(user).toStrictEqual(userFixture);
  });

  it('returns undefined if user does not exist', async () => {
    const user = await getUser(faker.string.uuid());

    expect(user).toBeUndefined();
  });
});

describe('getUserByEmail', () => {
  it('returns a user by email', async () => {
    const userFixture = await createUserFixture();
    const user = await getUserByEmail(userFixture.email);

    expect(user).toStrictEqual(userFixture);
  });

  it('returns undefined if user does not exist', async () => {
    const user = await getUserByEmail('nonexistent@example.com');

    expect(user).toBeUndefined();
  });
});

describe('updateUser', () => {
  it('updates single fields of a user', async () => {
    const userFixture = await createUserFixture();

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
