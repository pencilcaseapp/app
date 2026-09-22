import {
  href,
  Link,
  matchPath,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router';
import {
  DocumentTitleProvider,
  useActiveDocumentTitle,
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
import {
  countOwnedDocuments,
  getDeletedDocumentList,
  getDocumentList,
} from '~/repos/document';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { useStableOrder } from '~/hooks/use-stable-order';
import { useLiveTitles } from '~/hooks/use-live-titles';
import {
  EditedDocumentProvider,
  useEditedDocument,
} from '~/contexts/edited-document';
import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { DeleteDocumentDialog } from '~/components/delete-document-dialog/delete-document-dialog';
import { RestoreDocumentMenu } from '~/components/restore-document-menu/restore-document-menu';
import { SidebarUpgrade } from '~/components/sidebar-upgrade/sidebar-upgrade';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { useIsMobile } from '~/hooks/use-is-mobile';

export const handle = {
  bodyClassName: 'w-full',
};

const bottomNavigation = [
  { label: 'Create Doc', to: href('/new'), icon: 'create-doc' },
];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  // The navigation also lists the documents shared with the user, which
  // none of their free allowance is spent on, so the usage meter counts
  // the ones they created themselves instead of the entries.
  const [documentList, deletedDocumentList, ownedDocumentCount] = user
    ? await Promise.all([
        getDocumentList(user.id),
        getDeletedDocumentList(user.id),
        countOwnedDocuments(user.id),
      ])
    : [[], [], 0];
  const navigation = documentList.map(doc => ({
    id: doc.id,
    label: doc.title ?? 'Untitled',
    to: href('/doc/:id', { id: doc.id }),
    linkShared: doc.linkShared,
    isOwner: doc.userId === user?.id,
  }));
  const deletedNavigation = deletedDocumentList.map(doc => ({
    id: doc.id,
    label: doc.title ?? 'Untitled',
    to: href('/doc/:id', { id: doc.id }),
  }));

  return {
    user,
    navigation,
    deletedNavigation,
    ownedDocumentCount,
  };
}

export default function LayoutEditor({
  loaderData: {
    user,
    navigation,
    deletedNavigation,
    ownedDocumentCount,
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
                    ownedDocumentCount={ownedDocumentCount}
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
  linkShared: boolean;
  isOwner: boolean;
};
type DeletedItemData = { id: string; label: string; to: string };
type DocumentToDelete = { id: string; label: string; linkShared: boolean };

export interface EditorSidebarProps extends PropsWithChildren {
  navigation: NavigationItemData[];
  deletedNavigation: DeletedItemData[];
  /** Documents the user created themselves, what the meter shows. */
  ownedDocumentCount: number;
  showUpgrade?: boolean;
}

const getNavigationKey = (item: NavigationItemData) => item.to;
const getItemId = (item: { id: string }) => item.id;
const getItemLabel = (item: { label: string }) => item.label;

function EditorSidebar({
  navigation,
  deletedNavigation,
  ownedDocumentCount,
  showUpgrade,
  children,
}: EditorSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const activeDocument = useActiveDocumentTitle();
  const { closeOnNavigate } = useSidebarContext();
  const { editedDocumentId } = useEditedDocument();
  const [stableNavigation, moveToTop] = useStableOrder(
    navigation,
    getNavigationKey,
  );
  const allItems = useMemo(
    () => [...navigation, ...deletedNavigation],
    [navigation, deletedNavigation],
  );
  // The editor's title for a document runs ahead of the one the loader
  // lists until the live server has stored it, so the list keeps showing
  // the editor's until then — for the open document and the one just left.
  const liveTitles = useLiveTitles(
    allItems,
    getItemId,
    getItemLabel,
    activeDocument,
  );
  // The document stays set while the dialog animates out, so its
  // title does not vanish from the copy mid-close.
  const [documentToDelete, setDocumentToDelete]
    = useState<DocumentToDelete>();
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
                    {stableNavigation.length === 0 && (
                      <DocumentGroupEmpty icon="no-docs">
                        No documents
                      </DocumentGroupEmpty>
                    )}
                    {stableNavigation.map((item) => {
                      const label = liveTitles.get(item.id) ?? item.label;

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
                                        linkShared: item.linkShared,
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
                    linkShared={documentToDelete.linkShared}
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
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
                  {deletedNavigation.map((item) => {
                    const label = liveTitles.get(item.id) ?? item.label;

                    return (
                      <DocumentItem
                        title={label}
                        as={NavLink}
                        to={item.to}
                        key={item.to}
                        onClick={closeOnNavigate}
                        actionArea={(
                          <RestoreDocumentMenu documentId={item.id} />
                        )}
                      />
                    );
                  })}
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
                documentCount={ownedDocumentCount}
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
