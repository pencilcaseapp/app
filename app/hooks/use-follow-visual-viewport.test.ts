import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFollowVisualViewport } from './use-follow-visual-viewport';

const viewport = new EventTarget() as VisualViewport;

const moveViewport = (offsetTop: number) =>
  act(() => {
    Object.defineProperty(viewport, 'offsetTop', {
      value: offsetTop,
      configurable: true,
    });
    viewport.dispatchEvent(new Event('scroll'));
  });

const settle = () => act(() => vi.advanceTimersByTime(250));

const renderFollow = (element: HTMLElement, enabled = true) =>
  renderHook(
    ({ enabled }) => useFollowVisualViewport({ current: element }, enabled),
    { initialProps: { enabled } },
  );

describe('useFollowVisualViewport', () => {
  let element: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement('header');
    Object.defineProperty(window, 'visualViewport', {
      value: viewport,
      configurable: true,
    });
    Object.defineProperty(viewport, 'offsetTop', {
      value: 0,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows up at the top of the screen once iOS has moved it', () => {
    renderFollow(element);
    moveViewport(282);

    expect(element.style.opacity).toBe('0');

    settle();

    expect(element.style.transform).toBe('translateY(282px)');
    expect(element.style.opacity).toBe('');
  });

  it('fades out while a finger scrolls what is on screen', () => {
    renderFollow(element);
    moveViewport(282);
    settle();

    act(() => {
      window.dispatchEvent(new Event('touchstart'));
    });
    moveViewport(272);

    expect(element.style.opacity).toBe('0');
    expect(element.style.transform).toBe('translateY(282px)');

    act(() => {
      window.dispatchEvent(new Event('touchend'));
    });
    settle();

    expect(element.style.opacity).toBe('');
    expect(element.style.transform).toBe('translateY(272px)');
  });

  it('follows a single step straight away', () => {
    renderFollow(element);
    moveViewport(282);
    settle();

    moveViewport(326);

    expect(element.style.opacity).toBe('');
    expect(element.style.transform).toBe('translateY(326px)');
  });

  it('stays in sight while the page itself scrolls', () => {
    renderFollow(element);
    moveViewport(282);
    settle();

    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });

    expect(element.style.opacity).toBe('');
  });

  it('lets go when the keyboard is gone', () => {
    const { rerender } = renderFollow(element);
    moveViewport(282);
    settle();

    rerender({ enabled: false });

    expect(element.style.transform).toBe('');
    expect(element.style.opacity).toBe('');
  });

  it('leaves the element alone while the keyboard is closed', () => {
    renderFollow(element, false);
    moveViewport(282);
    settle();

    expect(element.style.transform).toBe('');
  });
});
