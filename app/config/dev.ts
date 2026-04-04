import type { Config } from '.';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    server: {
      port: 3000,
      host: 'localhost',
    },

    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/db',
    },
  };
}
