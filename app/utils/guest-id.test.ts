import { beforeEach, describe, expect, it } from 'vitest';
import { GUEST_ID_STORAGE_KEY } from '~/constants/presence';
import { getGuestId } from './guest-id';

describe('getGuestId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return the same id on every call', () => {
    expect(getGuestId()).toBe(getGuestId());
  });

  it('should keep the id in local storage', () => {
    const guestId = getGuestId();

    expect(localStorage.getItem(GUEST_ID_STORAGE_KEY)).toBe(guestId);
  });

  it('should reuse an id stored by an earlier visit', () => {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, 'stored-guest-id');

    expect(getGuestId()).toBe('stored-guest-id');
  });
});
