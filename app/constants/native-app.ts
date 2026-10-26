/** Appended to the user agent by the native apps (`capacitor.config.ts`). */
export const NATIVE_APP_USER_AGENT = 'PencilCaseApp';

/** The iOS app as Apple knows it: its team ID and bundle ID. */
export const IOS_APP_ID = '3KCKVSRRQ3.app.pencilcase.ios';

/**
 * Links that stay in the browser even with the app installed: everything
 * that sells or bills the subscription, which the App Store would want
 * through In-App Purchase inside the app.
 */
export const BROWSER_ONLY_PATHS = [
  '/upgrade',
  '/billing-portal',
  '/doc/*/checkout',
  '/doc/*/settings/subscription',
];
