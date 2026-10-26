import {
  ANDROID_CERT_FINGERPRINTS,
  ANDROID_PACKAGE_NAME,
} from '~/constants/native-app';

/**
 * Tells Android that the app may open links on this domain (App Links).
 * Which paths it opens is up to the intent filter in its manifest.
 */
export function loader() {
  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: ANDROID_CERT_FINGERPRINTS,
      },
    },
  ]);
}
