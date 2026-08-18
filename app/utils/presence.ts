import type { StatesArray } from '@hocuspocus/provider';
import { ANONYMOUS_NAMES, PRESENCE_COLORS } from '~/constants/presence';

export interface Collaborator {
  name: string;
  color: string;
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
    name: user.name?.trim() || user.email,
    color: getPresenceColor(user.id),
  };
}

export function getGuestPresenceIdentity(guestId: string): Collaborator {
  return {
    name: getAnonymousName(guestId),
    color: getPresenceColor(guestId),
  };
}

/**
 * The other people in the document, read from the awareness states the
 * Hocuspocus server broadcasts. Lexical writes `name` and `color` there for
 * the remote cursors, which is the same identity the avatars show.
 *
 * Names are unique in the result: two tabs of the same person are one avatar,
 * and `name` stays usable as a render key.
 */
export function getRemoteCollaborators(
  states: StatesArray,
  localClientId: number,
): Collaborator[] {
  const collaborators = new Map<string, Collaborator>();

  for (const state of states) {
    const { clientId, name, color } = state;

    if (
      clientId === localClientId
      || typeof name !== 'string'
      || typeof color !== 'string'
      || collaborators.has(name)
    ) {
      continue;
    }

    collaborators.set(name, { name, color });
  }

  return [...collaborators.values()];
}
