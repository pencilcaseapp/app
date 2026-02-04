import type { Config } from '.';
import env from 'env-var';

export function getConfigProd(): Config {
  return {
    environment: 'prod',

    server: {
      port: env.get('PORT').required().asIntPositive(),
      host: env.get('HOST').required().asString(),
    },

    socket: {
      url: 'pencilcase.app',
      enableCors: false,
    },
  };
}
