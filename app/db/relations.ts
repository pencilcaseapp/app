import * as schema from './schema';
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations(schema, r => ({
  users: {
    otps: r.many.otps(),
    documents: r.many.documents(),
    sessions: r.many.sessions(),
    documentCollaborators: r.many.documentCollaborators(),
    subscriptions: r.many.subscriptions(),
  },
  subscriptions: {
    user: r.one.users({
      from: r.subscriptions.userId,
      to: r.users.id,
      optional: false,
    }),
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
    collaborators: r.many.documentCollaborators(),
  },
  documentCollaborators: {
    document: r.one.documents({
      from: r.documentCollaborators.documentId,
      to: r.documents.id,
      optional: false,
    }),
    user: r.one.users({
      from: r.documentCollaborators.userId,
      to: r.users.id,
      optional: false,
    }),
  },
}));
