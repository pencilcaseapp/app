import express from 'express';
import expressWebsockets from 'express-ws';
import compression from 'compression';
import { createRequestHandler } from '@react-router/express';
import { createLiveServer } from '~/live';
import { getConfig } from '~/config';

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

app.listen(config.server.port, config.server.host, () => {
  console.log(`App listening on http://${config.server.host}:${config.server.port}`);
});
