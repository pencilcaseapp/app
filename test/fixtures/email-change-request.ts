import { faker } from '@faker-js/faker';
import type { EmailChangeRequest } from '~/repos/email-change-request';
import { getCanonicalEmail } from '~/utils/email';
import { userFixture } from './user';

faker.seed(43);

const email = faker.internet.email().toLowerCase();

export const emailChangeRequestFixture: EmailChangeRequest = {
  id: faker.string.uuid(),
  userId: userFixture.id,
  email,
  canonicalEmail: getCanonicalEmail(email),
  codeHash: faker.string.alphanumeric(64),
  attempts: 0,
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
  expiresAt: faker.date.future(),
  usedAt: null,
};
