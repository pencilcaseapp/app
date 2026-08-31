import type { FC } from 'react';
import { href, Link } from 'react-router';
import { Icon } from '~/ui/icon/icon';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { settingsSections } from './settings-dialog';
import type { SettingsDialogUser } from './settings-dialog';
import { SettingsProfile } from './settings-profile';

export interface SettingsMenuProps {
  user: SettingsDialogUser;
}

const chevron = (
  <Icon icon="chevronRight" className="m-1 text-pca-grey-400" />
);

/*
 * The root page of the stacked settings layouts: the profile and one
 * link per section, relative to the settings route.
 */
export const SettingsMenu: FC<SettingsMenuProps> = ({ user }) => {
  return (
    <div className="flex flex-col gap-6">
      <SettingsProfile user={user} />
      <div className="flex flex-col gap-2">
        {settingsSections.map(({ id, title, icon }) => (
          <NavigationItem
            key={id}
            as={Link}
            to={id}
            icon={icon}
            title={title}
            actionArea={chevron}
            isActionAreaVisible
          />
        ))}
        <NavigationItem
          as="a"
          href={href('/signout')}
          icon="logout"
          title="Logout"
          className="text-pca-red-500"
          textColorLight="red-500"
          textColorDark="red-500"
          actionArea={chevron}
          isActionAreaVisible
        />
      </div>
    </div>
  );
};
