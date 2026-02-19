import { Hocuspocus } from '@hocuspocus/server';
import type { Application } from 'express-ws';
import { Database } from '@hocuspocus/extension-database';
import { db } from '~/db';
import { documents } from '~/db/schema';
import { eq, sql } from 'drizzle-orm/sql';

const hocuspocus = new Hocuspocus({
  name: 'hocuspocus-01',
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const document = await db.query.documents.findFirst({
          where: {
            id: documentName,
          },
        });
        return document?.content ?? null;
      },
      store: async ({ documentName, state }) => {
        await db.update(documents)
          .set({ content: state, updatedAt: sql`NOW()` })
          .where(eq(documents.id, documentName));
      },
    }),
  ],
});

export function createLiveServer(app: Application) {
  app.ws('/live', (websocket, request) => {
    hocuspocus.handleConnection(websocket, request);
  });
}
