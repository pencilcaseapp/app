import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollToTopOn } from './use-scroll-to-top-on';

const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

const renderScrollToTopOn = (trigger: boolean) =>
  renderHook(
    ({ trigger }: { trigger: boolean }) => useScrollToTopOn(trigger),
    { initialProps: { trigger } },
  );

afterEach(() => {
  scrollTo.mockClear();
});

describe('useScrollToTopOn', () => {
  it('scrolls to the top when the trigger turns true', () => {
    const { rerender } = renderScrollToTopOn(false);

    rerender({ trigger: true });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('does not scroll while the trigger stays put', () => {
    const { rerender } = renderScrollToTopOn(false);

    rerender({ trigger: false });
    rerender({ trigger: true });
    rerender({ trigger: true });

    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('does not scroll on mount or when the trigger turns false', () => {
    const { rerender } = renderScrollToTopOn(true);

    rerender({ trigger: false });

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
