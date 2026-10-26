// @vitest-environment node

import { expect, test } from 'vitest';
import { ANDROID_CERT_FINGERPRINTS } from '~/constants/native-app';
import { loader } from './assetlinks';

test('lets the android app open links', async () => {
  const response = loader();

  expect(response.headers.get('Content-Type')).toBe('application/json');
  expect(await response.json()).toEqual([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'app.pencilcase.android',
        sha256_cert_fingerprints: ANDROID_CERT_FINGERPRINTS,
      },
    },
  ]);
});
