import type { Config } from '.';

export function getConfigTest(): Config {
  return {
    environment: 'test',

    instanceId: `local-${process.pid}`,

    server: {
      port: 3000,
      host: 'localhost',
    },

    db: {
      url: 'postgresql://postgres:postgres@localhost:5434/db',
    },

    live: {},

    jobs: {},

    email: {
      from: {
        name: 'pencil case',
        email: 'inbox@pencilcase.app',
      },
    },

    csrf: {
      secret: 's3cr3t',
    },

    e2e: {
      apiToken: 'e2e-t0k3n',
    },

    session: {
      secure: false,
      secret: 's3cr3t',
    },
  };
}
