import { expect, test } from 'vitest';
import { formatDate } from './date';

test('formats a date as day.month.year', () => {
  expect(formatDate(new Date('2026-07-06T22:30:00Z'))).toBe('06.07.2026');
});
