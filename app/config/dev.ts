import type { Config } from '.';
import env from 'env-var';

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

    email: {
      apiToken: env.get('EMAIL_API_TOKEN').asString(),
      from: {
        name: 'pencil case',
        email: 'inbox@pencilcase.app',
      },
    },

    csrf: {
      secret: 's3cr3t',
    },
  };
}
