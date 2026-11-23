import { expect, test } from 'vitest';
import { formatDate, formatLongDate, parseDateParam, toDateParam } from './date';

const date = new Date('2026-07-06T22:30:00Z');

function requestWithLanguage(acceptLanguage?: string) {
  return new Request('http://localhost/', {
    headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : {},
  });
}

test('formats the date in the language the browser prefers', () => {
  expect(formatDate(date, requestWithLanguage('de-DE,de;q=0.9,en;q=0.8')))
    .toBe('06.07.2026');
  expect(formatDate(date, requestWithLanguage('en-US,en;q=0.9')))
    .toBe('07/06/2026');
});

test('falls back to the default format without a usable language', () => {
  expect(formatDate(date, requestWithLanguage())).toMatch(/2026/);
  expect(formatDate(date, requestWithLanguage('*'))).toMatch(/2026/);
});

test('writes a date out in full', () => {
  expect(formatLongDate(new Date('2026-12-23T22:00:00Z')))
    .toBe('23 December 2026');
});

test('hands a date over in a URL and reads it back', () => {
  const date = new Date('2026-12-23T15:30:00Z');

  expect(toDateParam(date)).toBe('2026-12-23');
  expect(parseDateParam('2026-12-23'))
    .toEqual(new Date('2026-12-23T00:00:00Z'));
  expect(parseDateParam('2026-13-45')).toBeUndefined();
  expect(parseDateParam('23.12.2026')).toBeUndefined();
  expect(parseDateParam(undefined)).toBeUndefined();
});
