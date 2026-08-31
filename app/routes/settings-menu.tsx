import type { MiddlewareFunction } from 'react-router';
import { SettingsDialogPage } from '~/components/settings-dialog/settings-dialog';
import { SettingsMenu } from '~/components/settings-dialog/settings-menu';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import type { Route } from './+types/settings-menu';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export function loader({ context }: Route.LoaderArgs) {
  const { name, email, newsletter } = context.get(userSessionContext);

  return { user: { name, email, newsletter } };
}

/*
 * The root page of the stacked layouts, which the sidebar links to on
 * mobile; off mobile it links straight to the account section, so this
 * page is only reached there by opening the settings URL itself.
 */
export default function SettingsMenuRoute({
  loaderData: { user },
}: Route.ComponentProps) {
  return (
    <SettingsDialogPage section={null}>
      <SettingsMenu user={user} />
    </SettingsDialogPage>
  );
}
