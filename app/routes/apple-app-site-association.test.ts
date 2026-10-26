// @vitest-environment node

import { expect, test } from 'vitest';
import { loader } from './apple-app-site-association';

test('opens every link in the app but the billing ones', async () => {
  const response = loader();

  expect(response.headers.get('Content-Type')).toBe('application/json');
  expect(await response.json()).toEqual({
    applinks: {
      details: [
        {
          appIDs: ['3KCKVSRRQ3.app.pencilcase.ios'],
          components: [
            { '/': '/upgrade', 'exclude': true },
            { '/': '/billing-portal', 'exclude': true },
            { '/': '/doc/*/checkout', 'exclude': true },
            { '/': '/doc/*/settings/subscription', 'exclude': true },
            { '/': '/*' },
          ],
        },
      ],
    },
  });
});
