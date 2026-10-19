import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBlurInBackground } from './use-blur-in-background';

const isTouchDevice = vi.hoisted(() => ({ value: true }));

vi.mock('react-use', () => ({
  useMedia: () => isTouchDevice.value,
}));

const setVisibility = (state: DocumentVisibilityState) =>
  act(() => {
    Object.defineProperty(document, 'visibilityState', {
      value: state,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

const append = <T extends HTMLElement>(element: T) => {
  document.body.append(element);
  element.focus();

  return element;
};

const createEditable = () => {
  const element = document.createElement('div');
  element.contentEditable = 'true';
  element.tabIndex = 0;

  return append(element);
};

describe('useBlurInBackground', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    isTouchDevice.value = true;
    setVisibility('visible');
  });

  it('should blur the editor when the page goes to the background', () => {
    renderHook(() => useBlurInBackground());
    const editable = createEditable();

    setVisibility('hidden');

    expect(document.activeElement).not.toBe(editable);
  });

  it('should blur a text field when the page goes to the background', () => {
    renderHook(() => useBlurInBackground());
    const input = append(document.createElement('input'));

    setVisibility('hidden');

    expect(document.activeElement).not.toBe(input);
  });

  it('should keep the focus on an element without a keyboard', () => {
    renderHook(() => useBlurInBackground());
    const button = append(document.createElement('button'));

    setVisibility('hidden');

    expect(document.activeElement).toBe(button);
  });

  it('should keep the focus when the page comes back', () => {
    renderHook(() => useBlurInBackground());
    const editable = createEditable();

    setVisibility('visible');

    expect(document.activeElement).toBe(editable);
  });

  it('should keep the focus on a device without a virtual keyboard', () => {
    isTouchDevice.value = false;
    renderHook(() => useBlurInBackground());
    const editable = createEditable();

    setVisibility('hidden');

    expect(document.activeElement).toBe(editable);
  });
});
