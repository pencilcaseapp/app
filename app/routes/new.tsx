import { href, redirect } from 'react-router';
import { db } from '~/db';
import { documents } from '~/db/schema';

export async function loader() {
  const document = await db.insert(documents).values({}).returning();
  return redirect(href('/doc/:id', { id: document[0].id }));
}
