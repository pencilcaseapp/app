import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PULL_TO_REFRESH_THRESHOLD,
  PullToRefresh,
} from './pull-to-refresh';

const setStandalone = (value: boolean | undefined) => {
  Object.defineProperty(navigator, 'standalone', {
    value,
    configurable: true,
  });
};

const pull = (scrollY: number) => {
  act(() => {
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [] }));
  });
  Object.defineProperty(window, 'scrollY', {
    value: scrollY,
    configurable: true,
  });
  act(() => {
    vi.advanceTimersToNextFrame();
  });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
});

afterEach(() => {
  vi.useRealTimers();
  setStandalone(undefined);
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

describe('PullToRefresh', () => {
  it('shows the wheel while the installed app on iOS is pulled', () => {
    setStandalone(true);
    render(<PullToRefresh />);

    pull(-PULL_TO_REFRESH_THRESHOLD / 2);

    expect(screen.getByRole('status', { name: 'loading' }))
      .toBeInTheDocument();
  });

  it('stays out of the way in a browser', () => {
    render(<PullToRefresh />);

    pull(-PULL_TO_REFRESH_THRESHOLD / 2);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
