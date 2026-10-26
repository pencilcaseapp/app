import { useEffect, useId, useRef, useState, type FC } from 'react';
import { href, useFetcher } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import {
  DOCUMENT_REPORT_REASONS,
  documentReportCopies,
  documentReportReasonLabels,
  MAX_DOCUMENT_REPORT_DETAILS_LENGTH,
  type DocumentReportReason,
} from '~/constants/document';
import { useEmitToast } from '~/hooks/use-toast';
import type { action as reportAction } from '~/routes/doc-report';
import { Button } from '~/ui/button/button';
import { RadioGroup } from '~/ui/radio-group/radio-group';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '~/ui/responsive-dialog/responsive-dialog';
import { ResponsiveDialogContent } from '~/ui/responsive-dialog/responsive-dialog-content';
import { ResponsiveDialogContentInner } from '~/ui/responsive-dialog/responsive-dialog-content-inner';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';
import { TextArea } from '~/ui/text-area/text-area';
import { Typography } from '~/ui/typography/typography';

const REASON_ITEMS = DOCUMENT_REPORT_REASONS.map(reason => ({
  value: reason,
  label: documentReportReasonLabels[reason],
}));

export interface ReportDocumentDialogProps {
  documentId: string;
  /** Where a signed out visitor signs in first; null when signed in. */
  signInUrl: string | null;
}

/*
 * What the top bar offers in place of Share on a document somebody else
 * owns: a report to us, which the app stores ask of content people share
 * with each other. On mobile it opens as tall as the sidebar, like the
 * delete sheet.
 */
export const ReportDocumentDialog: FC<ReportDocumentDialogProps> = ({
  documentId,
  signInUrl,
}) => {
  const [open, setOpen] = useState(false);
  const [closings, setClosings] = useState(0);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          setClosings(count => count + 1);
        }
      }}
    >
      <ResponsiveDialogTrigger
        render={(
          <Button
            type="button"
            icon="flag"
            colorLight="glass"
            hideLabelOnMobile
          >
            Report
          </Button>
        )}
      />
      <ResponsiveDialogContent
        minHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
      >
        {signInUrl
          ? <SignInToReport signInUrl={signInUrl} />
          : (
              <ReportForm
                // Starts afresh each time it opens.
                key={closings}
                documentId={documentId}
                onSent={() => setOpen(false)}
              />
            )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

const ReportTitle: FC = () => (
  <ResponsiveDialogTitle
    className="mb-2"
    render={<Typography variant="heading3" as="h2" />}
  >
    Report document
  </ResponsiveDialogTitle>
);

const ReportDescription: FC<{ children: string }> = ({ children }) => (
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
    {children}
  </ResponsiveDialogDescription>
);

const CancelButton: FC = () => (
  <ResponsiveDialogClose
    render={(
      <Button type="button" colorLight="transparent">
        Cancel
      </Button>
    )}
  />
);

const ReportForm: FC<{ documentId: string; onSent: () => void }> = ({
  documentId,
  onSent,
}) => {
  const formId = useId();
  const fetcher = useFetcher<typeof reportAction>();
  const handledRef = useRef(fetcher.data);
  const emitToast = useEmitToast();
  const [reason, setReason] = useState<DocumentReportReason>();

  useEffect(() => {
    if (!fetcher.data?.ok || fetcher.data === handledRef.current) {
      return;
    }

    handledRef.current = fetcher.data;
    emitToast({ type: 'success', title: documentReportCopies.sent });
    onSent();
  }, [fetcher.data, emitToast, onSent]);

  const error = fetcher.data && !fetcher.data.ok ? fetcher.data.error : null;

  return (
    <ResponsiveDialogContentInner
      footerArea={(
        <div className="flex items-center justify-end gap-2">
          <CancelButton />
          <Button
            type="submit"
            form={formId}
            colorLight="red-500"
            disabled={!reason}
            isLoading={fetcher.state !== 'idle'}
          >
            Report
          </Button>
        </div>
      )}
    >
      <ReportTitle />
      <ReportDescription>
        Tell us what is wrong with this document. We look into every report
        and remove what breaks our terms. The owner is not told who reported
        it.
      </ReportDescription>
      <fetcher.Form
        id={formId}
        method="post"
        action={href('/doc/:id/report', { id: documentId })}
        className="mt-5 flex flex-col gap-5"
      >
        <AuthenticityTokenInput />
        <RadioGroup
          name="reason"
          label="Reason"
          items={REASON_ITEMS}
          value={reason}
          onValueChange={setReason}
        />
        <TextArea
          id={`${formId}-details`}
          name="details"
          label="Details"
          hint="Optional. Anything that helps us find the problem."
          maxLength={MAX_DOCUMENT_REPORT_DETAILS_LENGTH}
        />
        {error && (
          <Typography
            as="p"
            variant="bodyTiny"
            textColorLight="red-500"
            textColorDark="red-500"
            role="alert"
          >
            {error}
          </Typography>
        )}
      </fetcher.Form>
    </ResponsiveDialogContentInner>
  );
};

const SignInToReport: FC<{ signInUrl: string }> = ({ signInUrl }) => (
  <ResponsiveDialogContentInner
    footerArea={(
      <div className="flex items-center justify-end gap-2">
        <CancelButton />
        <Button as="a" href={signInUrl}>Sign in</Button>
      </div>
    )}
  >
    <ReportTitle />
    <ReportDescription>
      Sign in to report this document, so we can get back to you about it.
      It opens again right after.
    </ReportDescription>
  </ResponsiveDialogContentInner>
);
