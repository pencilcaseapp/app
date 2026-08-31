import type { FC } from 'react';
import { commonCopies } from '~/constants/common-copies';
import { Icon } from '~/ui/icon/icon';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { Typography } from '~/ui/typography/typography';

const externalLink = (
  <Icon icon="externalLink" className="m-1 text-pca-grey-400" />
);

export const SettingsSupport: FC = () => {
  return (
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
  );
};
