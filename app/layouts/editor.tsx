import {
  href,
  Link,
  matchPath,
  NavLink,
  Outlet,
  useLocation,
  useRevalidator,
} from 'react-router';
import {
  DocumentTitleProvider,
  useActiveDocumentTitle,
} from '~/contexts/document-title';
import { SocketClientProvider } from '~/contexts/socket-client';
import { DocumentGroupEmpty } from '~/ui/document-group/document-group-empty';
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
  getDocumentNavigation,
  hasReachedDocumentLimit,
  type DocumentNavigation,
} from '~/services/document';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { useStableOrder } from '~/hooks/use-stable-order';
import { useLiveTitles } from '~/hooks/use-live-titles';
import {
  EditedDocumentProvider,
  useEditedDocument,
} from '~/contexts/edited-document';
import { LeavingDocumentProvider } from '~/contexts/leaving-document';
import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  DeleteDocumentDialog,
  type DocumentToDelete,
} from '~/components/delete-document-dialog/delete-document-dialog';
import { RestoreDocumentMenu } from '~/components/restore-document-menu/restore-document-menu';
import { SidebarUpgrade } from '~/components/sidebar-upgrade/sidebar-upgrade';
import { DocumentLimitDialog } from '~/components/document-limit-dialog/document-limit-dialog';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import type {
  DocumentFolder,
  DocumentShareState,
} from '~/constants/document';
import { FolderSwitch, type FolderSwitchItem } from '~/ui/folder-switch/folder-switch';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { isNativeAppRequest } from '~/utils/native-app';
import { readUserPrefs, storeUserPrefs } from '~/utils/user-prefs-cookie';

export const handle = {
  bodyClassName: 'w-full',
};

/**
 * What the navigation marks a document as. Anyone with the link can open
 * it whether or not people were invited as well, so the link wins over
 * the invites.
 */
function getShareState(
  document: { linkShared?: boolean; inviteShared?: boolean },
): DocumentShareState {
  if (document.linkShared) {
    return 'link';
  }

  if (document.inviteShared) {
    return 'invite';
  }

  return 'private';
}

const EMPTY_NAVIGATION: DocumentNavigation = {
  documents: [],
  ownedCount: 0,
  counts: { all: 0, shared: 0, deleted: 0 },
};

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const { sidebarOpen, folder } = await readUserPrefs(request);
  // The navigation also lists the documents shared with the user, which
  // none of their free allowance is spent on, so the usage meter counts
  // the ones they created themselves instead of the entries.
  const { documents, ownedCount: ownedDocumentCount, counts } = user
    ? await getDocumentNavigation(user.id, folder)
    : EMPTY_NAVIGATION;
  const navigation = documents.map(doc => ({
    id: doc.id,
    label: doc.title ?? 'Untitled',
    to: href('/doc/:id', { id: doc.id }),
    shareState: getShareState(doc),
    isOwner: doc.userId === user?.id,
  }));

  return {
    user,
    sidebarOpen,
    folder,
    folderCounts: counts,
    navigation,
    ownedDocumentCount,
    documentLimitReached: user
      ? hasReachedDocumentLimit(user, ownedDocumentCount)
      : false,
    isNativeApp: isNativeAppRequest(request),
  };
}

export default function LayoutEditor({
  loaderData: {
    user,
    sidebarOpen,
    folder,
    folderCounts,
    navigation,
    ownedDocumentCount,
    documentLimitReached,
    isNativeApp,
  },
}: Route.ComponentProps) {
  return (
    <DocumentTitleProvider>
      <EditedDocumentProvider>
        <LeavingDocumentProvider>
          <SocketClientProvider>
            <SidebarProvider
              defaultDesktopOpen={sidebarOpen}
              onDesktopOpenChange={
                isOpen => storeUserPrefs({ sidebarOpen: isOpen })
              }
            >
              {user
                ? (
                    <EditorSidebar
                      folder={folder}
                      folderCounts={folderCounts}
                      navigation={navigation}
                      ownedDocumentCount={ownedDocumentCount}
                      documentLimitReached={documentLimitReached}
                      showUpgrade={!user.hasSubscription}
                      isNativeApp={isNativeApp}
                    >
                      <Outlet />
                    </EditorSidebar>
                  )
                : <Outlet />}
            </SidebarProvider>
          </SocketClientProvider>
        </LeavingDocumentProvider>
      </EditedDocumentProvider>
    </DocumentTitleProvider>
  );
};

type NavigationItemData = {
  id: string;
  label: string;
  to: string;
  shareState: DocumentShareState;
  isOwner: boolean;
};

export interface EditorSidebarProps extends PropsWithChildren {
  /** The folder the loader listed `navigation` for. */
  folder: DocumentFolder;
  folderCounts: Record<DocumentFolder, number>;
  navigation: NavigationItemData[];
  /** Documents the user created themselves, what the meter shows. */
  ownedDocumentCount: number;
  /** "Create Doc" opens the upgrade dialog instead of `/new`. */
  documentLimitReached: boolean;
  showUpgrade?: boolean;
  /** The native apps sell nothing: no meter and no offer. */
  isNativeApp?: boolean;
}

const getNavigationKey = (item: NavigationItemData) => item.to;
const getItemId = (item: { id: string }) => item.id;
const getItemLabel = (item: { label: string }) => item.label;

const FOLDER_LABELS: Record<DocumentFolder, string> = {
  all: 'All Docs',
  shared: 'Shared with you',
  deleted: 'Deleted',
};

const EMPTY_FOLDER_COPIES: Record<DocumentFolder, string> = {
  all: 'No documents',
  shared: 'No documents shared with you',
  deleted: 'No deleted documents',
};

function EditorSidebar({
  folder,
  folderCounts,
  navigation,
  ownedDocumentCount,
  documentLimitReached,
  showUpgrade,
  isNativeApp,
  children,
}: EditorSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const revalidator = useRevalidator();
  const activeDocument = useActiveDocumentTitle();
  const { closeOnNavigate } = useSidebarContext();
  const { editedDocumentId } = useEditedDocument();
  const [stableNavigation, moveToTop] = useStableOrder(
    navigation,
    getNavigationKey,
  );
  // The editor's title for a document runs ahead of the one the loader
  // lists until the live server has stored it, so the list keeps showing
  // the editor's until then — for the open document and the one just left.
  const liveTitles = useLiveTitles(
    navigation,
    getItemId,
    getItemLabel,
    activeDocument,
  );
  // The switch shows the picked folder straight away and keeps showing
  // it until the loader lists that folder. The revalidation settles a
  // moment before its data renders, so it cannot be the signal.
  const [pendingFolder, setPendingFolder] = useState<DocumentFolder>();
  if (pendingFolder === folder) {
    setPendingFolder(undefined);
  }
  const isSwitchingFolder = pendingFolder !== undefined;
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
  const folderGroups: FolderSwitchItem<DocumentFolder>[][] = [
    [
      {
        value: 'all',
        label: FOLDER_LABELS.all,
        icon: 'space',
        count: folderCounts.all,
      },
      {
        value: 'shared',
        label: FOLDER_LABELS.shared,
        icon: 'users',
        count: folderCounts.shared,
      },
    ],
    [
      {
        value: 'deleted',
        label: FOLDER_LABELS.deleted,
        icon: 'trash',
        count: folderCounts.deleted,
      },
    ],
  ];

  useEffect(() => {
    if (!editedDocumentId) {
      return;
    }

    moveToTop(href('/doc/:id', { id: editedDocumentId }));
  }, [editedDocumentId, moveToTop]);

  const switchFolder = async (nextFolder: DocumentFolder) => {
    setPendingFolder(nextFolder);
    // The loader reads the folder from the cookie, so it is stored
    // before the navigation is loaded again.
    await storeUserPrefs({ folder: nextFolder });
    await revalidator.revalidate();
  };

  return (
    <>
      <Sidebar
        items={[
          {
            key: 'folder',
            content: (
              <>
                <div>
                  <div className="sticky top-0 z-10 bg-pca-white pb-1.5 dark:bg-pca-grey-900">
                    <FolderSwitch
                      groups={folderGroups}
                      value={pendingFolder ?? folder}
                      onValueChange={folder => void switchFolder(folder)}
                    />
                  </div>
                  <div
                    // A new list for every folder, so the rows of one do
                    // not glide into the places of the other.
                    key={folder}
                    aria-busy={isSwitchingFolder}
                    className="flex flex-col gap-1.5"
                  >
                    {stableNavigation.length === 0 && (
                      <DocumentGroupEmpty icon="no-docs">
                        {EMPTY_FOLDER_COPIES[folder]}
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
                          actionArea={folder === 'deleted'
                            ? <RestoreDocumentMenu documentId={item.id} />
                            : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    iconTitle="Item options"
                                  />
                                  <DropdownMenuPortal>
                                    <DropdownMenuContent
                                      align={isMobile ? 'end' : 'start'}
                                    >
                                      <DropdownMenuItem
                                        as="button"
                                        onClick={() => {
                                          setDocumentToDelete({
                                            id: item.id,
                                            title: label,
                                            shared:
                                              item.shareState !== 'private',
                                            isOwner: item.isOwner,
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
                  </div>
                </div>
                <DeleteDocumentDialog
                  document={documentToDelete}
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                />
                {/* Not in the bottom area, which the slim sidebar
                    renders a second time. */}
                <DocumentLimitDialog
                  checkoutUrl={isNativeApp ? undefined : checkoutUrl}
                  open={isLimitDialogOpen}
                  onOpenChange={setIsLimitDialogOpen}
                />
              </>
            ),
          },
        ]}
        // The upgrade area adds the meter block, the button, and the
        // column gap on top of the footer's base height.
        reservedFooterHeight={showUpgrade && !isNativeApp ? 223 : 123}
        bottomArea={(
          <>
            {showUpgrade && !isNativeApp && (
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
