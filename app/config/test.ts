import type { Config } from '.';
import env from 'env-var';

export function getConfigTest(): Config {
  return {
    environment: 'test',

    server: {
      port: 3000,
      host: 'localhost',
    },

    db: {
      url: env.get('DATABASE_URL').default('postgresql://postgres:postgres@localhost:5434/db').asString(),
    },

    ws: {
      url: 'http://localhost:3003/live',
    },
  };
}
