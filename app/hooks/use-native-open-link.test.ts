import { renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useNativeOpenLink } from './use-native-open-link';

const navigateMock = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

test('navigates to the link the app hands over', () => {
  renderHook(() => useNativeOpenLink());

  expect(window.openNativeLink?.('/doc/abc?x=1#y')).toBe(true);
  expect(navigateMock).toHaveBeenCalledWith('/doc/abc?x=1#y');
});

test('lets the app load the link itself once unmounted', () => {
  const { unmount } = renderHook(() => useNativeOpenLink());

  unmount();

  expect(window.openNativeLink).toBeUndefined();
});
