import { faker } from '@faker-js/faker';
import type { Otp } from '~/repos/otp';

faker.seed(42);

export const otpFixture: Otp = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  codeHash: faker.string.alphanumeric(64),
  userId: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
  expiresAt: faker.date.future(),
  usedAt: null,
};
