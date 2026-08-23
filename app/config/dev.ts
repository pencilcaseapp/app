import type { Config } from '.';
import env from 'env-var';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    instanceId: `local-${process.pid}`,

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/db',
    },

    live: {
      redis: {
        host: 'localhost',
        port: 6380,
        tls: false,
      },
    },

    jobs: {
      redis: {
        host: 'localhost',
        port: 6380,
        tls: false,
      },
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

    e2e: {
      apiToken: env.get('E2E_API_TOKEN').default('e2e-t0k3n').asString(),
    },

    session: {
      secure: false,
      secret: 's3cr3t',
    },
  };
}
