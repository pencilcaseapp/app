import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { theme } from './theme';

function readColorTokens(css: string) {
  const tokens = [...css.matchAll(/(--color-pca-[a-z0-9-]+):\s*([^;]+);/g)];

  return Object.fromEntries(
    tokens.map(([, name, value]) => [name, toHex(value.trim())]),
  );
}

// Email clients do not understand oklch(), so the email theme repeats the
// palette as hex. Both are compared in hex so the values can still be checked
// against each other.
function toHex(value: string) {
  const match = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/);

  if (!match) {
    return value.toUpperCase();
  }

  const [lightness, chroma, hue] = match.slice(1).map(Number);
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return `#${linear.map(toChannel).join('')}`.toUpperCase();
}

function toChannel(linear: number) {
  const clamped = Math.min(1, Math.max(0, linear));
  const srgb = clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * clamped ** (1 / 2.4) - 0.055;

  return Math.round(srgb * 255).toString(16).padStart(2, '0');
}

describe('theme', () => {
  it('mirrors the pca colours from app.css', () => {
    const appCss = readColorTokens(readFileSync('app/app.css', 'utf8'));
    const emailCss = readColorTokens(theme);

    expect(emailCss).toEqual(appCss);
  });
});
