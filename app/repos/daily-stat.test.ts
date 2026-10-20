import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDailyStat, getUtcDate, incrementDailyStat } from './daily-stat';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getUtcDate', () => {
  it('returns the UTC day, whatever the local time zone', () => {
    expect(getUtcDate(new Date('2000-01-01T23:30:00-02:00')))
      .toBe('2000-01-02');
  });
});

describe('incrementDailyStat', () => {
  it('creates the row of the day on its first event', async () => {
    vi.setSystemTime(new Date('2000-02-01T00:00:00Z'));

    await incrementDailyStat('documentsCreated');

    expect(await getDailyStat('2000-02-01')).toStrictEqual({
      date: '2000-02-01',
      accountsCreated: 0,
      accountsDeleted: 0,
      documentsCreated: 1,
      documentsDeleted: 0,
    });
  });

  it('adds to the counter of the same day', async () => {
    vi.setSystemTime(new Date('2000-02-02T08:00:00Z'));
    await incrementDailyStat('accountsDeleted');
    vi.setSystemTime(new Date('2000-02-02T23:59:59Z'));
    await incrementDailyStat('accountsDeleted', 2);
    await incrementDailyStat('accountsCreated');

    expect(await getDailyStat('2000-02-02')).toMatchObject({
      accountsCreated: 1,
      accountsDeleted: 3,
    });
  });

  it('starts a new row on the next UTC day', async () => {
    vi.setSystemTime(new Date('2000-02-03T23:59:59Z'));
    await incrementDailyStat('documentsDeleted');
    vi.setSystemTime(new Date('2000-02-04T00:00:00Z'));
    await incrementDailyStat('documentsDeleted');

    expect(await getDailyStat('2000-02-03'))
      .toMatchObject({ documentsDeleted: 1 });
    expect(await getDailyStat('2000-02-04'))
      .toMatchObject({ documentsDeleted: 1 });
  });

  it('writes nothing when there is nothing to count', async () => {
    vi.setSystemTime(new Date('2000-02-05T12:00:00Z'));

    await incrementDailyStat('documentsDeleted', 0);

    expect(await getDailyStat('2000-02-05')).toBeUndefined();
  });
});
