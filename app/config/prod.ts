import type { Config } from '.';
import env from 'env-var';

export function getConfigProd(): Config {
  return {
    environment: 'prod',

    server: {
      port: env.get('PORT').required().asIntPositive(),
      host: env.get('HOST').required().asString(),
    },

    db: {
      url: env.get('DATABASE_URL').required().asString(),
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
