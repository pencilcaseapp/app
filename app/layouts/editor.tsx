import { href, matchPath, NavLink, Outlet, useLocation } from 'react-router';
import {
  DocumentTitleProvider,
  useDocumentTitle,
} from '~/contexts/document-title';
import { SocketClientProvider } from '~/contexts/socket-client';
import { DocumentGroup } from '~/ui/document-group/document-group';
import { DocumentGroupEmpty } from '~/ui/document-group/document-group-empty';
import { DocumentGroupRoot } from '~/ui/document-group/document-root';
import { DocumentItem } from '~/ui/document-item/document-item';
import { DropdownMenu } from '~/ui/dropdown-menu/dropdown-menu';
import { DropdownMenuContent } from '~/ui/dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '~/ui/dropdown-menu/dropdown-menu-item';
import { DropdownMenuPortal } from '~/ui/dropdown-menu/dropdown-menu-portal';
import { DropdownMenuTrigger } from '~/ui/dropdown-menu/dropdown-menu-trigger';
import type { IconName } from '~/ui/icon/icons';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { SidebarProvider } from '~/ui/sidebar-context/sidebar-provider';
import { Sidebar } from '~/ui/sidebar/sidebar';
import type { Route } from './+types/editor';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getDocumentList } from '~/repos/document';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { useStableOrder } from '~/hooks/use-stable-order';
import {
  EditedDocumentProvider,
  useEditedDocument,
} from '~/contexts/edited-document';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { DeleteDocumentDialog } from '~/components/delete-document-dialog/delete-document-dialog';
import { SidebarUpgrade } from '~/components/sidebar-upgrade/sidebar-upgrade';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { useIsMobile } from '~/hooks/use-is-mobile';

export const handle = {
  bodyClassName: 'w-full bg-pca-white dark:bg-pca-grey-900',
};

const bottomNavigation = [
  { label: 'Create Doc', to: href('/new'), icon: 'create-doc' },
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

export default function LayoutEditor({
  loaderData: {
    user,
    navigation,
  },
}: Route.ComponentProps) {
  return (
    <DocumentTitleProvider>
      <EditedDocumentProvider>
        <SocketClientProvider>
          <SidebarProvider>
            {user
              ? (
                  <EditorSidebar
                    navigation={navigation}
                    showUpgrade={!user.hasSubscription}
                  >
                    <Outlet />
                  </EditorSidebar>
                )
              : <Outlet />}
          </SidebarProvider>
        </SocketClientProvider>
      </EditedDocumentProvider>
    </DocumentTitleProvider>
  );
};

type NavigationItemData = { label: string; to: string };

export interface EditorSidebarProps extends PropsWithChildren {
  navigation: NavigationItemData[];
  showUpgrade?: boolean;
}

const getNavigationKey = (item: NavigationItemData) => item.to;

function EditorSidebar({
  navigation,
  showUpgrade,
  children,
}: EditorSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [activeDocumentTitle] = useDocumentTitle();
  const { closeOnNavigate } = useSidebarContext();
  const { editedDocumentId } = useEditedDocument();
  const [stableNavigation, moveToTop] = useStableOrder(
    navigation,
    getNavigationKey,
  );
  // The document stays set while the dialog animates out, so its
  // title does not vanish from the copy mid-close.
  const [documentToDelete, setDocumentToDelete]
    = useState<NavigationItemData>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Settings lives under the open document, so the entry only exists
  // while one is open (the only editor page — `/new` always redirects).
  const documentMatch = matchPath(
    { path: '/doc/:id', end: false },
    location.pathname,
  );
  // Off mobile the link skips the menu page and opens the account
  // section straight away.
  const settingsPath = isMobile
    ? '/doc/:id/settings'
    : '/doc/:id/settings/account';
  const settingsUrl = documentMatch?.params.id
    ? href(settingsPath, { id: documentMatch.params.id })
    : null;

  useEffect(() => {
    if (!editedDocumentId) {
      return;
    }

    moveToTop(href('/doc/:id', { id: editedDocumentId }));
  }, [editedDocumentId, moveToTop]);

  return (
    <>
      <Sidebar
        items={[
          {
            key: 'all-docs',
            content: (
              <>
                <DocumentGroupRoot defaultValue={['all-docs']}>
                  <DocumentGroup icon="space" title="All Docs" value="all-docs">
                    {stableNavigation.map((item) => {
                      const isActive = item.to === location.pathname;
                      const label = isActive ? activeDocumentTitle : item.label;

                      return (
                        <DocumentItem
                          title={label}
                          as={NavLink}
                          to={item.to}
                          key={item.to}
                          onClick={closeOnNavigate}
                          actionArea={(
                            <DropdownMenu>
                              <DropdownMenuTrigger iconTitle="Item options" />
                              <DropdownMenuPortal>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    as="button"
                                    onClick={() => {
                                      setDocumentToDelete({ ...item, label });
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    color="danger"
                                    icon="trash"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenuPortal>
                            </DropdownMenu>
                          )}
                        >
                          {label}
                        </DocumentItem>
                      );
                    })}
                  </DocumentGroup>
                </DocumentGroupRoot>
                <DeleteDocumentDialog
                  documentTitle={documentToDelete?.label}
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                  onConfirm={() => {
                    console.log('delete', documentToDelete?.to);
                    setIsDeleteDialogOpen(false);
                  }}
                />
              </>
            ),
          },
          {
            key: 'Deleted',
            content: (
              <DocumentGroupRoot>
                <DocumentGroup icon="trash" title="Deleted" value="deleted">
                  <DocumentGroupEmpty
                    icon="no-docs"
                  >
                    No deleted documents
                  </DocumentGroupEmpty>
                </DocumentGroup>
              </DocumentGroupRoot>
            ),
          },
        ]}
        // The upgrade area adds the meter block, the button, and the
        // column gap on top of the footer's base height.
        reservedFooterHeight={showUpgrade ? 223 : 123}
        bottomArea={(
          <>
            {showUpgrade && (
              <SidebarUpgrade
                documentCount={navigation.length}
                documentLimit={FREE_DOCUMENT_LIMIT}
              />
            )}
            {bottomNavigation?.map(item => (
              <NavigationItem
                onClick={closeOnNavigate}
                key={`${item.label}-${item.to}`}
                title={item.label}
                to={item.to}
                icon={item.icon as IconName}
                as={NavLink}
              />
            ))}
            {settingsUrl && (
              <NavigationItem
                // On mobile the sidebar stays open: the settings drawer
                // stacks on top of it instead of replacing it.
                onClick={isMobile ? undefined : closeOnNavigate}
                title="Settings"
                to={settingsUrl}
                icon="settings"
                as={NavLink}
              />
            )}
          </>
        )}
      >
        {children}
      </Sidebar>
    </>
  );
}
