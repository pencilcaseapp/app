import { useOutletContext } from 'react-router';
import { useMedia } from 'react-use';
import { SETTINGS_SIDE_NAVIGATION_QUERY } from '~/components/settings-dialog/settings-dialog';
import type { SettingsOutletContext } from '~/components/settings-dialog/settings-dialog';
import { SettingsMenu } from '~/components/settings-dialog/settings-menu';

/*
 * The stacked layouts open on this menu; with the side navigation the
 * settings route immediately replaces it with the account section.
 */
export default function SettingsMenuRoute() {
  const { user } = useOutletContext<SettingsOutletContext>();
  const hasSideNavigation = useMedia(SETTINGS_SIDE_NAVIGATION_QUERY, false);

  if (hasSideNavigation) {
    return null;
  }

  return <SettingsMenu user={user} />;
}
