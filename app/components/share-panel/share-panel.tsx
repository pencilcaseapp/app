import { href, useFetcher } from 'react-router';
import { useMedia } from 'react-use';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import { Button } from '~/ui/button/button';
import { CopyLinkButton } from '~/ui/copy-link-button/copy-link-button';
import { DropdownMenu } from '~/ui/dropdown-menu/dropdown-menu';
import { DropdownMenuContent } from '~/ui/dropdown-menu/dropdown-menu-content';
import { DropdownMenuPortal } from '~/ui/dropdown-menu/dropdown-menu-portal';
import { DropdownMenuTrigger } from '~/ui/dropdown-menu/dropdown-menu-trigger';
import { Switch } from '~/ui/switch/switch';
import { Typography } from '~/ui/typography/typography';

export interface SharePanelProps {
  documentId: string;
  shared: boolean;
  shareUrl: string;
  defaultOpen?: boolean;
}

export const SharePanel: React.FC<SharePanelProps> = ({
  documentId,
  shared,
  shareUrl,
  defaultOpen,
}) => {
  const fetcher = useFetcher();
  const csrfToken = useAuthenticityToken();
  const isMobile = useMedia('(max-width: 640px)', false);

  const isShared = fetcher.formData
    ? fetcher.formData.get('shared') === 'true'
    : shared;

  const handleToggle = (checked: boolean) => {
    fetcher.submit(
      { shared: String(checked), csrf: csrfToken },
      { method: 'post', action: href('/doc/:id', { id: documentId }) },
    );
  };

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>
        {isMobile
          ? (
              <Button
                type="button"
                icon="share"
                iconTitle="Share"
                colorLight="secondary"
              />
            )
          : (
              <Button type="button" icon="share" colorLight="secondary">
                Share
              </Button>
            )}
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="w-75 gap-1 p-3">
          <Typography
            variant="bodySmall"
            fontWeight="semibold"
            textColorLight="grey-900"
            textColorDark="white"
            className="pb-1"
          >
            Share document
          </Typography>
          <div className="flex items-start gap-4 pb-8">
            <Typography
              variant="bodyTiny"
              textColorLight="black"
              textColorDark="white"
              className="flex-1"
            >
              Anyone with the link can view and edit this document.
            </Typography>
            <Switch
              id="document-sharing"
              aria-label="Share document"
              checked={isShared}
              onCheckedChange={handleToggle}
            />
          </div>
          <CopyLinkButton
            className="w-full"
            colorLight="primary"
            link={shareUrl}
            label="Copy link"
            copiedLabel="Link copied!"
            disabled={!isShared}
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
