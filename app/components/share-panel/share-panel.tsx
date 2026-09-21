import { href, useFetcher } from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
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
  shareUrl: string;
  owner: PersonWithAccess;
  defaultOpen?: boolean;
}

export const SharePanel: React.FC<SharePanelProps> = ({
  documentId,
  shared,
  shareUrl,
  owner,
  defaultOpen,
}) => {
  const fetcher = useFetcher();
  const csrfToken = useAuthenticityToken();
  const isMobile = useIsMobile();
  const canShare = useCanShare();

  const isShared = fetcher.formData
    ? fetcher.formData.get('shared') === 'true'
    : shared;

  const handleToggle = (checked: boolean) => {
    fetcher.submit(
      { shared: String(checked), csrf: csrfToken },
      { method: 'post', action: href('/doc/:id', { id: documentId }) },
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
        <ShareLinkAccess isShared={isShared} onSharedChange={handleToggle} />
        <Separator />
        <PeopleWithAccess owner={owner} />
      </ResponsivePanelContent>
    </ResponsivePanel>
  );
};
