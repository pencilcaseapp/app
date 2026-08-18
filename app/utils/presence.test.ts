import { describe, expect, it } from 'vitest';
import { ANONYMOUS_NAMES, PRESENCE_COLORS } from '~/constants/presence';
import {
  getAnonymousName,
  getGuestPresenceIdentity,
  getPresenceColor,
  getRemoteCollaborators,
  getUserPresenceIdentity,
} from './presence';

const user = {
  id: '3f3f0c3e-6c1a-4a1b-9a4c-6a1f4a9d1b2c',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

describe('getPresenceColor', () => {
  it('should pick a colour from the palette', () => {
    expect(PRESENCE_COLORS).toContain(getPresenceColor(user.id));
  });

  it('should give the same key the same colour every time', () => {
    expect(getPresenceColor(user.id)).toBe(getPresenceColor(user.id));
  });

  it('should spread different keys over the palette', () => {
    const colors = new Set(
      Array.from({ length: 200 }, (_, i) => getPresenceColor(`key-${i}`)),
    );

    expect(colors.size).toBe(PRESENCE_COLORS.length);
  });
});

describe('getAnonymousName', () => {
  it('should pick a name from the list', () => {
    expect(ANONYMOUS_NAMES).toContain(getAnonymousName('guest-1'));
  });

  it('should give the same guest the same name every time', () => {
    expect(getAnonymousName('guest-1')).toBe(getAnonymousName('guest-1'));
  });

  it('should spread different guests over the list', () => {
    const names = new Set(
      Array.from({ length: 500 }, (_, i) => getAnonymousName(`guest-${i}`)),
    );

    expect(names.size).toBe(ANONYMOUS_NAMES.length);
  });
});

describe('getUserPresenceIdentity', () => {
  it('should use the name of the user', () => {
    expect(getUserPresenceIdentity(user).name).toBe('Ada Lovelace');
  });

  it('should fall back to the email when there is no name', () => {
    expect(getUserPresenceIdentity({ ...user, name: null }).name)
      .toBe('ada@example.com');
  });

  it('should fall back to the email when the name is blank', () => {
    expect(getUserPresenceIdentity({ ...user, name: '   ' }).name)
      .toBe('ada@example.com');
  });

  it('should trim the name', () => {
    expect(getUserPresenceIdentity({ ...user, name: ' Ada ' }).name)
      .toBe('Ada');
  });

  it('should keep the colour of a returning user', () => {
    expect(getUserPresenceIdentity(user).color)
      .toBe(getUserPresenceIdentity({ ...user, name: 'Ada L.' }).color);
  });
});

describe('getGuestPresenceIdentity', () => {
  it('should keep name and colour of a returning guest', () => {
    expect(getGuestPresenceIdentity('guest-1'))
      .toEqual(getGuestPresenceIdentity('guest-1'));
  });

  it('should give a guest a name and a colour', () => {
    const identity = getGuestPresenceIdentity('guest-1');

    expect(ANONYMOUS_NAMES).toContain(identity.name);
    expect(PRESENCE_COLORS).toContain(identity.color);
  });
});

describe('getRemoteCollaborators', () => {
  const states = [
    { clientId: 1, name: 'Ada', color: '#2563EB' },
    { clientId: 2, name: 'Grace', color: '#DB2777' },
    { clientId: 3, name: 'Alan', color: '#15803D' },
  ];

  it('should leave the local connection out', () => {
    expect(getRemoteCollaborators(states, 1)).toEqual([
      { name: 'Grace', color: '#DB2777' },
      { name: 'Alan', color: '#15803D' },
    ]);
  });

  it('should keep everybody when the local client is not in the states',
    () => {
      expect(getRemoteCollaborators(states, 99)).toHaveLength(3);
    });

  it('should collapse the several tabs of the same person', () => {
    const withSecondTab = [
      ...states,
      { clientId: 4, name: 'Grace', color: '#DB2777' },
    ];

    expect(getRemoteCollaborators(withSecondTab, 1)).toEqual([
      { name: 'Grace', color: '#DB2777' },
      { name: 'Alan', color: '#15803D' },
    ]);
  });

  it('should skip connections that have no identity yet', () => {
    const connecting = [
      ...states,
      { clientId: 4 },
      { clientId: 5, name: 'Bob' },
    ];

    expect(getRemoteCollaborators(connecting, 1)).toHaveLength(2);
  });
});
