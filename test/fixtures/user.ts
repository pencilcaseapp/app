import type { User } from '~/repos/user';
import { faker } from '@faker-js/faker';

export const userFixture: User = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  newsletter: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
};
