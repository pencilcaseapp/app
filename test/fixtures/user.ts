import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { users } from '~/db/schema';

export async function createUserFixture() {
  const response = await db.insert(users).values({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    newsletter: faker.datatype.boolean(),
  }).returning();

  return response[0];
}
