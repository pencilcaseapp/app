import type { Config } from '.';
import env from 'env-var';

export function getConfigDev(): Config {
  return {
    environment: 'development',

    instanceId: `local-${process.pid}`,

    appUrl: 'http://localhost:3000',
    websiteUrl: 'http://localhost:5173',

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

    storage: {
      endpoint: 'http://localhost:9090',
      region: 'us-east-1',
      bucket: 'pencil-case-dev',
      accessKeyId: 's3mock',
      secretAccessKey: 's3mock',
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

    // Creem's sandbox. The API key is never checked in: put it in `.env`.
    creem: {
      apiUrl: 'https://test-api.creem.io',
      apiKey: env
        .get('CREEM_API_KEY')
        .default('creem_test_apikey')
        .asString(),
      productId: 'prod_Fzsxoj5uDsJeUHJif9JSg',
      webhookSecret: env
        .get('CREEM_WEBHOOK_SECRET')
        .default('whsec-dev')
        .asString(),
    },

    testAccounts: {
      code: '000000',
      emails: [],
      domains: ['pencilcase.test'],
    },

    session: {
      secure: false,
      secret: 's3cr3t',
    },
  };
}
