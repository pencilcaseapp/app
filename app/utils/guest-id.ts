import { GUEST_ID_STORAGE_KEY } from '~/constants/presence';

let fallbackGuestId: string | null = null;

/**
 * A stable identifier for a signed out visitor, so they keep the same
 * presence name and colour every time they rejoin a document.
 */
export function getGuestId(): string {
  try {
    const storedGuestId = localStorage.getItem(GUEST_ID_STORAGE_KEY);

    if (storedGuestId) {
      return storedGuestId;
    }

    const guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);

    return guestId;
  }
  catch {
    // Private browsing can make localStorage throw. The visitor then keeps
    // their identity for as long as the tab lives.
    fallbackGuestId ??= crypto.randomUUID();

    return fallbackGuestId;
  }
}
