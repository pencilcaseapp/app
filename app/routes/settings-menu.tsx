import { useOutletContext } from 'react-router';
import { SettingsDialogContent } from '~/components/settings-dialog/settings-dialog';
import type { SettingsOutletContext } from '~/components/settings-dialog/settings-dialog';
import { SettingsMenu } from '~/components/settings-dialog/settings-menu';

/*
 * The root page of the stacked layouts, which the sidebar links to on
 * mobile; off mobile it links straight to the account section, so this
 * page is only reached there by opening the settings URL itself.
 */
export default function SettingsMenuRoute() {
  const { user } = useOutletContext<SettingsOutletContext>();

  return (
    <SettingsDialogContent section={null}>
      <SettingsMenu user={user} />
    </SettingsDialogContent>
  );
}
