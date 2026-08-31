import type { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';
import { href, NavLink, useNavigate } from 'react-router';
import { useMedia } from 'react-use';
import type { IconName } from '~/ui/icon/icons';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { ResponsiveDialogContent } from '~/ui/responsive-dialog/responsive-dialog-content';
import { ResponsiveDialogContentInner } from '~/ui/responsive-dialog/responsive-dialog-content-inner';
import { ResponsiveDialogTopbar } from '~/ui/responsive-dialog/responsive-dialog-topbar';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';

export interface SettingsDialogUser {
  name: string | null;
  email: string;
  newsletter: boolean | null;
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

/*
 * The popup of the settings overlay, rendered by the settings route
 * around its outlet so it stays mounted while the section routes swap
 * the structure within. Below `sm` it is a full height drawer, from
 * `sm` a centered dialog that narrows once the section navigation is
 * not taking up the side area.
 */
export const SettingsDialogContent: FC<PropsWithChildren> = ({ children }) => {
  const hasSideNavigation = useMedia(SETTINGS_SIDE_NAVIGATION_QUERY, false);

  return (
    <ResponsiveDialogContent
      size="large"
      isFullHeight
      maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
      className={hasSideNavigation ? undefined : 'max-w-2xl!'}
    >
      {children}
    </ResponsiveDialogContent>
  );
};

export interface SettingsDialogPageProps extends PropsWithChildren {
  /** The section being rendered, or null for the menu index. */
  section: SettingsSection | null;
  /** The section's actions, pinned below the content. */
  footerArea?: ReactNode;
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
 * The shared chrome of a settings page, rendered by each settings route
 * inside the `SettingsDialogContent` the settings route keeps open
 * across them. Below `lg` the sections stack behind the menu page the
 * topbar's back button returns to, from `lg` the section navigation
 * sits in the dialog's side area. The side area and the back button
 * only render for a section, so their navigation can rely on `..`
 * being the settings route.
 */
export const SettingsDialogPage: FC<SettingsDialogPageProps> = ({
  section,
  footerArea,
  children,
}) => {
  const navigate = useNavigate();
  const hasSideNavigation = useMedia(SETTINGS_SIDE_NAVIGATION_QUERY, false);

  const title = section === null
    ? 'Settings'
    : settingsSections.find(({ id }) => id === section)?.title;

  return (
    <ResponsiveDialogContentInner
      topArea={(
        <ResponsiveDialogTopbar
          title={title}
          onBack={
            !hasSideNavigation && section !== null
              ? () => void navigate('..', { preventScrollReset: true })
              : undefined
          }
        />
      )}
      sideArea={hasSideNavigation && section !== null
        ? (
            <nav className="flex h-full w-44 flex-col justify-between gap-1">
              <div className="flex flex-col gap-1">
                {settingsSections.map(({ id, title: sectionTitle, icon }) => (
                  <NavigationItem
                    key={id}
                    as={NavLink}
                    to={`../${id}`}
                    preventScrollReset
                    icon={icon}
                    title={sectionTitle}
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
      footerArea={footerArea}
    >
      {children}
    </ResponsiveDialogContentInner>
  );
};
