import { NATIVE_APP_USER_AGENT } from '~/constants/native-app';

export const isNativeAppRequest = (request: Request) =>
  request.headers.get('user-agent')?.includes(NATIVE_APP_USER_AGENT) ?? false;

/*
 * Inlined at the end of the page in the native apps, so their splash screen
 * goes as soon as the server-rendered page is laid out rather than once the
 * scripts have loaded and hydrated it. iOS reports the safe area insets a
 * frame after the first paint, so it waits for them (or ten frames, for a
 * screen that has none) rather than showing the content jump under the
 * status bar. Capacitor injects `Capacitor.Plugins` before the page loads.
 */
export const HIDE_NATIVE_SPLASH_SCREEN_SCRIPT = `(() => {
  const probe = document.createElement('div');
  probe.style.cssText
    = 'position:fixed;padding-top:env(safe-area-inset-top);visibility:hidden';
  document.body.append(probe);
  let frames = 0;
  const hideOnceLaidOut = () => {
    if (parseFloat(getComputedStyle(probe).paddingTop) > 0 || ++frames > 10) {
      probe.remove();
      window.Capacitor?.Plugins?.SplashScreen?.hide().catch(() => {});
      return;
    }
    requestAnimationFrame(hideOnceLaidOut);
  };
  requestAnimationFrame(hideOnceLaidOut);
})();`;

/** The pull to refresh the Android app wraps the page in. */
interface NativePullToRefresh {
  allow: (options: { allowed: boolean }) => Promise<void>;
}

declare global {
  interface Window {
    Capacitor?: { Plugins?: { PullToRefresh?: NativePullToRefresh } };
  }
}

export const getNativePullToRefresh = () =>
  window.Capacitor?.Plugins?.PullToRefresh;

/**
 * Whether a pull starting on `target` pulls the page itself down, the way a
 * browser decides it for its own pull to refresh: not when it scrolls
 * something inside the page back up or starts in an element that keeps its
 * scrolling to itself (the editor while editing, a dialog, a drawer), and
 * not on a page that does not scroll at all, like one under a dialog.
 */
export const canPullToRefresh = (target: EventTarget | null) => {
  const page: Element[] = [document.documentElement, document.body];

  for (
    let element = target instanceof Element ? target : null;
    element;
    element = element.parentElement
  ) {
    const { overflowY, overscrollBehaviorY } = getComputedStyle(element);
    if (
      element.scrollTop > 0
      || overscrollBehaviorY === 'contain'
      || overscrollBehaviorY === 'none'
      || (page.includes(element) && overflowY === 'hidden')
    ) {
      return false;
    }
  }

  return true;
};
