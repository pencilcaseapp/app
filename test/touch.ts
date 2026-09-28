import { act } from '@testing-library/react';

const touchEvent = (type: string, x: number, y: number) => {
  const point = { clientX: x, clientY: y };

  return Object.assign(new Event(type, { bubbles: true }), {
    touches: type === 'touchend' ? [] : [point],
    changedTouches: [point],
  });
};

/** A tap on `element`, and the focus it moves there. */
export const tap = (element: HTMLElement) =>
  act(() => {
    element.dispatchEvent(touchEvent('touchstart', 10, 10));
    element.dispatchEvent(touchEvent('touchend', 10, 10));
    element.focus();
  });

/** A finger dragged across `element`, as a scroll or a pull-to-refresh is. */
export const drag = (element: HTMLElement) =>
  act(() => {
    element.dispatchEvent(touchEvent('touchstart', 10, 10));
    element.dispatchEvent(touchEvent('touchend', 10, 300));
  });
