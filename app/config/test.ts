import type { Config } from '.';

export function getConfigTest(): Config {
  return {
    environment: 'test',

    server: {
      port: 3000,
      host: 'localhost',
    },

    db: {
      url: 'postgresql://postgres:postgres@localhost:5434/db',
    },

    ws: {
      url: 'http://localhost:3003/live',
    },
  };
}
