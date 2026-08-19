import { getConfigDev } from './dev';
import { getConfigProd } from './prod';
import { getConfigTest } from './test';

export interface Config {
  environment: 'development' | 'test' | 'prod';

  /** Unique per process, see `app/config/instance.ts`. */
  instanceId: string;

  server: {
    port: number;
    host: string;
  };

  db: {
    url: string;
  };

  /**
   * Left out when the live server runs on its own: without it the process
   * neither propagates document updates nor sees the other instances, which
   * is what the test environment and a single scaler want.
   */
  redis?: {
    host: string;
    port: number;
    password?: string;
    tls: boolean;
  };

  email: {
    apiToken?: string;
    from: {
      name: string;
      email: string;
    };
  };

  csrf: {
    secret: string;
  };

  session: {
    secure: boolean;
    secret: string;
    domain?: string;
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
      return getConfigTest();
    }
  }
}
