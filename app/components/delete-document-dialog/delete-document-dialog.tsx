import { useEffect, useRef, useState, type FC } from 'react';
import { href, useFetcher, useNavigate, useParams } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { DELETED_DOCUMENT_RETENTION_DAYS } from '~/constants/document';
import { useLeavingDocument } from '~/contexts/leaving-document';
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
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';
import { Typography } from '~/ui/typography/typography';

export interface DocumentToDelete {
  id: string;
  title: string;
  /**
   * Published by link or shared with invited people, who lose the
   * document as well.
   */
  shared: boolean;
  /**
   * Somebody else's document is only removed from the user's own
   * documents, it stays as it is for everybody else.
   */
  isOwner: boolean;
}

export interface DeleteDocumentDialogProps {
  /**
   * Keep it set while the dialog animates out, so the title does not
   * vanish from the copy mid-close.
   */
  document: DocumentToDelete | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/*
 * Render it inside the sidebar's drawer tree: on mobile it then opens
 * as a drawer stacked on top of the sidebar, as tall as the sidebar so
 * the sheet behind does not resize, everywhere else as the centered
 * dialog.
 *
 * Keep it mounted before there is a document to delete: a drawer that
 * mounts already open skips its slide in.
 */
export const DeleteDocumentDialog: FC<DeleteDocumentDialogProps> = ({
  document,
  open,
  onOpenChange,
}) => {
  const [closings, setClosings] = useState(0);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          setClosings(count => count + 1);
        }
      }}
    >
      {document && (
        <DeleteDocumentDialogContent
          // Starts afresh each time, the last one stays busy until the
          // sheet is gone.
          key={closings}
          {...document}
          onOpenChange={onOpenChange}
        />
      )}
    </ResponsiveDialog>
  );
};

const DeleteDocumentDialogContent: FC<
  DocumentToDelete & Pick<DeleteDocumentDialogProps, 'onOpenChange'>
> = ({
  id: documentId,
  title: documentTitle,
  shared,
  isOwner,
  onOpenChange,
}) => {
  const fetcher = useFetcher<typeof deleteAction>();
  const navigate = useNavigate();
  const params = useParams();
  const handledRef = useRef(fetcher.data);
  const [isClosing, setIsClosing] = useState(false);
  const { setLeavingDocument } = useLeavingDocument();

  // Close once the result is back and the navigation revalidated, so the
  // list does not change behind the sheet.
  useEffect(() => {
    if (
      fetcher.state !== 'idle'
      || !fetcher.data
      || fetcher.data === handledRef.current
    ) {
      return;
    }
    handledRef.current = fetcher.data;
    setIsClosing(true);

    const close = () => {
      setLeavingDocument(null);
      onOpenChange(false);
    };

    if (params.id !== fetcher.data.id) {
      close();
      return;
    }

    // The start page opens the most recently edited document instead.
    void Promise.resolve(navigate(href('/'), { replace: true })).then(close);
  }, [
    fetcher.state,
    fetcher.data,
    onOpenChange,
    navigate,
    params.id,
    setLeavingDocument,
  ]);

  const ownerDescription = (shared
    ? `“${documentTitle}” will be deleted for everyone it is shared with.`
    : `“${documentTitle}” will be moved to Deleted.`)
  + ` You can restore it from Deleted for ${DELETED_DOCUMENT_RETENTION_DAYS}`
  + ' days, after that it is permanently deleted.';
  const description = isOwner
    ? ownerDescription
    : `“${documentTitle}” will be removed from your documents. It is not`
      + ' deleted for the owner or anyone else it is shared with.';

  return (
    <ResponsiveDialogContent
      minHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
      maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
    >
      <ResponsiveDialogContentInner
        footerArea={(
          <fetcher.Form
            method="post"
            action={href(
              isOwner ? '/doc/:id/delete' : '/doc/:id/leave',
              { id: documentId },
            )}
            className="flex items-center justify-end gap-2"
            onSubmit={() => setLeavingDocument(documentId)}
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
              isLoading={fetcher.state !== 'idle' || isClosing}
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
  );
};
