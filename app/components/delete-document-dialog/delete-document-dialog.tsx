import type { FC } from 'react';
import { Button } from '~/ui/button/button';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '~/ui/responsive-dialog/responsive-dialog';
import { ResponsiveDialogContent } from '~/ui/responsive-dialog/responsive-dialog-content';
import { Typography } from '~/ui/typography/typography';

export interface DeleteDocumentDialogProps {
  documentTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/*
 * Render it inside the sidebar's drawer tree: on mobile it then opens
 * as a drawer stacked on top of the sidebar, everywhere else as the
 * centered dialog.
 */
export const DeleteDocumentDialog: FC<DeleteDocumentDialogProps> = ({
  documentTitle,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const description = `“${documentTitle}” will be deleted for`
    + ' everyone it is shared with.';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        minHeight="40dvh"
        footerArea={(
          <div className="flex items-center justify-end gap-2">
            <ResponsiveDialogClose
              render={<Button colorLight="secondary">Cancel</Button>}
            />
            <Button colorLight="danger" onClick={onConfirm}>
              Delete
            </Button>
          </div>
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
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
