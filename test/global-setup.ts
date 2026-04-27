import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { reset } from 'drizzle-seed';
import * as schema from '~/db/schema';
import { db } from '~/db';

export async function setup() {
  console.log('🧱 Setting up test database …');
  await migrate(db, { migrationsFolder: './drizzle' });
  await reset(db, schema);
  await migrate(db, { migrationsFolder: './drizzle' });
}
