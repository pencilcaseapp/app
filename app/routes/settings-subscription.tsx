import { SettingsDialogContent } from '~/components/settings-dialog/settings-dialog';
import { Typography } from '~/ui/typography/typography';

export default function SettingsSubscriptionRoute() {
  return (
    <SettingsDialogContent section="subscription">
      <Typography
        variant="bodySmall"
        textColorLight="grey-600"
        textColorDark="grey-400"
      >
        The Subscription settings live here.
      </Typography>
    </SettingsDialogContent>
  );
}
