import type { MiddlewareFunction } from 'react-router';
import { SettingsDialogPage } from '~/components/settings-dialog/settings-dialog';
import { commonCopies } from '~/constants/common-copies';
import { authMiddleware } from '~/middleware/auth';
import { Icon } from '~/ui/icon/icon';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { Typography } from '~/ui/typography/typography';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const externalLink = (
  <Icon icon="externalLink" className="m-1 text-pca-grey-400" />
);

export default function SettingsSupportRoute() {
  return (
    <SettingsDialogPage section="support">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Typography variant="heading3" as="h2">
            How can we help?
          </Typography>
          <Typography variant="bodySmall">
            Write us an e-mail. We’ll get back to you and help you with
            your case. We take your feedback seriously.
          </Typography>
        </div>
        <NavigationItem
          as="a"
          href={`mailto:${commonCopies.supportEmail}`}
          icon="mail"
          title={commonCopies.supportEmail}
          actionArea={externalLink}
          isActionAreaVisible
        />
      </div>
    </SettingsDialogPage>
  );
}
