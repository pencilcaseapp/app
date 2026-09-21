import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useScrollEdgeFade } from './use-scroll-edge-fade';

/*
 * happy-dom reports zero for every layout property, so the element has to
 * carry the scroll geometry the hook reads.
 */
function scrollArea(
  { scrollTop, clientHeight, scrollHeight }: {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  },
) {
  const element = document.createElement('div');

  Object.defineProperties(element, {
    scrollTop: { value: scrollTop, writable: true },
    clientHeight: { value: clientHeight },
    scrollHeight: { value: scrollHeight },
  });

  return element;
}

const fades = (element: HTMLElement) => ({
  top: element.style.getPropertyValue('--fade-top'),
  bottom: element.style.getPropertyValue('--fade-bottom'),
});

describe('useScrollEdgeFade', () => {
  test('fades neither edge of content that does not scroll', () => {
    const element = scrollArea({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 400,
    });

    renderHook(() => useScrollEdgeFade({ current: element }, {
      top: true,
      bottom: true,
    }));

    expect(fades(element)).toEqual({ top: '0px', bottom: '0px' });
  });

  test('fades the bottom while there is content below', () => {
    const element = scrollArea({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 900,
    });

    renderHook(() => useScrollEdgeFade({ current: element }, {
      top: true,
      bottom: true,
    }));

    expect(fades(element)).toEqual({ top: '0px', bottom: '24px' });
  });

  test('fades both edges in the middle of the content', () => {
    const element = scrollArea({
      scrollTop: 200,
      clientHeight: 400,
      scrollHeight: 900,
    });

    renderHook(() => useScrollEdgeFade({ current: element }, {
      top: true,
      bottom: true,
    }));

    expect(fades(element)).toEqual({ top: '16px', bottom: '24px' });
  });

  test('drops the bottom fade at the end of the content', () => {
    const element = scrollArea({
      scrollTop: 500,
      clientHeight: 400,
      scrollHeight: 900,
    });

    renderHook(() => useScrollEdgeFade({ current: element }, {
      top: true,
      bottom: true,
    }));

    expect(fades(element)).toEqual({ top: '16px', bottom: '0px' });
  });

  test('leaves an edge alone when nothing sits against it', () => {
    const element = scrollArea({
      scrollTop: 200,
      clientHeight: 400,
      scrollHeight: 900,
    });

    renderHook(() => useScrollEdgeFade({ current: element }, {
      bottom: true,
    }));

    expect(fades(element)).toEqual({ top: '0px', bottom: '24px' });
  });

  test('follows the container as it is scrolled', () => {
    const element = scrollArea({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 900,
    });

    renderHook(() => useScrollEdgeFade({ current: element }, {
      top: true,
      bottom: true,
    }));

    element.scrollTop = 500;
    element.dispatchEvent(new Event('scroll'));

    expect(fades(element)).toEqual({ top: '16px', bottom: '0px' });
  });
});
