import { pgTable, timestamp, uuid, text, bytea } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid().primaryKey().defaultRandom(),
  title: text(),
  content: bytea(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
