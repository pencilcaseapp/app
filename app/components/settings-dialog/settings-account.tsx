import type { FC } from 'react';
import { Checkbox } from '~/ui/checkbox/checkbox';
import { Icon } from '~/ui/icon/icon';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { TextField } from '~/ui/text-field/text-field';
import { Typography } from '~/ui/typography/typography';
import type { SettingsDialogUser } from './settings-dialog';
import { SettingsProfile } from './settings-profile';

export interface SettingsAccountProps {
  user: SettingsDialogUser;
}

const chevron = (
  <Icon icon="chevronRight" className="m-1 text-pca-grey-400" />
);

/*
 * The account section. Static for now: the fields are prefilled but
 * nothing submits yet.
 */
export const SettingsAccount: FC<SettingsAccountProps> = ({ user }) => {
  return (
    <div className="flex flex-col gap-6">
      <SettingsProfile user={user} />
      <TextField
        id="settings-name"
        label="Name"
        autoComplete="name"
        placeholder="e.g. John Doe"
        defaultValue={user.name ?? ''}
      />
      <div className="flex flex-col gap-1">
        <Typography variant="bodySmall" fontWeight="semibold" as="h3">
          Change e-mail
        </Typography>
        <NavigationItem
          as="button"
          type="button"
          icon="mail"
          title={user.email}
          actionArea={chevron}
          isActionAreaVisible
        />
      </div>
      <div className="flex flex-col gap-1">
        <Typography variant="bodySmall" fontWeight="semibold" as="h3">
          Newsletter
        </Typography>
        <Typography
          variant="bodyTiny"
          textColorLight="grey-600"
          textColorDark="grey-400"
        >
          We’ll send you important feature updates and special offers.
          No spam, no scam, we hate it too. Unsubscribe at any time.
        </Typography>
        <Checkbox
          id="settings-newsletter"
          label="Subscribe to Newsletter"
          defaultChecked={user.newsletter ?? false}
          className="mt-3"
        />
      </div>
    </div>
  );
};
