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
import { hasReachedDocumentLimit } from '~/services/document';
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
import { DocumentLimitDialog } from '~/components/document-limit-dialog/document-limit-dialog';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import type { DocumentShareState } from '~/constants/document';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { readSidebarOpen, storeSidebarOpen } from '~/utils/sidebar-cookie';

export const handle = {
  bodyClassName: 'w-full',
};

/**
 * What the navigation marks a document as. Anyone with the link can open
 * it whether or not people were invited as well, so the link wins over
 * the invites.
 */
function getShareState(
  document: { linkShared: boolean; inviteShared: boolean },
): DocumentShareState {
  if (document.linkShared) {
    return 'link';
  }

  if (document.inviteShared) {
    return 'invite';
  }

  return 'private';
}

export async function loader({ context, request }: Route.LoaderArgs) {
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
    shareState: getShareState(doc),
    isOwner: doc.userId === user?.id,
  }));
  const deletedNavigation = deletedDocumentList.map(doc => ({
    id: doc.id,
    label: doc.title ?? 'Untitled',
    to: href('/doc/:id', { id: doc.id }),
  }));

  return {
    user,
    sidebarOpen: await readSidebarOpen(request),
    navigation,
    deletedNavigation,
    ownedDocumentCount,
    documentLimitReached: user
      ? hasReachedDocumentLimit(user, ownedDocumentCount)
      : false,
  };
}

export default function LayoutEditor({
  loaderData: {
    user,
    sidebarOpen,
    navigation,
    deletedNavigation,
    ownedDocumentCount,
    documentLimitReached,
  },
}: Route.ComponentProps) {
  return (
    <DocumentTitleProvider>
      <EditedDocumentProvider>
        <SocketClientProvider>
          <SidebarProvider
            defaultDesktopOpen={sidebarOpen}
            onDesktopOpenChange={storeSidebarOpen}
          >
            {user
              ? (
                  <EditorSidebar
                    navigation={navigation}
                    deletedNavigation={deletedNavigation}
                    ownedDocumentCount={ownedDocumentCount}
                    documentLimitReached={documentLimitReached}
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
  shareState: DocumentShareState;
  isOwner: boolean;
};
type DeletedItemData = { id: string; label: string; to: string };
type DocumentToDelete = { id: string; label: string; linkShared: boolean };

export interface EditorSidebarProps extends PropsWithChildren {
  navigation: NavigationItemData[];
  deletedNavigation: DeletedItemData[];
  /** Documents the user created themselves, what the meter shows. */
  ownedDocumentCount: number;
  /** "Create Doc" opens the upgrade dialog instead of `/new`. */
  documentLimitReached: boolean;
  showUpgrade?: boolean;
}

const getNavigationKey = (item: NavigationItemData) => item.to;
const getItemId = (item: { id: string }) => item.id;
const getItemLabel = (item: { label: string }) => item.label;

function EditorSidebar({
  navigation,
  deletedNavigation,
  ownedDocumentCount,
  documentLimitReached,
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
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
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
  const checkoutUrl = documentMatch?.params.id
    ? href('/doc/:id/checkout', { id: documentMatch.params.id })
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
                          shareState={item.shareState}
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
                                <DropdownMenuContent
                                  align={isMobile ? 'end' : 'start'}
                                >
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
                {/* Not in the bottom area, which the slim sidebar
                    renders a second time. */}
                <DocumentLimitDialog
                  checkoutUrl={checkoutUrl}
                  open={isLimitDialogOpen}
                  onOpenChange={setIsLimitDialogOpen}
                />
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
            {documentLimitReached
              ? (
                  <NavigationItem
                    // The sidebar stays open on mobile, the drawer
                    // stacks on top of it.
                    onClick={() => setIsLimitDialogOpen(true)}
                    title="Create Doc"
                    icon="create-doc"
                    as="button"
                    type="button"
                  />
                )
              : (
                  <NavigationItem
                    onClick={closeOnNavigate}
                    title="Create Doc"
                    to={href('/new')}
                    icon="create-doc"
                    as={NavLink}
                  />
                )}
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
