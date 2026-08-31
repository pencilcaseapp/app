import { getConfigDev } from './dev';
import { getConfigProd } from './prod';
import { getConfigTest } from './test';

export interface Config {
  environment: 'development' | 'test' | 'prod';

  /** Unique per process — the live servers tell each other apart by it. */
  instanceId: string;

  /**
   * Where the app is reachable from the outside, without a trailing slash.
   * Only for links that leave the request/response cycle (emails); routes
   * build absolute URLs from the incoming request instead.
   */
  appUrl: string;

  server: {
    port: number;
    host: string;
  };

  db: {
    url: string;
  };

  live: {
    /**
     * Left out when the live server runs on its own: without it the process
     * neither propagates document updates nor sees the other instances, which
     * is what the test environment and a single instance want. Scoped to the
     * live server because the next thing wanting a Redis does not have to
     * share this one.
     */
    redis?: {
      host: string;
      port: number;
      password?: string;
      tls: boolean;
    };
  };

  jobs: {
    /**
     * The same Redis server as the live fan-out, configured separately so
     * the two can be split later. Left out when background jobs are off
     * entirely, which is what the test environment wants. BullMQ keeps its
     * keys under its own prefix, so sharing the server is safe.
     */
    redis?: {
      host: string;
      port: number;
      password?: string;
      tls: boolean;
    };
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

  invite: {
    /**
     * Redeeming `/invite/:code` with this code hands a signed in user the pro
     * features. One shared code, handed out to friends by hand until the
     * paid subscription exists.
     */
    code: string;
  };

  /**
   * The merchant of record selling the pro subscription. Test mode and live
   * mode are separate Creem environments with their own API hosts, keys and
   * webhook secrets, so all four values switch together. See
   * docs/subscriptions.md.
   */
  creem: {
    apiUrl: string;
    apiKey: string;
    /** The pro subscription product, created in the Creem dashboard. */
    productId: string;
    /** Signs incoming webhooks; from the dashboard's Developers page. */
    webhookSecret: string;
  };

  /**
   * Enables the `/e2e/auth` endpoint the Playwright tests use to sign in
   * without the OTP flow. Left out in prod; staging sets it once it exists.
   */
  e2e?: {
    apiToken: string;
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
