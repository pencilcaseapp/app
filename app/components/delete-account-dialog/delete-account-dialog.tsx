import { useState, type FC } from 'react';
import { Form, href, useLocation } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
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

export interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The last day signing in restores the account, written out. */
  restoreUntil: string;
}

/*
 * Asks before the account goes. Confirming posts to the deletion as a
 * document request rather than a fetch: the deletion closes the live
 * connection of the document behind the dialog, and the revalidation that
 * sets off, signed out by then, would land on the sign in page without the
 * notice before the client side redirect does. A failure comes back to
 * the page the dialog was opened on with a toast. Rendered inside
 * the settings dialog, it stacks on it as a dialog or, on mobile, as a
 * drawer as tall as the settings drawer.
 */
export const DeleteAccountDialog: FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
  restoreUntil,
}) => {
  const location = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        minHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
      >
        <ResponsiveDialogContentInner
          footerArea={(
            <Form
              method="post"
              action={href('/account/delete')}
              reloadDocument
              className="flex items-center justify-end gap-2"
              onSubmit={() => setIsDeleting(true)}
            >
              <AuthenticityTokenInput />
              <input
                type="hidden"
                name="returnTo"
                value={location.pathname}
              />
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
                isLoading={isDeleting}
              >
                Delete account
              </Button>
            </Form>
          )}
        >
          <ResponsiveDialogTitle
            className="mb-2"
            render={<Typography variant="heading3" as="h2" />}
          >
            Delete your account?
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription
            render={(
              <Typography
                variant="bodySmall"
                as="div"
                textColorLight="grey-600"
                textColorDark="grey-400"
                className="flex flex-col gap-3 text-pretty"
              />
            )}
          >
            <p>
              This signs you out on all your devices. Documents you shared
              are no longer available to the people you shared them with.
            </p>
            <p>
              <strong className="font-semibold text-pca-grey-900 dark:text-pca-white">
                Changed your mind? Sign in again by
                {' '}
                {restoreUntil}
                {' '}
                to restore everything.
              </strong>
              {' '}
              After that your account, your documents and their images are
              permanently deleted.
            </p>
          </ResponsiveDialogDescription>
        </ResponsiveDialogContentInner>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
