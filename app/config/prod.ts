import type { Config } from '.';
import env from 'env-var';

export function getConfigProd(): Config {
  return {
    environment: 'prod',

    instanceId: env
      .get('INSTANCE_ID')
      .default(`local-${process.pid}`)
      .asString(),

    appUrl: env
      .get('APP_URL')
      .default('https://docs.pencilcase.app')
      .asString(),

    server: {
      port: env.get('PORT').required().asIntPositive(),
      host: env.get('HOST').required().asString(),
    },

    db: {
      url: env.get('DATABASE_URL').required().asString(),
    },

    live: {
      redis: {
        host: env.get('REDIS_HOST').required().asString(),
        port: env.get('REDIS_PORT').required().asPortNumber(),
        password: env.get('REDIS_PASSWORD').asString(),
        tls: env.get('REDIS_TLS').default('false').asBool(),
      },
    },

    jobs: {
      redis: {
        host: env.get('REDIS_HOST').required().asString(),
        port: env.get('REDIS_PORT').required().asPortNumber(),
        password: env.get('REDIS_PASSWORD').asString(),
        tls: env.get('REDIS_TLS').default('false').asBool(),
      },
    },

    email: {
      apiToken: env.get('EMAIL_API_TOKEN').required().asString(),
      from: {
        name: 'pencil case',
        email: 'inbox@pencilcase.app',
      },
    },

    csrf: {
      secret: env.get('CSRF_SECRET').required().asString(),
    },

    invite: {
      code: env.get('INVITE_CODE').required().asString(),
    },

    creem: {
      apiUrl: env
        .get('CREEM_API_URL')
        .default('https://api.creem.io')
        .asString(),
      apiKey: env.get('CREEM_API_KEY').required().asString(),
      productId: env.get('CREEM_PRODUCT_ID').required().asString(),
      webhookSecret: env.get('CREEM_WEBHOOK_SECRET').required().asString(),
    },

    session: {
      secure: true,
      secret: env.get('SESSION_SECRET').required().asString(),
      domain: 'pencilcase.app',
    },
  };
}
