import type { Config } from '.';

export function getConfigTest(): Config {
  return {
    environment: 'test',

    server: {
      port: 3000,
      host: 'localhost',
    },

    db: {
      url: 'postgresql://postgres:postgres@localhost:5434/db',
    },

    email: {
      from: {
        name: 'pencil case',
        email: 'inbox@pencilcase.app',
      },
    },

    csrf: {
      secret: 's3cr3t',
    },

    session: {
      secure: false,
      secret: 's3cr3t',
    },
  };
}
