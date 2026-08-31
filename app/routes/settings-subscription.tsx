import type { MiddlewareFunction } from 'react-router';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import { authMiddleware } from '~/middleware/auth';
import { Typography } from '~/ui/typography/typography';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export default function SettingsSubscriptionRoute() {
  return (
    <SettingsDialogContentInner section="subscription">
      <Typography
        variant="bodySmall"
        textColorLight="grey-600"
        textColorDark="grey-400"
      >
        The Subscription settings live here.
      </Typography>
    </SettingsDialogContentInner>
  );
}
