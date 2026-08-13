import { faker } from '@faker-js/faker';
import type { Document } from '~/repos/document';

faker.seed(42);

export const documentFixture: Document = {
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  content: null,
  shared: false,
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
  userId: faker.string.uuid(),
};
