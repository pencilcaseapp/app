import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { theme } from './theme';

function readColorTokens(css: string) {
  const tokens = [...css.matchAll(/(--color-pca-[a-z0-9-]+):\s*([^;]+);/g)];

  return Object.fromEntries(
    tokens.map(([, name, value]) => [name, value.trim().toUpperCase()]),
  );
}

describe('theme', () => {
  it('mirrors the pca colours from app.css', () => {
    const appCss = readColorTokens(readFileSync('app/app.css', 'utf8'));
    const emailCss = readColorTokens(theme);

    expect(emailCss).toEqual(appCss);
  });
});
