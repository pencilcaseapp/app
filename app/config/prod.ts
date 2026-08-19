import type { Config } from '.';
import env from 'env-var';
import { instanceId } from './instance';

export function getConfigProd(): Config {
  return {
    environment: 'prod',

    instanceId,

    server: {
      port: env.get('PORT').required().asIntPositive(),
      host: env.get('HOST').required().asString(),
    },

    db: {
      url: env.get('DATABASE_URL').required().asString(),
    },

    redis: {
      host: env.get('REDIS_HOST').required().asString(),
      port: env.get('REDIS_PORT').required().asPortNumber(),
      password: env.get('REDIS_PASSWORD').asString(),
      tls: env.get('REDIS_TLS').default('false').asBool(),
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

    session: {
      secure: true,
      secret: env.get('SESSION_SECRET').required().asString(),
      domain: 'pencilcase.app',
    },
  };
}
