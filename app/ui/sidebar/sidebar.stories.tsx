/* eslint-disable @eslint-react/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, NavLink } from 'react-router';
import { Sidebar } from './sidebar';
import { SidebarProvider } from '../sidebar-context/sidebar-provider';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import { Logo } from '../logo/logo';
import { Topbar } from '../topbar/topbar';
import { Button } from '../button/button';
import { DocumentGroupEmpty } from '../document-group/document-group-empty';
import { DocumentItem } from '../document-item/document-item';
import { FolderSwitch } from '../folder-switch/folder-switch';
import type { FolderSwitchItem } from '../folder-switch/folder-switch';
import { NavigationItem } from '../navigation-item/navigation-item';
import type { IconName } from '../icon/icons';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import { DropdownMenuPortal } from '../dropdown-menu/dropdown-menu-portal';
import { DropdownMenuContent } from '../dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '../dropdown-menu/dropdown-menu-item';
import { action } from 'storybook/actions';
import { useState } from 'react';

/**
 * The `Sidebar` renders the application's primary navigation.
 * It composes a list of `NavLink`s with an optional top area
 * (typically a logo or branding) and a bottom area for
 * secondary links such as legal pages or external resources.
 *
 * The Sidebar relies on `SidebarContext` to manage its
 * open/closed state on mobile viewports, so it must be
 * rendered inside a `SidebarProvider`. On desktop
 * (≥ 1024px) the sidebar is always visible.
 */
const meta: Meta<typeof Sidebar> = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  decorators: [
    Story => (
      <MemoryRouter>
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const navigation = [
  { label: '(A.2.1) Le Cours Français', to: '/123' },
  { label: '(A.2.2) Le Cours Français', to: '/321' },
  { label: '(A.2.3) Le Cours Français', to: '/111' },
  { label: '(A.2.4) Le Cours Français', to: '/222' },
  { label: '(A.2.5) Le Cours Français', to: '/333' },
  { label: 'Grocery List', to: '/grocery' },
  { label: 'Meeting Notes', to: '/meeting-notes' },
  { label: 'Project Plan', to: '/project-plan' },
  { label: 'Vacation Ideas', to: '/vacation-ideas' },
  { label: 'Book Recommendations', to: '/book-recommendations' },
  { label: 'Recipe Collection', to: '/recipes' },
  { label: 'Fitness Goals', to: '/fitness-goals' },
  { label: 'Budget Tracker', to: '/budget-tracker' },
  { label: 'Event Planning', to: '/event-planning' },
];

type Folder = 'all' | 'shared' | 'deleted';

const folderGroups: FolderSwitchItem<Folder>[][] = [
  [
    { value: 'all', label: 'All Docs', icon: 'space', count: navigation.length },
    { value: 'shared', label: 'Shared with you', icon: 'users', count: 0 },
  ],
  [{ value: 'deleted', label: 'Deleted', icon: 'trash', count: 0 }],
];

const bottomNavigation = [
  { label: 'Create Doc', to: '/create-doc', icon: 'create-doc' },
  { label: 'Create Space', to: '/create-space', icon: 'create-space' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
];

/**
 * On mobile viewports the sidebar is hidden by default and
 * its open state is controlled through `SidebarContext`.
 * This story showcases the typical wiring: a `Topbar` button
 * toggles `isSidebarOpen` via `useSidebarContext`, opening
 * the sidebar as an overlay. Resize the viewport below
 * 1024px to see the toggle in action.
 */
export const Default: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const { isSidebarOpen, setIsSidebarOpen } = useSidebarContext();
    const [folder, setFolder] = useState<Folder>('all');

    return (
      <>
        <Topbar
          left={(
            <Button
              colorLight="transparent"
              colorDark="transparent"
              icon="sidebar"
              iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
          center={<Logo />}
        />
        <Sidebar
          items={[
            {
              key: 'search',
              content: (
                <NavigationItem as="button" onClick={() => console.log('Search...')} icon="search" title="Search" />
              ),
            },
            {
              key: 'folder',
              content: (
                <div>
                  <div className="sticky top-0 z-10 bg-pca-white pb-1.5 dark:bg-pca-grey-900">
                    <FolderSwitch
                      groups={folderGroups}
                      value={folder}
                      onValueChange={setFolder}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {folder === 'all'
                      ? navigation.map(item => (
                          <DocumentItem
                            title={item.label}
                            as={NavLink}
                            to={item.to}
                            key={`${item.label}-${item.to}`}
                            actionArea={(
                              <DropdownMenu>
                                <DropdownMenuTrigger iconTitle="Item options" />
                                <DropdownMenuPortal>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem as="button" onClick={action('delete')} color="danger" icon="trash">
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenuPortal>
                              </DropdownMenu>
                            )}
                          >
                            {item.label}
                          </DocumentItem>
                        ))
                      : (
                          <DocumentGroupEmpty icon="no-docs">
                            {folder === 'shared'
                              ? 'No documents shared with you'
                              : 'No deleted documents'}
                          </DocumentGroupEmpty>
                        )}
                  </div>
                </div>
              ),
            },
          ]}
          bottomArea={(
            <>
              {bottomNavigation?.map(item => (
                <NavigationItem
                  key={`${item.label}-${item.to}`}
                  title={item.label}
                  to={item.to}
                  icon={item.icon as IconName}
                  as={NavLink}
                />
              ))}
            </>
          )}
        />
      </>
    );
  },
};
