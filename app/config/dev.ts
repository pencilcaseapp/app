import type { Config } from '.';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    server: {
      port: 3000,
      host: 'localhost',
    },

    socket: {
      url: 'http://localhost:3003',
      enableCors: true,
    },
  };
}
