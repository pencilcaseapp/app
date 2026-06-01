import { sql } from 'drizzle-orm';
import { pgTable, boolean, timestamp, uuid, text, bytea, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull(),
  newsletter: boolean('newsletter').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('email_idx').on(table.email),
]);

export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeHash: text('code_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull().default(sql`(CURRENT_TIMESTAMP + INTERVAL '15 minutes')`),
  userId: uuid('user_id').notNull().references(() => users.id),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  content: bytea('content'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: uuid('user_id').references(() => users.id),
}, table => [
  index('user_id_idx').on(table.userId),
]);
