import express from 'express';
import expressWebsockets from 'express-ws';
import compression from 'compression';
import { createRequestHandler } from '@react-router/express';
import { internalIpV4 } from 'internal-ip';
import { createLiveServer } from '~/live';
import { getConfig } from '~/config';
import { migrateDatabase } from '~/db/migrate';

const { app } = expressWebsockets(express());
const config = getConfig();

app.use(compression());
app.disable('x-powered-by');

if (config.environment === 'prod') {
  createLiveServer(app);
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

  app.ws('/live', async (websocket, request) => {
    const { hocuspocus } = await viteDevServer.ssrLoadModule('./app/live/index.ts');
    hocuspocus.handleConnection(websocket, request);
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

  app.listen(config.server.port, config.server.host, () => {
    console.log(`🚀 App listening on http://localhost:${config.server.port}`);
    console.log(`🛜 Address on your network http://${host}:${config.server.port}`);
  });
}

startServer();
