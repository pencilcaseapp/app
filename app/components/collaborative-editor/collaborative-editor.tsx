import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import { type Provider } from '@lexical/yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '~/ui/editor/editor';
import { AssetUrlsContext } from '~/contexts/asset-urls';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSocketClient } from '~/contexts/socket-client';
import { useExtractDocumentTitle } from '~/hooks/use-extract-document-title';
import { useFirstLocalEdit } from '~/hooks/use-first-local-edit';
import { useAccessRevoked } from '~/hooks/use-access-revoked';
import { useCollaborators } from '~/hooks/use-collaborators';
import { useCursorNameBounds } from '~/hooks/use-cursor-name-bounds';
import { useRemoteCursorPositions } from '~/hooks/use-remote-cursor-positions';
import { useCopyImage } from '~/hooks/use-copy-image';
import { useUploadImage } from '~/hooks/use-upload-image';
import { useLiveImagesReady } from '~/hooks/use-live-images-ready';
import { getGuestId } from '~/utils/guest-id';
import {
  getGuestPresenceIdentity,
  type Collaborator,
  type PresenceAwarenessData,
} from '~/utils/presence';

export interface CollaborativeEditorProps {
  id: string;
  presence: Collaborator | null;
  onTitleChange?: (title: string | null) => void;
  onFirstEdit?: () => void;
  onAccessRevoked?: () => void;
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
  editable?: boolean;
  notification?: React.ReactNode;
  /** The content as the server drew it, shown until the first sync. */
  preview?: string | null;
  /** The signed CDN URLs of the document's images, by their `src`. */
  assetUrls?: Record<string, string>;
}

const NO_ASSET_URLS: Record<string, string> = {};

export const CollaborativeEditor: React.FC<CollaborativeEditorProps>
  = ({
    id,
    presence,
    onTitleChange,
    onFirstEdit,
    onAccessRevoked,
    topbarLeft,
    topbarRight,
    editable,
    notification,
    preview,
    assetUrls = NO_ASSET_URLS,
  }) => {
    // Only the first sync: after a dropped connection the editor keeps what
    // it has, which is newer than the preview.
    const [hasSynced, setHasSynced] = useState(false);
    // The ones the page loaded with: a revalidation signs new URLs, which
    // would load every image again.
    const [initialAssetUrls] = useState(assetUrls);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasImagesReady = useLiveImagesReady(containerRef, hasSynced);
    const ref = useRef<HTMLDivElement>(null);
    const socketClient = useSocketClient();
    // A signed out visitor is identified by a guest id kept in their browser,
    // so they keep their name and colour when they come back.
    const [identity] = useState(
      () => presence ?? getGuestPresenceIdentity(getGuestId()),
    );
    // Lexical re-runs its awareness effects whenever this changes identity,
    // so it has to stay the same object for as long as the editor is open.
    const awarenessData = useMemo<PresenceAwarenessData>(
      () => ({ presenceId: identity.id }),
      [identity.id],
    );
    const [doc] = useState(() => new Y.Doc());
    useExtractDocumentTitle(doc, onTitleChange);
    const [provider] = useState(() => new HocuspocusProvider({
      name: id,
      websocketProvider: socketClient,
      document: doc,
      onSynced: ({ state }) => {
        if (state) {
          setHasSynced(true);
        }
      },
    }));

    const collaborators = useCollaborators(provider);

    useCursorNameBounds(ref);
    const syncCursorPositionsFn = useRemoteCursorPositions(ref);
    useFirstLocalEdit(doc, provider, onFirstEdit);
    useAccessRevoked(provider, onAccessRevoked);
    const uploadImage = useUploadImage(id);
    const copyImage = useCopyImage(id);

    const [providerFactory] = useState(() => (
      id: string,
      yjsDocMap: Map<string, Y.Doc>,
    ): Provider => {
      yjsDocMap.set(id, doc);

      return {
        // @ts-expect-error type mismatch
        awareness: provider.awareness,
        connect: () => {
          if (!provider.isAttached) {
            provider.attach();
          }
        },
        disconnect: () => {},
        on: provider.on.bind(provider),
        off: provider.off.bind(provider),
      };
    });

    useEffect(() => {
      return () => {
        provider.detach();
      };
    }, [provider]);

    return (
      <div ref={containerRef} className="contents">
        <AssetUrlsContext value={initialAssetUrls}>
          <LexicalCollaboration>
            <Editor
              avatars={collaborators}
              topbarLeft={topbarLeft}
              topbarRight={topbarRight}
              editable={editable}
              notification={notification}
              uploadImage={uploadImage}
              copyImage={copyImage}
              // Editing only starts once the live document is here: until then
              // the reader sees what the server drew.
              preview={hasImagesReady ? null : preview}
              // Inside the content, so the cursors scroll along with it — also
              // while typing, when the content scrolls in the editor rather
              // than the page.
              contentOverlay={<div ref={ref} />}
            >
              <CollaborationPlugin
                id={id}
                providerFactory={providerFactory}
                shouldBootstrap={true}
                username={identity.name}
                cursorColor={identity.color}
                awarenessData={awarenessData}
                cursorsContainerRef={ref}
                selectionHighlight
                syncCursorPositionsFn={syncCursorPositionsFn}
              />
            </Editor>
          </LexicalCollaboration>
        </AssetUrlsContext>
      </div>
    );
  };
