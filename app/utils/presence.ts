import type { StatesArray } from '@hocuspocus/provider';
import { ANONYMOUS_NAMES, PRESENCE_COLORS } from '~/constants/presence';

export interface Collaborator {
  /** The person behind the connection: a user id, or a guest id. */
  id: string;
  name: string;
  color: string;
}

/**
 * What we add to the awareness state Lexical writes, so a connection can be
 * traced back to the person it belongs to. Lexical keeps it under
 * `awarenessData` and carries it through every update of its own fields.
 */
export interface PresenceAwarenessData {
  presenceId: string;
}

export interface PresenceUser {
  id: string;
  name: string | null;
  email: string;
}

/**
 * FNV-1a. Any stable hash does, as long as it gives the same answer on the
 * server and in every browser, so somebody rejoining a document is recognised
 * by the same name and colour as before.
 */
function hash(value: string): number {
  let result = 2166136261;

  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }

  return result >>> 0;
}

function pick<T>(values: readonly T[], key: string): T {
  return values[hash(key) % values.length];
}

export function getPresenceColor(key: string): string {
  return pick(PRESENCE_COLORS, `color:${key}`);
}

export function getAnonymousName(key: string): string {
  return pick(ANONYMOUS_NAMES, `name:${key}`);
}

export function getUserPresenceIdentity(user: PresenceUser): Collaborator {
  return {
    id: user.id,
    name: user.name?.trim() || user.email,
    color: getPresenceColor(user.id),
  };
}

export function getGuestPresenceIdentity(guestId: string): Collaborator {
  return {
    id: guestId,
    name: getAnonymousName(guestId),
    color: getPresenceColor(guestId),
  };
}

/**
 * The other people in the document, read from the awareness states the
 * Hocuspocus server broadcasts. Lexical writes `name` and `color` there for
 * the remote cursors, which is the same identity the avatars show.
 *
 * One entry per person, not per connection, so somebody's second tab does not
 * show up twice. That is keyed on the presence id rather than the name: two
 * guests who happen to draw the same animal are still two collaborators. The
 * name is the fallback for a connection that predates the presence id.
 */
export function getRemoteCollaborators(
  states: StatesArray,
  localClientId: number,
): Collaborator[] {
  const collaborators = new Map<string, Collaborator>();

  for (const state of states) {
    const { clientId, name, color, awarenessData } = state;

    if (
      clientId === localClientId
      || typeof name !== 'string'
      || typeof color !== 'string'
    ) {
      continue;
    }

    const presenceId = awarenessData?.presenceId;
    const id = typeof presenceId === 'string' ? presenceId : name;

    if (!collaborators.has(id)) {
      collaborators.set(id, { id, name, color });
    }
  }

  return [...collaborators.values()];
}
