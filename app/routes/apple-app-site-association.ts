import { BROWSER_ONLY_PATHS, IOS_APP_ID } from '~/constants/native-app';

/**
 * Tells iOS which links on this domain open the app (universal links).
 * Apple fetches it through its CDN when the app is installed, so a change
 * takes a while to reach devices.
 */
export function loader() {
  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: [
            ...BROWSER_ONLY_PATHS.map(path => ({ '/': path, 'exclude': true })),
            { '/': '/*' },
          ],
        },
      ],
    },
  });
}
