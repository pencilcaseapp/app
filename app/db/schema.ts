import { sql } from 'drizzle-orm';
import { pgTable, boolean, timestamp, uuid, text, bytea, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull(),
  newsletter: boolean('newsletter').default(false),
  onboarded: boolean('onboarded').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('users_email_idx').on(table.email),
]);

export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull().default(sql`(CURRENT_TIMESTAMP + INTERVAL '15 minutes')`),
  usedAt: timestamp('used_at'),
  userId: uuid('user_id').notNull().references(() => users.id),
}, table => [
  index('otps_user_id_idx').on(table.userId),
  index('otps_email_idx').on(table.email),
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull().default(sql`(CURRENT_TIMESTAMP + INTERVAL '30 days')`),
  userId: uuid('user_id').notNull().references(() => users.id),
}, table => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  content: bytea('content'),
  shared: boolean('shared').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: uuid('user_id').notNull().references(() => users.id),
}, table => [
  index('documents_user_id_idx').on(table.userId),
]);

// Join table connecting users to documents shared with them. Kept
// intentionally lean for now (a plain membership row), but modelled as its
// own table so future share options — roles, explicit email invites — can be
// added as columns without reshaping the documents table.
export const documentCollaborators = pgTable('document_collaborators', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('document_collaborators_document_id_user_id_idx')
    .on(table.documentId, table.userId),
  index('document_collaborators_user_id_idx').on(table.userId),
  index('document_collaborators_document_id_idx').on(table.documentId),
]);
