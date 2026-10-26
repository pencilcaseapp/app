/** Appended to the user agent by the native apps (`capacitor.config.ts`). */
export const NATIVE_APP_USER_AGENT = 'PencilCaseApp';

/** The iOS app as Apple knows it: its team ID and bundle ID. */
export const IOS_APP_ID = '3KCKVSRRQ3.app.pencilcase.ios';

/** The Android app's package name. */
export const ANDROID_PACKAGE_NAME = 'app.pencilcase.android';

/**
 * The SHA-256 fingerprints of the certificates the Android app is signed
 * with: Google Play's app signing key, which is what users install.
 */
export const ANDROID_CERT_FINGERPRINTS = [
  '87:56:8B:81:48:F2:A9:5C:E0:60:14:8C:C4:AB:5E:EB'
  + ':70:28:34:49:09:2F:29:EA:B5:5A:86:A1:3D:B4:D7:45',
];

/**
 * Links that stay in the browser even with the app installed: everything
 * that sells or bills the subscription, which the App Store and Google
 * Play would want through their own billing inside the app. The Android
 * app repeats them in its manifest and `MainActivity`.
 */
export const BROWSER_ONLY_PATHS = [
  '/upgrade',
  '/billing-portal',
  '/doc/*/checkout',
  '/doc/*/settings/subscription',
];
