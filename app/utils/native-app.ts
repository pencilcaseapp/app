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
