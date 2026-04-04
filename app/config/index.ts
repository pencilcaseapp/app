import { getConfigDev } from './dev';
import { getConfigProd } from './prod';
import { getConfigTest } from './test';

export interface Config {
  environment: 'development' | 'test' | 'prod';

  server: {
    port: number;
    host: string;
  };

  db: {
    url: string;
  };
}

export function getConfig(): Config {
  switch (process.env.ENV) {
    case 'development': {
      return getConfigDev();
    }

    case 'test': {
      return getConfigTest();
    }

    case 'prod': {
      return getConfigProd();
    }

    default: {
      return getConfigDev();
    }
  }
}
