import { defineConfig } from 'drizzle-kit';
import { getConfig } from './app/config';

const config = getConfig();

export default defineConfig({
  out: './drizzle',
  schema: './app/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.db.url,
  },
});
