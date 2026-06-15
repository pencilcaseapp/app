import * as schema from './schema';
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations(schema, r => ({
  users: {
    otps: r.many.otps(),
    documents: r.many.documents(),
    sessions: r.many.sessions(),
  },
  otps: {
    user: r.one.users({
      from: r.otps.userId,
      to: r.users.id,
      optional: false,
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
      optional: false,
    }),
  },
  documents: {
    user: r.one.users({
      from: r.documents.userId,
      to: r.users.id,
    }),
  },
}));
