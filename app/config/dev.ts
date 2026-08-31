import type { Config } from '.';
import env from 'env-var';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    instanceId: `local-${process.pid}`,

    appUrl: 'http://localhost:3000',

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

    invite: {
      code: 'super-secret',
    },

    creem: {
      apiUrl: env
        .get('CREEM_API_URL')
        .default('https://test-api.creem.io')
        .asString(),
      // The placeholder is enough for the fake Creem the e2e tests run;
      // talking to the real test store needs the key from the dashboard
      // in `.env` (see docs/subscriptions.md).
      apiKey: env
        .get('CREEM_API_KEY')
        .default('creem_test_apikey')
        .asString(),
      productId: env
        .get('CREEM_PRODUCT_ID')
        .default('prod_Fzsxoj5uDsJeUHJif9JSg')
        .asString(),
      webhookSecret: env
        .get('CREEM_WEBHOOK_SECRET')
        .default('whsec-dev')
        .asString(),
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
