import type { User, UserSession } from '~/repos/user';
import { faker } from '@faker-js/faker';

faker.seed(42);

export const userFixture: User = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  newsletter: faker.datatype.boolean(),
  onboarded: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
};

export const userSessionFixture: UserSession = {
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  tokenHash: faker.string.alphanumeric(64),
  createdAt: faker.date.past(),
  expiresAt: faker.date.future(),
  userAgent: 'test-agent',
};
