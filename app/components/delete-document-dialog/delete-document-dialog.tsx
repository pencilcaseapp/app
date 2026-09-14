import { useEffect, useRef, type FC } from 'react';
import { href, useFetcher } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import type { action as deleteAction } from '~/routes/doc-delete';
import { Button } from '~/ui/button/button';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '~/ui/responsive-dialog/responsive-dialog';
import { ResponsiveDialogContent } from '~/ui/responsive-dialog/responsive-dialog-content';
import { ResponsiveDialogContentInner } from '~/ui/responsive-dialog/responsive-dialog-content-inner';
import { Typography } from '~/ui/typography/typography';

export interface DeleteDocumentDialogProps {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once the document is deleted, right before the dialog closes. */
  onDeleted?: (documentId: string) => void;
}

/*
 * Render it inside the sidebar's drawer tree: on mobile it then opens
 * as a drawer stacked on top of the sidebar, everywhere else as the
 * centered dialog.
 */
export const DeleteDocumentDialog: FC<DeleteDocumentDialogProps> = ({
  documentId,
  documentTitle,
  open,
  onOpenChange,
  onDeleted,
}) => {
  // One fetcher per document, so a result never carries over to the
  // next document the dialog opens for.
  const fetcher = useFetcher<typeof deleteAction>({
    key: `delete-document-${documentId}`,
  });
  const deletedId = fetcher.data?.id;
  const handledIdRef = useRef<string>(undefined);

  useEffect(() => {
    if (!deletedId || handledIdRef.current === deletedId) {
      return;
    }

    handledIdRef.current = deletedId;
    onDeleted?.(deletedId);
    onOpenChange(false);
  }, [deletedId, onDeleted, onOpenChange]);

  const description = `“${documentTitle}” will be deleted for`
    + ' everyone it is shared with.';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent minHeight="40dvh">
        <ResponsiveDialogContentInner
          footerArea={(
            <fetcher.Form
              method="post"
              action={href('/doc/:id/delete', { id: documentId })}
              className="flex items-center justify-end gap-2"
            >
              <AuthenticityTokenInput />
              <ResponsiveDialogClose
                render={(
                  <Button type="button" colorLight="transparent">
                    Cancel
                  </Button>
                )}
              />
              <Button
                type="submit"
                colorLight="red-500"
                isLoading={fetcher.state !== 'idle'}
              >
                Delete
              </Button>
            </fetcher.Form>
          )}
        >
          <ResponsiveDialogTitle
            className="mb-2"
            render={<Typography variant="heading3" as="h2" />}
          >
            Delete document
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription
            render={(
              <Typography
                variant="bodySmall"
                as="p"
                textColorLight="grey-600"
                textColorDark="grey-400"
              />
            )}
          >
            {description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogContentInner>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
