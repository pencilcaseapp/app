import { useOutletContext } from 'react-router';
import { SettingsAccount } from '~/components/settings-dialog/settings-account';
import type { SettingsOutletContext } from '~/components/settings-dialog/settings-dialog';

export default function SettingsAccountRoute() {
  const { user } = useOutletContext<SettingsOutletContext>();

  return <SettingsAccount user={user} />;
}
