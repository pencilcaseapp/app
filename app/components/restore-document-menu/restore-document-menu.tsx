import type { FC } from 'react';
import { href, useFetcher } from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import { DropdownMenu } from '~/ui/dropdown-menu/dropdown-menu';
import { DropdownMenuContent } from '~/ui/dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '~/ui/dropdown-menu/dropdown-menu-item';
import { DropdownMenuPortal } from '~/ui/dropdown-menu/dropdown-menu-portal';
import { DropdownMenuTrigger } from '~/ui/dropdown-menu/dropdown-menu-trigger';

export interface RestoreDocumentMenuProps {
  documentId: string;
  defaultOpen?: boolean;
}

/*
 * The row menu of a deleted document in the sidebar: restoring is its
 * only action, posted to the restore route.
 */
export const RestoreDocumentMenu: FC<RestoreDocumentMenuProps> = ({
  documentId,
  defaultOpen,
}) => {
  const fetcher = useFetcher();
  const csrfToken = useAuthenticityToken();

  const restore = () => {
    void fetcher.submit(
      { csrf: csrfToken },
      { method: 'post', action: href('/doc/:id/restore', { id: documentId }) },
    );
  };

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
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
};
