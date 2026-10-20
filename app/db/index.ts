import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from './relations';
import { getConfig } from '~/config';

const config = getConfig();

export const db = drizzle(config.db.url, {
  relations,
});

export type Transaction
  = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Executor = typeof db | Transaction;

export function transaction<T>(run: (tx: Transaction) => Promise<T>) {
  return db.transaction(run);
}
