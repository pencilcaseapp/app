import { href, useFetcher } from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import {
  DEFAULT_DOCUMENT_LINK_ACCESS,
  type DocumentLinkAccess,
} from '~/constants/document';
import { useCanShare } from '~/hooks/use-can-share';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { Button } from '~/ui/button/button';
import { CopyLinkButton } from '~/ui/copy-link-button/copy-link-button';
import {
  ResponsivePanel,
  ResponsivePanelTrigger,
} from '~/ui/responsive-panel/responsive-panel';
import {
  ResponsivePanelContent,
} from '~/ui/responsive-panel/responsive-panel-content';
import { Separator } from '~/ui/separator/separator';
import { ShareLinkButton } from '~/ui/share-link-button/share-link-button';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';
import type { PersonWithAccess } from './people-with-access';
import { PeopleWithAccess } from './people-with-access';
import { ShareLinkAccess } from './share-link-access';

// The link button plus the padding the drawer's footer area puts around it.
const DRAWER_FOOTER_HEIGHT = 64;

export interface SharePanelProps {
  documentId: string;
  shared: boolean;
  linkAccess: DocumentLinkAccess;
  shareUrl: string;
  owner: PersonWithAccess;
  defaultOpen?: boolean;
}

export const SharePanel: React.FC<SharePanelProps> = ({
  documentId,
  shared,
  linkAccess,
  shareUrl,
  owner,
  defaultOpen,
}) => {
  const fetcher = useFetcher();
  const accessFetcher = useFetcher();
  const csrfToken = useAuthenticityToken();
  const isMobile = useIsMobile();
  const canShare = useCanShare();

  const sharing = fetcher.formData?.get('shared');
  const isShared = sharing ? sharing === 'true' : shared;

  // Sharing puts the access back to viewing server side, so a link being
  // turned on shows that right away instead of what it allowed last time.
  const currentLinkAccess = accessFetcher.formData
    ? accessFetcher.formData.get('linkAccess') as DocumentLinkAccess
    : sharing === 'true'
      ? DEFAULT_DOCUMENT_LINK_ACCESS
      : linkAccess;

  const handleToggle = (checked: boolean) => {
    fetcher.submit(
      { shared: String(checked), csrf: csrfToken },
      { method: 'post', action: href('/doc/:id', { id: documentId }) },
    );
  };

  const handleLinkAccessChange = (next: DocumentLinkAccess) => {
    accessFetcher.submit(
      { linkAccess: next, csrf: csrfToken },
      {
        method: 'post',
        action: href('/doc/:id/link-access', { id: documentId }),
      },
    );
  };

  const linkButton = isMobile && canShare
    ? (
        <ShareLinkButton
          className="w-full"
          colorLight="grey-900"
          link={shareUrl}
          label="Share link"
          disabled={!isShared}
        />
      )
    : (
        <CopyLinkButton
          className="w-full"
          colorLight="grey-900"
          link={shareUrl}
          label="Copy link"
          copiedLabel="Link copied!"
          disabled={!isShared}
        />
      );

  return (
    <ResponsivePanel defaultOpen={defaultOpen}>
      <ResponsivePanelTrigger>
        {isMobile
          ? (
              <Button
                type="button"
                icon="share"
                iconTitle="Share"
                colorLight="glass"
              />
            )
          : (
              <Button type="button" icon="share" colorLight="glass">
                Share
              </Button>
            )}
      </ResponsivePanelTrigger>
      <ResponsivePanelContent
        title="Share document"
        className="w-95 max-w-[calc(100vw-1.5rem)]"
        maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        reservedFooterHeight={DRAWER_FOOTER_HEIGHT}
        footerArea={linkButton}
      >
        <ShareLinkAccess
          isShared={isShared}
          onSharedChange={handleToggle}
          linkAccess={currentLinkAccess}
          onLinkAccessChange={handleLinkAccessChange}
        />
        <Separator />
        <PeopleWithAccess owner={owner} />
      </ResponsivePanelContent>
    </ResponsivePanel>
  );
};
