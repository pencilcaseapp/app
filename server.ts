import express from 'express';
import compression from 'compression';
import { createRequestHandler } from '@react-router/express';
import { internalIpV4 } from 'internal-ip';
import { getConfig } from '~/config';
import { migrateDatabase } from '~/db/migrate';
import { createServer } from 'node:http';

import 'dotenv/config';

const app = express();
const server = createServer(app);
const config = getConfig();

app.use(compression());
app.disable('x-powered-by');
app.enable('trust proxy');

let stopLiveServer = async () => {};

if (config.environment === 'prod') {
  const live = await import('~/live');

  live.createLiveServer(server);
  stopLiveServer = live.stopLiveServer;

  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' }),
  );
  app.use(express.static('build/client', { maxAge: '1h' }));
  app.use(
    createRequestHandler({
      build: await import('./build/server/index.js' as string),
    }),
  );
}
else {
  const viteDevServer = await import('vite').then(vite =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );

  server.on('upgrade', async (request, socket, head) => {
    const { ws } = await viteDevServer.ssrLoadModule('./app/live/index.ts');
    ws.handleUpgrade(request, socket, head);
  });

  app.use(viteDevServer.middlewares);
  app.use(
    createRequestHandler({
      // @ts-expect-error virtual module
      build: () =>
        viteDevServer.ssrLoadModule(
          'virtual:react-router/server-build',
        ),
    }),
  );
}

async function startServer() {
  await migrateDatabase();

  const localIp = await internalIpV4();
  const host = localIp ?? config.server.host;

  server.listen(config.server.port, config.server.host, () => {
    console.log(`🚀 App listening on http://localhost:${config.server.port}`);
    console.log(`🛜 Address on your network http://${host}:${config.server.port}`);
  });
}

/**
 * An instance is stopped with `SIGTERM` on every deployment and scale down,
 * which is the only chance the live server gets to persist the documents it
 * still holds in memory.
 */
async function stopServer() {
  server.close();
  await stopLiveServer();
  process.exit(0);
}

process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

startServer();
