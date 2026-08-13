import { href, useFetcher } from 'react-router';
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
  /** Opens the panel initially. Only used by stories and tests. */
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

  // Reflect the in-flight toggle optimistically so the switch responds
  // instantly while the submission is handled in the background.
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
        <Button type="button" icon="share" colorLight="secondary">
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="w-75 gap-3 p-3">
          <Typography
            variant="bodySmall"
            fontWeight="semibold"
            textColorLight="grey-900"
            textColorDark="white"
          >
            Share document
          </Typography>
          <div className="flex items-start justify-between gap-3">
            <Typography
              variant="bodyTiny"
              textColorLight="grey-600"
              textColorDark="grey-300"
              className="max-w-54"
            >
              Turn on/off link sharing to let others view or edit this document.
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
