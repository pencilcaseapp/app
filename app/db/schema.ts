import { sql } from 'drizzle-orm';
import { pgTable, boolean, integer, timestamp, uuid, text, bytea, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull(),
  newsletter: boolean('newsletter').default(false),
  onboarded: boolean('onboarded').default(false),
  hasSubscription: boolean('has_subscription').notNull().default(false),
  creemCustomerId: text('creem_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('users_email_idx').on(table.email),
  uniqueIndex('users_creem_customer_id_idx').on(table.creemCustomerId),
]);

export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  canonicalEmail: text('canonical_email').notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull().default(sql`(CURRENT_TIMESTAMP + INTERVAL '15 minutes')`),
  usedAt: timestamp('used_at'),
  userId: uuid('user_id').references(() => users.id),
}, table => [
  index('otps_user_id_idx').on(table.userId),
  index('otps_canonical_email_idx').on(table.canonicalEmail),
  index('otps_expires_at_idx').on(table.expiresAt),
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

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  creemSubscriptionId: text('creem_subscription_id').notNull(),
  creemCustomerId: text('creem_customer_id').notNull(),
  creemProductId: text('creem_product_id').notNull(),
  status: text('status').notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  priceAmount: integer('price_amount'),
  priceCurrency: text('price_currency'),
  billingPeriod: text('billing_period'),
  // Creem's own updated_at; webhooks can arrive out of order and a stale
  // event must not overwrite a newer state (see repos/subscription.ts).
  creemUpdatedAt: timestamp('creem_updated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('subscriptions_creem_subscription_id_idx')
    .on(table.creemSubscriptionId),
  index('subscriptions_user_id_idx').on(table.userId),
]);

// Every received webhook event, keyed by Creem's event id so a redelivery
// is detected, with the raw payload kept for debugging and replay.
export const creemWebhookEvents = pgTable('creem_webhook_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});

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
