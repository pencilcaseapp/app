import { NavLink, Outlet, type MiddlewareFunction } from 'react-router';
import { optionalAuthMiddleware } from '~/middleware/auth';
import { SocketClientProvider } from '~/contexts/socket-client';
import { DocumentGroup } from '~/ui/document-group/document-group';
import { DocumentGroupRoot } from '~/ui/document-group/document-root';
import { DocumentItem } from '~/ui/document-item/document-item';
import { DropdownMenu } from '~/ui/dropdown-menu/dropdown-menu';
import { DropdownMenuContent } from '~/ui/dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '~/ui/dropdown-menu/dropdown-menu-item';
import { DropdownMenuPortal } from '~/ui/dropdown-menu/dropdown-menu-portal';
import { DropdownMenuSeparator } from '~/ui/dropdown-menu/dropdown-menu-separator';
import { DropdownMenuTrigger } from '~/ui/dropdown-menu/dropdown-menu-trigger';
import type { IconName } from '~/ui/icon/icons';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { SidebarProvider } from '~/ui/sidebar-context/sidebar-provider';
import { Sidebar } from '~/ui/sidebar/sidebar';
import { optionalUserSessionContext } from '~/contexts/user-session';
import type { Route } from './+types/editor';

export const middleware: MiddlewareFunction[] = [
  optionalAuthMiddleware,
];

export const handle = {
  bodyClassName: 'w-full bg-pca-white dark:bg-pca-grey-900',
};

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

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);

  return {
    user,
  };
}

export default function LayoutEditor({ loaderData }: Route.ComponentProps) {
  return (
    <SocketClientProvider>
      <SidebarProvider>
        {loaderData.user && (
          <Sidebar
            items={[
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
                                <DropdownMenuTrigger iconTitle="Item options" />
                                <DropdownMenuPortal>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem as="button" onClick={() => console.log('clicked...')} icon="share">
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem as="button" onClick={() => console.log('clicked...')} icon="create-doc">
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem as="button" onClick={() => console.log('clicked')} color="danger" icon="trash">
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
                              <DropdownMenuTrigger iconTitle="Item options" />
                              <DropdownMenuPortal>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem as="button" onClick={() => console.log('clicked')} icon="share">
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem as="button" onClick={() => console.log('clicked')} icon="create-doc">
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem as="button" onClick={() => console.log('clicked')} color="danger" icon="trash">
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
        )}
        <Outlet />
      </SidebarProvider>
    </SocketClientProvider>
  );
};
