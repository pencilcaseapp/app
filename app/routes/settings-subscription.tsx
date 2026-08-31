import type { MiddlewareFunction } from 'react-router';
import { SettingsDialogPage } from '~/components/settings-dialog/settings-dialog';
import { authMiddleware } from '~/middleware/auth';
import { Typography } from '~/ui/typography/typography';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export default function SettingsSubscriptionRoute() {
  return (
    <SettingsDialogPage section="subscription">
      <Typography
        variant="bodySmall"
        textColorLight="grey-600"
        textColorDark="grey-400"
      >
        The Subscription settings live here.
      </Typography>
    </SettingsDialogPage>
  );
}
