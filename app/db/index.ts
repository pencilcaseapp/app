import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from './relations';
import { getConfig } from '~/config';

const config = getConfig();

export const db = drizzle(config.db.url, {
  relations,
});
