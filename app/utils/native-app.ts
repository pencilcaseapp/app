import { NATIVE_APP_USER_AGENT } from '~/constants/native-app';

declare global {
  interface Window {
    /** The bridge the native apps inject into the page. */
    Capacitor?: {
      Plugins?: {
        SplashScreen?: { hide: () => Promise<void> };
      };
    };
  }
}

export const isNativeAppRequest = (request: Request) =>
  request.headers.get('user-agent')?.includes(NATIVE_APP_USER_AGENT) ?? false;

/*
 * iOS reports the safe area insets a frame after the first paint, so the
 * native apps keep their splash screen up until the page has hydrated
 * rather than showing the content jump under the status bar.
 */
export const hideNativeSplashScreen = () => {
  requestAnimationFrame(() => {
    window.Capacitor?.Plugins?.SplashScreen?.hide().catch(() => {});
  });
};
