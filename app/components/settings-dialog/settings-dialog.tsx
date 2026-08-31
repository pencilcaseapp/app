import type { FC, PropsWithChildren } from 'react';
import classNames from 'classnames';
import { href, NavLink, useNavigate } from 'react-router';
import { useMedia } from 'react-use';
import { Button } from '~/ui/button/button';
import type { IconName } from '~/ui/icon/icons';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
} from '~/ui/responsive-dialog/responsive-dialog';
import { ResponsiveDialogContent } from '~/ui/responsive-dialog/responsive-dialog-content';
import { ResponsiveDialogTopbar } from '~/ui/responsive-dialog/responsive-dialog-topbar';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';

export interface SettingsDialogUser {
  name: string | null;
  email: string;
  newsletter: boolean | null;
}

/** What the settings routes hand down to their section routes. */
export interface SettingsOutletContext {
  user: SettingsDialogUser;
}

export type SettingsSection = 'account' | 'subscription' | 'support';

/** From here up the section navigation sits next to the content. */
export const SETTINGS_SIDE_NAVIGATION_QUERY = '(width >= 64rem)';

export const settingsSections: {
  id: SettingsSection;
  title: string;
  icon: IconName;
}[] = [
  { id: 'account', title: 'Account', icon: 'account' },
  { id: 'subscription', title: 'Subscription', icon: 'euro' },
  { id: 'support', title: 'Support', icon: 'help' },
];

export interface SettingsDialogProps extends PropsWithChildren {
  /** The active section, or null while the menu index is shown. */
  section: SettingsSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
}

// The active section gets the yellow surface of the active document row
// instead of `NavigationItem`'s grey default, matching the settings design.
const sideNavigationItemClasses = classNames(
  'has-aria-[current=page]:bg-pca-yellow-500!',
  'dark:has-aria-[current=page]:bg-pca-yellow-500!',
  'dark:has-aria-[current=page]:text-pca-grey-900',
  'has-aria-[current=page]:[&_span]:font-semibold!',
  'dark:has-aria-[current=page]:[&_span]:text-pca-grey-900!',
);

/*
 * The shell of the settings overlay; the section content is the children
 * (the settings route's outlet). Below `sm` it is a full height drawer,
 * from `sm` a centered dialog; below `lg` the sections stack behind the
 * menu page the topbar's back button returns to, from `lg` the section
 * navigation moves into the dialog's side area. All navigation is
 * route-relative to the settings route rendering this shell.
 */
export const SettingsDialog: FC<SettingsDialogProps> = ({
  section,
  open,
  onOpenChange,
  onOpenChangeComplete,
  children,
}) => {
  const navigate = useNavigate();
  const hasSideNavigation = useMedia(SETTINGS_SIDE_NAVIGATION_QUERY, false);

  const isMenu = !hasSideNavigation && section === null;
  const activeSection = section ?? 'account';
  const sectionTitle = settingsSections
    .find(({ id }) => id === activeSection)?.title;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <ResponsiveDialogContent
        size="large"
        isFullHeight
        maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        className={hasSideNavigation ? undefined : 'max-w-2xl!'}
        topArea={(
          <ResponsiveDialogTopbar
            title={isMenu ? 'Settings' : sectionTitle}
            onBack={
              !hasSideNavigation && section !== null
                ? () => void navigate('.')
                : undefined
            }
          />
        )}
        sideArea={hasSideNavigation
          ? (
              <nav className="flex h-full w-44 flex-col justify-between gap-1">
                <div className="flex flex-col gap-1">
                  {settingsSections.map(({ id, title, icon }) => (
                    <NavigationItem
                      key={id}
                      as={NavLink}
                      to={id}
                      icon={icon}
                      title={title}
                      className={sideNavigationItemClasses}
                    />
                  ))}
                </div>
                <NavigationItem
                  as="a"
                  href={href('/signout')}
                  icon="logout"
                  title="Logout"
                  className="text-pca-red-500"
                  textColorLight="red-500"
                  textColorDark="red-500"
                />
              </nav>
            )
          : undefined}
        footerArea={!isMenu && activeSection === 'account'
          ? (
              <div className="flex items-center justify-end gap-2">
                <ResponsiveDialogClose
                  render={<Button colorLight="secondary">Cancel</Button>}
                />
                <Button type="button">Save</Button>
              </div>
            )
          : undefined}
      >
        {children}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
