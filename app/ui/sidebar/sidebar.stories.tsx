/* eslint-disable @eslint-react/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, NavLink } from 'react-router';
import { Sidebar } from './sidebar';
import { SidebarProvider } from '../sidebar-context/sidebar-provider';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import { Logo } from '../logo/logo';
import { Topbar } from '../topbar/topbar';
import { Button } from '../button/button';
import { DocumentGroup } from '../document-group/document-group';
import { DocumentItem } from '../document-item/document-item';
import { DocumentGroupRoot } from '../document-group/document-root';
import { NavigationItem } from '../navigation-item/navigation-item';
import type { IconName } from '../icon/icons';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import { DropdownMenuPortal } from '../dropdown-menu/dropdown-menu-portal';
import { DropdownMenuContent } from '../dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '../dropdown-menu/dropdown-menu-item';
import { DropdownMenuSeparator } from '../dropdown-menu/dropdown-menu-separator';
import { action } from 'storybook/actions';

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

    return (
      <>
        <Topbar
          left={(
            <Button
              colorLight="secondary"
              colorDark="secondary"
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
              key: 'all-docs',
              content: (
                <>
                  <DocumentGroupRoot>
                    <DocumentGroup icon="space" title="All Docs" value="all-docs">
                      {navigation.map(item => (
                        <DocumentItem
                          title={item.label}
                          as={NavLink}
                          to={item.to}
                          key={`${item.label}-${item.to}`}
                          actionArea={(
                            <DropdownMenu>
                              <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Item options" />
                              <DropdownMenuPortal>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem as="button" onClick={action('share')} icon="share">
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem as="button" onClick={action('rename')} icon="create-doc">
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
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
                      ))}
                    </DocumentGroup>
                  </DocumentGroupRoot>
                </>
              ),
            }, {
              key: 'personal',
              content: (
                <DocumentGroupRoot>
                  <DocumentGroup icon="space" title="Personal" value="personal">
                    {navigation.map(item => (
                      <DocumentItem
                        title={item.label}
                        as={NavLink}
                        to={item.to}
                        key={`${item.label}-${item.to}`}
                        actionArea={(
                          <DropdownMenu>
                            <DropdownMenuTrigger className="w-8! h-8!" iconTitle="Item options" />
                            <DropdownMenuPortal>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem as="button" onClick={action('share')} icon="share">
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem as="button" onClick={action('rename')} icon="create-doc">
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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
                    ))}
                  </DocumentGroup>
                </DocumentGroupRoot>
              ),
            },
            {
              key: 'Work',
              content: (
                <DocumentGroupRoot>
                  <DocumentGroup icon="space" title="Work Stuff" value="work-related">
                    No Document(s) in this space...
                  </DocumentGroup>
                </DocumentGroupRoot>
              ),
            },
            {
              key: 'Shared',
              content: (
                <DocumentGroupRoot>
                  <DocumentGroup icon="share" title="Shared" value="share">
                    No shared documents
                  </DocumentGroup>
                </DocumentGroupRoot>
              ),
            },
            {
              key: 'Deleted',
              content: (
                <DocumentGroupRoot>
                  <DocumentGroup icon="trash" title="Deleted" value="deleted">
                    No deleted documents
                  </DocumentGroup>
                </DocumentGroupRoot>
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
