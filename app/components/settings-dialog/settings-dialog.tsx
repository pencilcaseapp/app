import type { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { useMedia } from 'react-use';
import { Avatar } from '~/ui/avatar/avatar';
import { Button } from '~/ui/button/button';
import { Checkbox } from '~/ui/checkbox/checkbox';
import { Icon } from '~/ui/icon/icon';
import type { IconName } from '~/ui/icon/icons';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
} from '~/ui/responsive-dialog/responsive-dialog';
import { ResponsiveDialogContent } from '~/ui/responsive-dialog/responsive-dialog-content';
import { ResponsiveDialogTopbar } from '~/ui/responsive-dialog/responsive-dialog-topbar';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';
import { TextField } from '~/ui/text-field/text-field';
import { Typography } from '~/ui/typography/typography';

export interface SettingsDialogUser {
  name: string | null;
  email: string;
  newsletter: boolean | null;
}

export type SettingsSection = 'account' | 'subscription' | 'support';
export type SettingsPage = 'menu' | SettingsSection;

export interface SettingsDialogProps {
  user: SettingsDialogUser;
  open: boolean;
  /** The page shown: the menu (stacked layouts only) or a section. */
  page: SettingsPage;
  onOpenChange: (open: boolean) => void;
  onPageChange: (page: SettingsPage) => void;
}

const sections: {
  id: SettingsSection;
  title: string;
  icon: IconName;
}[] = [
  { id: 'account', title: 'Account', icon: 'account' },
  { id: 'subscription', title: 'Subscription', icon: 'euro' },
  { id: 'support', title: 'Support', icon: 'help' },
];

export function isSettingsSection(
  value: string,
): value is SettingsSection {
  return sections.some(({ id }) => id === value);
}

const chevron = (
  <Icon icon="chevronRight" className="m-1 text-pca-grey-400" />
);

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
 * The settings overlay. Below `sm` it is a full height drawer, from `sm`
 * a centered dialog; below `lg` the sections stack behind a menu page the
 * topbar's back button returns to, from `lg` the section navigation moves
 * into the dialog's side area. The page is static for now: only Cancel
 * and the close button do anything.
 */
export const SettingsDialog: FC<SettingsDialogProps> = ({
  user,
  open,
  page,
  onOpenChange,
  onPageChange,
}) => {
  const hasSideNavigation = useMedia('(width >= 64rem)', false);

  const isMenu = !hasSideNavigation && page === 'menu';
  const section: SettingsSection = page === 'menu' ? 'account' : page;
  const sectionTitle = sections.find(({ id }) => id === section)?.title;

  const displayName = user.name || user.email;
  const profile = (
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

  let content: ReactNode;
  if (isMenu) {
    content = (
      <div className="flex flex-col gap-6">
        {profile}
        <div className="flex flex-col gap-2">
          {sections.map(({ id, title, icon }) => (
            <NavigationItem
              key={id}
              as="button"
              type="button"
              icon={icon}
              title={title}
              onClick={() => onPageChange(id)}
              actionArea={chevron}
              isActionAreaVisible
            />
          ))}
          <NavigationItem
            as="button"
            type="button"
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
  }
  else if (section === 'account') {
    content = (
      <div className="flex flex-col gap-6">
        {profile}
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
  }
  else {
    content = (
      <Typography
        variant="bodySmall"
        textColorLight="grey-600"
        textColorDark="grey-400"
      >
        {`The ${sectionTitle} settings live here.`}
      </Typography>
    );
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        size="large"
        isFullHeight
        maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        className={hasSideNavigation ? undefined : 'max-w-2xl!'}
        topArea={(
          <ResponsiveDialogTopbar
            title={isMenu ? 'Settings' : sectionTitle}
            onBack={
              !hasSideNavigation && page !== 'menu'
                ? () => onPageChange('menu')
                : undefined
            }
          />
        )}
        sideArea={hasSideNavigation
          ? (
              <nav className="flex h-full w-44 flex-col justify-between gap-1">
                <div className="flex flex-col gap-1">
                  {sections.map(({ id, title, icon }) => (
                    <NavigationItem
                      key={id}
                      as="button"
                      type="button"
                      icon={icon}
                      title={title}
                      className={sideNavigationItemClasses}
                      aria-current={id === section ? 'page' : undefined}
                      onClick={() => onPageChange(id)}
                    />
                  ))}
                </div>
                <NavigationItem
                  as="button"
                  type="button"
                  icon="logout"
                  title="Logout"
                  className="text-pca-red-500"
                  textColorLight="red-500"
                  textColorDark="red-500"
                />
              </nav>
            )
          : undefined}
        footerArea={!isMenu && section === 'account'
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
        {content}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
