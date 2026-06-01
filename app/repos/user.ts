import { db } from '~/db';

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: {
      email,
    },
  });
}
