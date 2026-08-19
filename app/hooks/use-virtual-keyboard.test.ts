import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVirtualKeyboard } from './use-virtual-keyboard';

const isTouchDevice = vi.hoisted(() => ({ value: true }));

vi.mock('react-use', () => ({
  useMedia: () => isTouchDevice.value,
}));

const VIEWPORT_HEIGHT = 800;

const viewport = new EventTarget() as VisualViewport;

const setViewportHeight = (height: number) =>
  act(() => {
    Object.defineProperty(viewport, 'height', {
      value: height,
      configurable: true,
    });
    viewport.dispatchEvent(new Event('resize'));
  });

const focus = (element: HTMLElement) =>
  act(() => {
    element.focus();
  });

const blur = (element: HTMLElement) =>
  act(() => {
    element.blur();
  });

const createEditable = () => {
  const element = document.createElement('div');
  element.contentEditable = 'true';
  element.tabIndex = 0;
  document.body.append(element);

  return element;
};

const createButton = () => {
  const element = document.createElement('button');
  document.body.append(element);

  return element;
};

describe('useVirtualKeyboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    isTouchDevice.value = true;
    Object.defineProperty(window, 'innerHeight', {
      value: VIEWPORT_HEIGHT,
      configurable: true,
    });
    Object.defineProperty(window, 'visualViewport', {
      value: viewport,
      configurable: true,
    });
    Object.defineProperty(viewport, 'height', {
      value: VIEWPORT_HEIGHT,
      configurable: true,
    });
  });

  it('should report the keyboard closed initially', () => {
    const { result } = renderHook(() => useVirtualKeyboard());

    expect(result.current[0]).toBe(false);
  });

  it('should report the keyboard open when an editable element is focused', () => {
    focus(createEditable());
    const { result } = renderHook(() => useVirtualKeyboard());

    setViewportHeight(400);

    expect(result.current[0]).toBe(true);
  });

  it('should ignore a viewport that barely shrinks', () => {
    focus(createEditable());
    const { result } = renderHook(() => useVirtualKeyboard());

    setViewportHeight(VIEWPORT_HEIGHT - 10);

    expect(result.current[0]).toBe(false);
  });

  it('should ignore a keyboard opened outside the document', () => {
    focus(createButton());
    const { result } = renderHook(() => useVirtualKeyboard());

    setViewportHeight(400);

    expect(result.current[0]).toBe(false);
  });

  it('should report the keyboard closed when the editable element loses focus', () => {
    const editable = createEditable();
    focus(editable);
    const { result } = renderHook(() => useVirtualKeyboard());
    setViewportHeight(400);

    blur(editable);

    expect(result.current[0]).toBe(false);
  });

  it('should report the keyboard closed again when the viewport grows back', () => {
    focus(createEditable());
    const { result } = renderHook(() => useVirtualKeyboard());
    setViewportHeight(400);

    setViewportHeight(VIEWPORT_HEIGHT);

    expect(result.current[0]).toBe(false);
  });

  it('should ignore the viewport on a device without a virtual keyboard', () => {
    isTouchDevice.value = false;
    focus(createEditable());
    const { result } = renderHook(() => useVirtualKeyboard());

    setViewportHeight(400);

    expect(result.current[0]).toBe(false);
  });
});
