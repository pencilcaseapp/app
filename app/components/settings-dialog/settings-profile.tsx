import type { FC } from 'react';
import { Avatar } from '~/ui/avatar/avatar';
import { Typography } from '~/ui/typography/typography';
import type { SettingsDialogUser } from './settings-dialog';

export interface SettingsProfileProps {
  user: SettingsDialogUser;
}

export const SettingsProfile: FC<SettingsProfileProps> = ({ user }) => {
  const displayName = user.name || user.email;

  return (
    <div className="flex items-center gap-4">
      <Avatar as="span" name={displayName} size="large" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Typography
          variant="bodySmall"
          fontWeight="semibold"
          as="span"
          className="truncate"
        >
          {displayName}
        </Typography>
        {user.name && (
          <Typography
            variant="bodyTiny"
            as="span"
            textColorLight="grey-600"
            textColorDark="grey-400"
            className="truncate"
          >
            {user.email}
          </Typography>
        )}
      </div>
    </div>
  );
};
