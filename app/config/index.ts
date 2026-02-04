import { getConfigDev } from './dev';
import { getConfigProd } from './prod';

export interface Config {
  environment: 'development' | 'prod';

  server: {
    port: number;
    host: string;
  };

  socket: {
    url: string | undefined;
    enableCors: boolean;
  };
}

export function getConfig(): Config {
  switch (process.env.ENV) {
    case 'development': {
      return getConfigDev();
    }

    case 'prod': {
      return getConfigProd();
    }

    default: {
      return getConfigDev();
    }
  }
}
