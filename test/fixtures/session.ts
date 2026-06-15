import { faker } from '@faker-js/faker';
import type { Session } from '~/repos/session';

faker.seed(42);

export const sessionFixture: Session = {
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  tokenHash: faker.string.alphanumeric(64),
  createdAt: faker.date.past(),
  expiresAt: faker.date.future(),
  userAgent: 'test-agent',
};
