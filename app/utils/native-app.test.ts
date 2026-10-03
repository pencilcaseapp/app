import { afterEach, describe, expect, it, vi } from 'vitest';
import { hideNativeSplashScreen, isNativeAppRequest } from './native-app';

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

describe('hideNativeSplashScreen', () => {
  afterEach(() => {
    delete window.Capacitor;
  });

  it('hides the splash screen of the native apps', async () => {
    const hide = vi.fn().mockResolvedValue(undefined);
    window.Capacitor = { Plugins: { SplashScreen: { hide } } };

    hideNativeSplashScreen();

    await vi.waitFor(() => expect(hide).toHaveBeenCalledOnce());
  });

  it('does nothing in a browser', () => {
    expect(() => hideNativeSplashScreen()).not.toThrow();
  });
});
