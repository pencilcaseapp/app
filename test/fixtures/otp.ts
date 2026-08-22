import { faker } from '@faker-js/faker';
import type { Otp } from '~/repos/otp';
import { getCanonicalEmail } from '~/utils/email';

faker.seed(42);

const id = faker.string.uuid();
const email = faker.internet.email();

export const otpFixture: Otp = {
  id,
  email,
  canonicalEmail: getCanonicalEmail(email),
  codeHash: faker.string.alphanumeric(64),
  userId: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
  expiresAt: faker.date.future(),
  usedAt: null,
};
