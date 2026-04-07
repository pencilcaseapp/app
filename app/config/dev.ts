import type { Config } from '.';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/db',
    },
  };
}
