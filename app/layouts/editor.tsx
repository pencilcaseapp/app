import { href, NavLink, Outlet } from 'react-router';
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
import type { Route } from './+types/editor';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getDocumentList } from '~/repos/document';

export const handle = {
  bodyClassName: 'w-full bg-pca-white dark:bg-pca-grey-900',
};

const bottomNavigation = [
  { label: 'Create Doc', to: href('/new'), icon: 'create-doc' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const documentList = user ? await getDocumentList(user.id) : [];
  const navigation = documentList.map(doc => ({
    label: doc.title ?? 'Untitled',
    to: href('/doc/:id', { id: doc.id }),
  }));

  return {
    user,
    navigation,
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
                    <DocumentGroupRoot defaultValue={['all-docs']}>
                      <DocumentGroup icon="space" title="All Docs" value="all-docs">
                        {loaderData.navigation.map(item => (
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
