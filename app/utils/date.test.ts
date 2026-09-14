import { expect, test } from 'vitest';
import { formatDate } from './date';

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
