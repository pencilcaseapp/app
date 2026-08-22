import { describe, it, expect } from 'vitest';
import { getCanonicalEmail, normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  John.Smith@Example.COM '))
      .toBe('john.smith@example.com');
  });
});

describe('getCanonicalEmail', () => {
  it('lowercases the address', () => {
    expect(getCanonicalEmail('John@Example.com')).toBe('john@example.com');
  });

  it('strips +tags for every domain', () => {
    expect(getCanonicalEmail('john+promo@example.com'))
      .toBe('john@example.com');
  });

  it('keeps dots for regular domains', () => {
    expect(getCanonicalEmail('john.smith@example.com'))
      .toBe('john.smith@example.com');
  });

  it('strips dots for gmail', () => {
    expect(getCanonicalEmail('J.o.h.n.S.m.i.t.h.847@gmail.com'))
      .toBe('johnsmith847@gmail.com');
    expect(getCanonicalEmail('j.ohn@googlemail.com'))
      .toBe('john@googlemail.com');
  });

  it('collapses gmail dot and tag variants into one value', () => {
    expect(getCanonicalEmail('jo.hn+a@gmail.com'))
      .toBe(getCanonicalEmail('j.o.h.n@GMAIL.com'));
  });

  it('leaves a value without an @ alone', () => {
    expect(getCanonicalEmail('not-an-email')).toBe('not-an-email');
  });
});
