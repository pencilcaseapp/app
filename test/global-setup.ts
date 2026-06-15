import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '~/db';
import { sql } from 'drizzle-orm';

export async function setup() {
  console.log('🧱 Setting up test database …');
  await resetDatabase();
  await migrate(db, { migrationsFolder: './drizzle' });
}

async function resetDatabase() {
  // Get all tables
  const { rows: tables } = await db.execute(sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);

  // Drop all tables
  if (tables.length > 0) {
    const tableNames = tables
      .map(t => `"public"."${t.tablename}"`)
      .join(', ');
    await db.execute(sql`DROP TABLE IF EXISTS ${sql.raw(tableNames)} CASCADE`);
  }

  // Drop enums
  const { rows: enums } = await db.execute<{
    typname: string;
  }>(
    sql`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e';
  `);

  for (const { typname } of enums) {
    await db.execute(sql`DROP TYPE IF EXISTS "public"."${sql.raw(typname)}" CASCADE`);
  }

  // Clean up __drizzle_migrations table
  await db.execute(sql`DROP TABLE IF EXISTS "drizzle"."__drizzle_migrations" CASCADE`);
}
