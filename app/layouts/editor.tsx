import {
  href,
  Link,
  matchPath,
  NavLink,
  Outlet,
  useFetcher,
  useLocation,
  useNavigate,
} from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
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
import { getDeletedDocumentList, getDocumentList } from '~/repos/document';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { useStableOrder } from '~/hooks/use-stable-order';
import {
  EditedDocumentProvider,
  useEditedDocument,
} from '~/contexts/edited-document';
import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
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
  const [documentList, deletedDocumentList] = user
    ? await Promise.all([
        getDocumentList(user.id),
        getDeletedDocumentList(user.id),
      ])
    : [[], []];
  const navigation = documentList.map(doc => ({
    id: doc.id,
    label: doc.title ?? 'Untitled',
    to: href('/doc/:id', { id: doc.id }),
    isOwner: doc.userId === user?.id,
  }));
  const deletedNavigation = deletedDocumentList.map(doc => ({
    id: doc.id,
    label: doc.title ?? 'Untitled',
  }));

  return {
    user,
    navigation,
    deletedNavigation,
  };
}

export default function LayoutEditor({
  loaderData: {
    user,
    navigation,
    deletedNavigation,
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
                    deletedNavigation={deletedNavigation}
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

type NavigationItemData = {
  id: string;
  label: string;
  to: string;
  isOwner: boolean;
};
type DeletedItemData = { id: string; label: string };

export interface EditorSidebarProps extends PropsWithChildren {
  navigation: NavigationItemData[];
  deletedNavigation: DeletedItemData[];
  showUpgrade?: boolean;
}

const getNavigationKey = (item: NavigationItemData) => item.to;

function EditorSidebar({
  navigation,
  deletedNavigation,
  showUpgrade,
  children,
}: EditorSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
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
    = useState<DeletedItemData>();
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
  const upgradeUrl = documentMatch?.params.id
    ? href('/doc/:id/settings/subscription', { id: documentMatch.params.id })
    : href('/upgrade');

  useEffect(() => {
    if (!editedDocumentId) {
      return;
    }

    moveToTop(href('/doc/:id', { id: editedDocumentId }));
  }, [editedDocumentId, moveToTop]);

  // Deleting the open document would leave the editor on a not found
  // page; the startpage picks the next document (or creates one).
  const onDeleted = useCallback((documentId: string) => {
    if (documentMatch?.params.id === documentId) {
      void navigate(href('/'));
    }
  }, [documentMatch?.params.id, navigate]);

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
                          // Only the owner may delete, so a collaborator
                          // gets no menu at all.
                          actionArea={item.isOwner && (
                            <DropdownMenu>
                              <DropdownMenuTrigger iconTitle="Item options" />
                              <DropdownMenuPortal>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    as="button"
                                    onClick={() => {
                                      setDocumentToDelete({
                                        id: item.id,
                                        label,
                                      });
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
                {documentToDelete && (
                  <DeleteDocumentDialog
                    documentId={documentToDelete.id}
                    documentTitle={documentToDelete.label}
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onDeleted={onDeleted}
                  />
                )}
              </>
            ),
          },
          {
            key: 'deleted',
            content: (
              <DocumentGroupRoot>
                <DocumentGroup icon="trash" title="Deleted" value="deleted">
                  {deletedNavigation.length === 0 && (
                    <DocumentGroupEmpty icon="no-docs">
                      No deleted documents
                    </DocumentGroupEmpty>
                  )}
                  {deletedNavigation.map(item => (
                    // A deleted document cannot be opened, so the row is
                    // not a link; restoring is its only action.
                    <DocumentItem
                      as="div"
                      title={item.label}
                      key={item.id}
                      actionArea={<RestoreDocumentMenu documentId={item.id} />}
                    />
                  ))}
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
                to={upgradeUrl}
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
                // The dialog opens over the document, so the document
                // keeps the scroll position it is opened from.
                preventScrollReset
                icon="settings"
                // A plain link, so opening the dialog does not mark the
                // entry as the active page.
                as={Link}
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

function RestoreDocumentMenu({ documentId }: { documentId: string }) {
  const fetcher = useFetcher();
  const csrfToken = useAuthenticityToken();

  const restore = () => {
    void fetcher.submit(
      { csrf: csrfToken },
      { method: 'post', action: href('/doc/:id/restore', { id: documentId }) },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger iconTitle="Item options" />
      <DropdownMenuPortal>
        <DropdownMenuContent align="start">
          <DropdownMenuItem as="button" onClick={restore} icon="restore">
            Restore
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
