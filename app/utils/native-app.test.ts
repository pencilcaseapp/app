import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canPullToRefresh,
  HIDE_NATIVE_SPLASH_SCREEN_SCRIPT,
  isNativeAppRequest,
} from './native-app';

const requestWithUserAgent = (userAgent?: string) =>
  new Request('http://localhost/', {
    headers: userAgent ? { 'user-agent': userAgent } : {},
  });

describe('isNativeAppRequest', () => {
  it('recognises the native apps', () => {
    expect(isNativeAppRequest(requestWithUserAgent(
      'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 PencilCaseApp',
    ))).toBe(true);
  });

  it('leaves browsers alone', () => {
    expect(isNativeAppRequest(requestWithUserAgent(
      'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Safari/604.1',
    ))).toBe(false);
  });

  it('handles a request without a user agent', () => {
    expect(isNativeAppRequest(requestWithUserAgent())).toBe(false);
  });
});

describe('HIDE_NATIVE_SPLASH_SCREEN_SCRIPT', () => {
  const runScript = () => new Function(HIDE_NATIVE_SPLASH_SCREEN_SCRIPT)();

  afterEach(() => {
    Reflect.deleteProperty(window, 'Capacitor');
  });

  it('hides the splash screen of the native apps', async () => {
    const hide = vi.fn().mockResolvedValue(undefined);
    Object.assign(window, {
      Capacitor: { Plugins: { SplashScreen: { hide } } },
    });

    runScript();

    await vi.waitFor(() => expect(hide).toHaveBeenCalledOnce());
  });

  it('cleans up after itself without the native bridge', async () => {
    const childCount = document.body.childElementCount;

    runScript();

    await vi.waitFor(() =>
      expect(document.body.childElementCount).toBe(childCount));
  });
});

describe('canPullToRefresh', () => {
  const append = (parent: HTMLElement, style = '') => {
    const element = document.createElement('div');
    element.style.cssText = style;
    parent.append(element);

    return element;
  };

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.cssText = '';
  });

  it('pulls the page down', () => {
    expect(canPullToRefresh(append(document.body))).toBe(true);
  });

  it('leaves a scrolled element to scroll back up', () => {
    const scroller = append(document.body, 'overflow-y: auto');
    scroller.scrollTop = 100;

    expect(canPullToRefresh(append(scroller))).toBe(false);
  });

  it('leaves an element that keeps its scrolling to itself alone', () => {
    const dialog = append(document.body, 'overscroll-behavior-y: contain');

    expect(canPullToRefresh(append(dialog))).toBe(false);
  });

  it('leaves a page that does not scroll alone', () => {
    document.body.style.overflowY = 'hidden';

    expect(canPullToRefresh(append(document.body))).toBe(false);
  });
});
