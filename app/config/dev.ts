import type { Config } from '.';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    server: {
      port: 3000,
      host: '192.168.2.69',
    },

    db: {
      url: 'postgresql://postgres:postgres@192.168.2.69:5433/db',
    },

    ws: {
      url: 'http://192.168.2.69:3003/live',
    },
  };
}
